"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import FeetCanvas from "@/components/canvas/FeetCanvas";
import FullBodyCanvas from "@/components/canvas/FullBodyCanvas";
import HandWristCanvas from "@/components/canvas/HandWristCanvas";
import HeadshotCanvas from "@/components/canvas/HeadshotCanvas";
import { useCharacterForgeStore } from "@/store/characterforge.store";

interface StudioShellProps {
  children: ReactNode;
}

const modules = [
  { href: "/studio/upload", label: "Upload" },
  { href: "/studio/wardrobe", label: "Wardrobe" },
  { href: "/studio/makeup", label: "Makeup" },
  { href: "/studio/hair", label: "Hair" },
  { href: "/studio/nails", label: "Nails" }
];

export default function StudioShell({ children }: StudioShellProps) {
  const canvases = useCharacterForgeStore((state) => state.canvases);
  return (
    <main className="grid min-h-screen grid-cols-12">
      <aside className="col-span-3 border-r border-gray-800 p-6">
        <h2 className="text-xl font-semibold">Design Studio</h2>
        <ul className="mt-4 space-y-2 text-sm text-gray-300">
          {modules.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="hover:text-white">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <section className="col-span-6 p-6">{children}</section>
      <aside className="col-span-3 border-l border-gray-800 p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-300">Canvas Preview</h3>
        <div className="space-y-2">
          <HeadshotCanvas imageUrl={canvases.headshot.current_image_url} />
          <FullBodyCanvas imageUrl={canvases.fullbody.current_image_url} />
          <HandWristCanvas imageUrl={canvases.handwrist.current_image_url} />
          <FeetCanvas imageUrl={canvases.feet.current_image_url} />
        </div>
      </aside>
    </main>
  );
}
