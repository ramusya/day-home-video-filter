import { forwardRef } from 'react';

export type PreviewCanvasProps = {
  hasImage: boolean;
};

export const PreviewCanvas = forwardRef<HTMLCanvasElement, PreviewCanvasProps>(function PreviewCanvas(
  { hasImage },
  ref
) {
  return (
    <section className="card preview-card">
      <div className="section-header">
        <h2>Preview</h2>
        <p>4:3 output, ready for 1600×1200 JPEG export.</p>
      </div>

      <div className="preview-frame">
        <canvas aria-label="Processed preview" ref={ref} />
        {!hasImage ? (
          <div className="preview-empty">
            <p>Select a photo to generate the daytime home video look.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
});
