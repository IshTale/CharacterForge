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
    <section className="space-y-4 rounded-xl border border-gray-700 bg-gray-900/40 p-4 shadow-lg">
      <ColorPicker value={color} onChange={onColorChange} />
      <IntensitySlider value={intensity} onChange={onIntensityChange} />
      <TextureSelector selected={texture} onSelect={onTextureChange} />
    </section>
  );
}
