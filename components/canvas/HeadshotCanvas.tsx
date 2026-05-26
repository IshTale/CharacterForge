interface HeadshotCanvasProps {
  imageUrl?: string | null;
}

export default function HeadshotCanvas({ imageUrl }: HeadshotCanvasProps) {
  return (
    <div className="aspect-[3/4] w-full overflow-hidden rounded-xl border border-canvas-headshot/50 bg-white/60 shadow-sm">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="Headshot canvas" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-sm text-plum-700/60">Headshot Preview</div>
      )}
    </div>
  );
}
