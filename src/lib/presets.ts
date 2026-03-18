import type { FilterSettings, PresetKey } from '../types';

export const PRESET_LABELS: Record<PresetKey, string> = {
  weak: 'Weak',
  normal: 'Normal',
  strong: 'Strong'
};

export const PRESET_SETTINGS: Record<PresetKey, FilterSettings> = {
  weak: {
    bloom: 0.26,
    aging: 0.22,
    softness: 0.16,
    darkNoise: 0.12,
    timestampEnabled: true
  },
  normal: {
    bloom: 0.42,
    aging: 0.34,
    softness: 0.24,
    darkNoise: 0.18,
    timestampEnabled: true
  },
  strong: {
    bloom: 0.62,
    aging: 0.5,
    softness: 0.36,
    darkNoise: 0.28,
    timestampEnabled: true
  }
};

export function clonePreset(preset: PresetKey): FilterSettings {
  return { ...PRESET_SETTINGS[preset] };
}
