import type { ReactNode } from "react";

interface MakeupEffectPanelProps {
  title: string;
  headerAction?: ReactNode;
  children?: ReactNode;
}

export default function MakeupEffectPanel({ title, headerAction, children }: MakeupEffectPanelProps) {
  return (
    <section className="beauty-panel p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-plum-900">{title}</h3>
        {headerAction}
      </div>
      {children}
    </section>
  );
}
