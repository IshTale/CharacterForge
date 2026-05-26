interface FeetCanvasProps {
  imageUrl?: string | null;
}

export default function FeetCanvas({ imageUrl }: FeetCanvasProps) {
  return (
    <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-canvas-feet/60 bg-white/60 shadow-sm">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="Feet canvas" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-sm text-plum-700/60">Feet Preview</div>
      )}
    </div>
  );
}
