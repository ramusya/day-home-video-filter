import type { FilterSettings, PresetKey } from '../types';
import { PRESET_LABELS } from '../lib/presets';

export type ControlsPanelProps = {
  preset: PresetKey;
  settings: FilterSettings;
  onPresetChange: (preset: PresetKey) => void;
  onSliderChange: (key: keyof Omit<FilterSettings, 'timestampEnabled'>, value: number) => void;
  onTimestampChange: (enabled: boolean) => void;
};

const SLIDER_CONFIG = [
  { key: 'bloom', label: 'Highlight bloom' },
  { key: 'aging', label: 'Color aging' },
  { key: 'softness', label: 'Softness' },
  { key: 'darkNoise', label: 'Dark noise' }
] as const;

export function ControlsPanel({
  preset,
  settings,
  onPresetChange,
  onSliderChange,
  onTimestampChange
}: ControlsPanelProps) {
  return (
    <section className="card controls-card">
      <div className="section-header">
        <h2>Look controls</h2>
        <p>Normal is tuned to be the default daytime camcorder look.</p>
      </div>

      <div className="preset-grid" role="group" aria-label="Preset intensity">
        {(Object.keys(PRESET_LABELS) as PresetKey[]).map((presetKey) => (
          <button
            key={presetKey}
            className={`preset-button ${presetKey === preset ? 'is-active' : ''}`}
            onClick={() => onPresetChange(presetKey)}
            type="button"
          >
            {PRESET_LABELS[presetKey]}
          </button>
        ))}
      </div>

      <div className="slider-list">
        {SLIDER_CONFIG.map(({ key, label }) => {
          const currentValue = settings[key];
          return (
            <label key={key} className="slider-row">
              <div className="slider-label-row">
                <span>{label}</span>
                <span>{Math.round(currentValue * 100)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(currentValue * 100)}
                onChange={(event) => onSliderChange(key, Number(event.target.value) / 100)}
              />
            </label>
          );
        })}
      </div>

      <label className="toggle-row">
        <span>Timestamp</span>
        <input
          checked={settings.timestampEnabled}
          onChange={(event) => onTimestampChange(event.target.checked)}
          type="checkbox"
        />
      </label>
    </section>
  );
}
