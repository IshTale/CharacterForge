interface FeetCanvasProps {
  imageUrl?: string | null;
}

export default function FeetCanvas({ imageUrl }: FeetCanvasProps) {
  return (
    <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-canvas-feet/50 bg-black/20">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="Feet canvas" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-sm text-gray-400">Feet Preview</div>
      )}
    </div>
  );
}
