import type { FilterSettings, RenderOptions } from '../types';

const clamp = (value: number, min = 0, max = 255): number => Math.min(max, Math.max(min, value));

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getCoverCrop(sourceWidth: number, sourceHeight: number, targetWidth: number, targetHeight: number) {
  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = targetWidth / targetHeight;

  if (sourceAspect > targetAspect) {
    const cropWidth = sourceHeight * targetAspect;
    return {
      sx: (sourceWidth - cropWidth) / 2,
      sy: 0,
      sw: cropWidth,
      sh: sourceHeight
    };
  }

  const cropHeight = sourceWidth / targetAspect;
  return {
    sx: 0,
    sy: (sourceHeight - cropHeight) / 2,
    sw: sourceWidth,
    sh: cropHeight
  };
}

function drawBaseImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  softness: number
) {
  const crop = getCoverCrop(image.naturalWidth, image.naturalHeight, width, height);

  // Important: softness is done by drawing through a slightly smaller buffer.
  // This avoids a harsh digital look and works reliably in Safari.
  if (softness > 0.01) {
    const scale = Math.max(0.72, 1 - softness * 0.35);
    const softCanvas = createCanvas(Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)));
    const softCtx = softCanvas.getContext('2d');

    if (!softCtx) {
      ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);
      return;
    }

    softCtx.imageSmoothingEnabled = true;
    softCtx.imageSmoothingQuality = 'high';
    softCtx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, softCanvas.width, softCanvas.height);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(softCanvas, 0, 0, softCanvas.width, softCanvas.height, 0, 0, width, height);
    return;
  }

  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);
}

function applyPixelAdjustments(ctx: CanvasRenderingContext2D, width: number, height: number, settings: FilterSettings) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    let r = data[index];
    let g = data[index + 1];
    let b = data[index + 2];

    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

    // Soft highlight roll-off with a little extra lift for bright daytime scenes.
    if (settings.bloom > 0) {
      const brightAmount = Math.max(0, (luminance - 0.68) / 0.32);
      const boost = Math.pow(brightAmount, 1.6) * settings.bloom * 48;
      r += boost;
      g += boost * 0.98;
      b += boost * 0.92;
    }

    // Color aging: slightly warmer, slightly less saturated, slightly flatter.
    if (settings.aging > 0) {
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const saturation = 1 - settings.aging * 0.2;
      r = luma + (r - luma) * saturation + settings.aging * 10;
      g = luma + (g - luma) * saturation + settings.aging * 4;
      b = luma + (b - luma) * saturation - settings.aging * 10;

      const flatten = settings.aging * 0.04;
      r = r * (1 - flatten) + 128 * flatten;
      g = g * (1 - flatten) + 128 * flatten;
      b = b * (1 - flatten) + 128 * flatten;
    }

    // Dark-area noise keeps the effect subtle and away from bright skin/highlights.
    if (settings.darkNoise > 0 && luminance < 0.58) {
      const darkWeight = Math.pow(1 - luminance / 0.58, 1.4);
      const noise = (Math.random() - 0.5) * settings.darkNoise * darkWeight * 34;
      r += noise;
      g += noise * 0.95;
      b += noise * 1.05;
    }

    data[index] = clamp(r);
    data[index + 1] = clamp(g);
    data[index + 2] = clamp(b);
  }

  ctx.putImageData(imageData, 0, 0);
}

function applyBloomOverlay(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number) {
  if (amount <= 0.01) {
    return;
  }

  const sourceData = ctx.getImageData(0, 0, width, height);
  const bloomCanvas = createCanvas(width, height);
  const bloomCtx = bloomCanvas.getContext('2d');

  if (!bloomCtx) {
    return;
  }

  const bloomData = bloomCtx.createImageData(width, height);

  for (let index = 0; index < sourceData.data.length; index += 4) {
    const r = sourceData.data[index];
    const g = sourceData.data[index + 1];
    const b = sourceData.data[index + 2];
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const bright = Math.max(0, (luminance - 0.66) / 0.34);
    const alpha = clamp(bright * amount * 255 * 0.55);

    bloomData.data[index] = r;
    bloomData.data[index + 1] = g;
    bloomData.data[index + 2] = b;
    bloomData.data[index + 3] = alpha;
  }

  bloomCtx.putImageData(bloomData, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.35 + amount * 0.2;

  // Safari supports canvas filter on drawImage; this gives the slight camcorder glow.
  if ('filter' in ctx) {
    ctx.filter = `blur(${1.5 + amount * 4}px)`;
  }

  ctx.drawImage(bloomCanvas, 0, 0);
  ctx.restore();
}

function drawTimestamp(ctx: CanvasRenderingContext2D, width: number, height: number, timestampText: string) {
  const fontSize = Math.max(18, Math.round(width * 0.026));
  const paddingX = Math.round(fontSize * 0.55);
  const paddingY = Math.round(fontSize * 0.34);
  const x = width - Math.round(width * 0.03);
  const y = height - Math.round(height * 0.035);

  ctx.save();
  ctx.font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';

  const metrics = ctx.measureText(timestampText);
  const boxWidth = metrics.width + paddingX * 2;
  const boxHeight = fontSize + paddingY * 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.fillRect(x - boxWidth, y - boxHeight + paddingY * 0.5, boxWidth, boxHeight);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 4;
  ctx.fillStyle = '#f2bf59';
  ctx.fillText(timestampText, x - paddingX, y - paddingY * 0.2);
  ctx.restore();
}

export function renderProcessedImage(
  image: HTMLImageElement,
  targetCanvas: HTMLCanvasElement,
  settings: FilterSettings,
  options: RenderOptions
) {
  const { width, height, timestampText } = options;
  targetCanvas.width = width;
  targetCanvas.height = height;

  const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Unable to access 2D canvas context.');
  }

  ctx.clearRect(0, 0, width, height);
  drawBaseImage(ctx, image, width, height, settings.softness);
  applyPixelAdjustments(ctx, width, height, settings);
  applyBloomOverlay(ctx, width, height, settings.bloom);

  if (settings.timestampEnabled && timestampText) {
    drawTimestamp(ctx, width, height, timestampText);
  }
}

export async function exportCanvasAsJpeg(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to export JPEG.'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      quality
    );
  });
}
