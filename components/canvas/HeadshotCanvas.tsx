interface HeadshotCanvasProps {
  imageUrl?: string | null;
}

export default function HeadshotCanvas({ imageUrl }: HeadshotCanvasProps) {
  return (
    <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border border-canvas-headshot/50 bg-black/20">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="Headshot canvas" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-sm text-gray-400">Headshot Preview</div>
      )}
    </div>
  );
}
