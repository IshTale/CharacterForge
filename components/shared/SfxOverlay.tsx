interface SfxOverlayProps {
  textureUrl?: string;
  opacity?: number;
}

export default function SfxOverlay({ textureUrl, opacity = 0.5 }: SfxOverlayProps) {
  if (!textureUrl) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={textureUrl}
      alt="SFX overlay"
      className="pointer-events-none absolute inset-0 h-full w-full object-cover mix-blend-multiply"
      style={{ opacity }}
    />
  );
}
