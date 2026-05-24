import type { ReactNode } from "react";

interface MakeupEffectPanelProps {
  title: string;
  children?: ReactNode;
}

export default function MakeupEffectPanel({ title, children }: MakeupEffectPanelProps) {
  return (
    <section className="rounded border border-gray-700 p-3">
      <h3 className="mb-2 text-sm font-medium text-gray-200">{title}</h3>
      {children}
    </section>
  );
}
