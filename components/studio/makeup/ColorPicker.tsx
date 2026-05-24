"use client";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <input
      type="color"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-16 rounded border border-gray-700 bg-transparent"
    />
  );
}
