import type { ReactNode } from "react";

const modules = ["Upload", "Wardrobe", "Makeup", "Hair", "Nails"];

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen grid-cols-12">
      <aside className="col-span-3 border-r border-gray-800 p-6">
        <h2 className="text-xl font-semibold">Design Studio</h2>
        <ul className="mt-4 space-y-2 text-sm text-gray-300">
          {modules.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </aside>
      <section className="col-span-9 p-6">{children}</section>
    </main>
  );
}
