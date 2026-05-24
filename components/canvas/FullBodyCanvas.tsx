interface FullBodyCanvasProps {
  imageUrl?: string | null;
}

export default function FullBodyCanvas({ imageUrl }: FullBodyCanvasProps) {
  return (
    <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border border-canvas-fullbody/50 bg-black/20">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="Full body canvas" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-sm text-gray-400">Full Body Preview</div>
      )}
    </div>
  );
}
