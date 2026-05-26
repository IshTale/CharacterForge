import type { ReactNode } from "react";

interface MakeupEffectPanelProps {
  title: string;
  children?: ReactNode;
}

export default function MakeupEffectPanel({ title, children }: MakeupEffectPanelProps) {
  return (
    <section className="beauty-panel p-3">
      <h3 className="mb-2 text-sm font-semibold text-plum-900">{title}</h3>
      {children}
    </section>
  );
}
