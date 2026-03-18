export type PresetKey = 'weak' | 'normal' | 'strong';

export type FilterSettings = {
  bloom: number;
  aging: number;
  softness: number;
  darkNoise: number;
  timestampEnabled: boolean;
};

export type LoadedImage = {
  file: File;
  image: HTMLImageElement;
  objectUrl: string;
};

export type RenderOptions = {
  width: number;
  height: number;
  timestampText?: string;
};
