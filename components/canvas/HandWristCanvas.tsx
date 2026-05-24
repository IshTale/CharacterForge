interface HandWristCanvasProps {
  imageUrl?: string | null;
}

export default function HandWristCanvas({ imageUrl }: HandWristCanvasProps) {
  return (
    <div className="aspect-square w-full overflow-hidden rounded-lg border border-canvas-hand/50 bg-black/20">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="Hand and wrist canvas" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-sm text-gray-400">Hand & Wrist Preview</div>
      )}
    </div>
  );
}
