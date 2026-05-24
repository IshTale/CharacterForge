import ColorPicker from "@/components/studio/makeup/ColorPicker";
import IntensitySlider from "@/components/studio/makeup/IntensitySlider";
import TextureSelector from "@/components/studio/makeup/TextureSelector";

interface NailConfigPanelProps {
  color: string;
  intensity: number;
  texture?: string;
  onColorChange: (color: string) => void;
  onIntensityChange: (value: number) => void;
  onTextureChange: (texture: string) => void;
}

export default function NailConfigPanel({
  color,
  intensity,
  texture,
  onColorChange,
  onIntensityChange,
  onTextureChange
}: NailConfigPanelProps) {
  return (
    <section className="space-y-3 rounded border border-gray-700 p-3">
      <ColorPicker value={color} onChange={onColorChange} />
      <IntensitySlider value={intensity} onChange={onIntensityChange} />
      <TextureSelector selected={texture} onSelect={onTextureChange} />
    </section>
  );
}
