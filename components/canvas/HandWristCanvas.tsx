interface HandWristCanvasProps {
  imageUrl?: string | null;
}

export default function HandWristCanvas({ imageUrl }: HandWristCanvasProps) {
  return (
    <div className="aspect-square w-full overflow-hidden rounded-xl border border-canvas-hand/60 bg-white/60 shadow-sm">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="Hand and wrist canvas" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-sm text-plum-700/60">Hand & Wrist Preview</div>
      )}
    </div>
  );
}
