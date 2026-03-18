import { useEffect, useMemo, useRef, useState } from 'react';
import { FilePicker } from './components/FilePicker';
import { ControlsPanel } from './components/ControlsPanel';
import { PreviewCanvas } from './components/PreviewCanvas';
import { exportCanvasAsJpeg, renderProcessedImage } from './lib/imageProcessing';
import { clonePreset } from './lib/presets';
import { formatTimestamp } from './lib/timestamp';
import type { FilterSettings, LoadedImage, PresetKey } from './types';

const PREVIEW_WIDTH = 800;
const PREVIEW_HEIGHT = 600;
const EXPORT_WIDTH = 1600;
const EXPORT_HEIGHT = 1200;

async function loadImageFromFile(file: File): Promise<LoadedImage> {
  const objectUrl = URL.createObjectURL(file);

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const nextImage = new Image();
    nextImage.onload = () => resolve(nextImage);
    nextImage.onerror = () => reject(new Error('Image could not be loaded.'));
    nextImage.src = objectUrl;
  });

  return { file, image, objectUrl };
}

export default function App() {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [preset, setPreset] = useState<PresetKey>('normal');
  const [settings, setSettings] = useState<FilterSettings>(() => clonePreset('normal'));
  const [loadedImage, setLoadedImage] = useState<LoadedImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const timestampText = useMemo(() => {
    if (!loadedImage) {
      return formatTimestamp();
    }

    return formatTimestamp(loadedImage.file.lastModified || Date.now());
  }, [loadedImage]);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const nextLoadedImage = await loadImageFromFile(file);

      setLoadedImage((current) => {
        if (current) {
          URL.revokeObjectURL(current.objectUrl);
        }
        return nextLoadedImage;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Image could not be loaded.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetChange = (nextPreset: PresetKey) => {
    setPreset(nextPreset);
    setSettings(clonePreset(nextPreset));
  };

  const handleSliderChange = (key: keyof Omit<FilterSettings, 'timestampEnabled'>, value: number) => {
    setSettings((current) => ({
      ...current,
      [key]: value
    }));
  };

  const handleTimestampChange = (enabled: boolean) => {
    setSettings((current) => ({
      ...current,
      timestampEnabled: enabled
    }));
  };

  useEffect(() => {
    const previewCanvas = previewCanvasRef.current;

    if (!previewCanvas || !loadedImage) {
      return;
    }

    // Small debounce keeps slider drags smooth on mobile Safari.
    const renderTimer = window.setTimeout(() => {
      renderProcessedImage(loadedImage.image, previewCanvas, settings, {
        width: PREVIEW_WIDTH,
        height: PREVIEW_HEIGHT,
        timestampText
      });
    }, 30);

    return () => window.clearTimeout(renderTimer);
  }, [loadedImage, settings, timestampText]);

  useEffect(() => {
    return () => {
      setLoadedImage((current) => {
        if (current) {
          URL.revokeObjectURL(current.objectUrl);
        }
        return null;
      });
    };
  }, []);

  const handleExport = async () => {
    if (!loadedImage) {
      return;
    }

    setIsExporting(true);
    setErrorMessage('');

    try {
      // Important: export is rendered again at the final 1600x1200 resolution.
      const exportCanvas = document.createElement('canvas');
      renderProcessedImage(loadedImage.image, exportCanvas, settings, {
        width: EXPORT_WIDTH,
        height: EXPORT_HEIGHT,
        timestampText
      });

      const blob = await exportCanvasAsJpeg(exportCanvas, 0.92);
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const sourceName = loadedImage.file.name.replace(/\.[^.]+$/, '');

      link.href = downloadUrl;
      link.download = `${sourceName}-day-home-video.jpg`;
      link.click();

      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed.';
      setErrorMessage(message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">React + TypeScript + Vite</p>
        <h1>Day Home Video Filter</h1>
        <p className="hero-copy">
          Mobile-first photo tool for the normal 1998–2005 daytime camcorder look. No glitch, no fake tape damage.
        </p>
      </header>

      <main className="layout">
        <FilePicker disabled={isLoading} onSelect={handleFileSelect} />

        <PreviewCanvas hasImage={Boolean(loadedImage)} ref={previewCanvasRef} />

        {loadedImage ? (
          <div className="meta-row">
            <span className="meta-chip">{loadedImage.file.name}</span>
            <span className="meta-chip">Timestamp: {settings.timestampEnabled ? 'On' : 'Off'}</span>
          </div>
        ) : null}

        <ControlsPanel
          preset={preset}
          settings={settings}
          onPresetChange={handlePresetChange}
          onSliderChange={handleSliderChange}
          onTimestampChange={handleTimestampChange}
        />

        <section className="card export-card">
          <div className="section-header">
            <h2>Export</h2>
            <p>JPEG at 1600×1200.</p>
          </div>
          <button
            className="export-button"
            disabled={!loadedImage || isLoading || isExporting}
            onClick={handleExport}
            type="button"
          >
            {isExporting ? 'Exporting…' : 'Export JPEG'}
          </button>
          {errorMessage ? <p className="message error">{errorMessage}</p> : null}
          {!errorMessage && loadedImage ? (
            <p className="message subtle">The selected preset is only a starting point. Sliders can fine-tune the look.</p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
