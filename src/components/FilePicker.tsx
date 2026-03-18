import type { ChangeEvent } from 'react';

export type FilePickerProps = {
  onSelect: (file: File) => void;
  disabled?: boolean;
};

export function FilePicker({ onSelect, disabled = false }: FilePickerProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      onSelect(file);
    }

    // Reset the input so the same file can be chosen again after edits.
    event.currentTarget.value = '';
  };

  return (
    <label className="picker-card">
      <span className="picker-title">Select photo</span>
      <span className="picker-copy">Choose a JPEG, PNG, or HEIC-converted browser image.</span>
      <input accept="image/*" capture="environment" disabled={disabled} onChange={handleChange} type="file" />
    </label>
  );
}
