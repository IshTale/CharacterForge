"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { Fragment, type ReactNode } from "react";
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
  const pathname = usePathname();
  const canvases = useCharacterForgeStore((state) => state.canvases);
  const fileIds = useCharacterForgeStore((state) => state.fileIds);

  // Find where we currently are in the flow
  const currentIndex = modules.findIndex((m) => pathname?.startsWith(m.href));
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  // Determine previous and next routes
  const prevModule = activeIndex > 0 ? modules[activeIndex - 1] : null;
  const nextModule = activeIndex < modules.length - 1 ? modules[activeIndex + 1] : null;
  const uploadsComplete = Object.values(fileIds).every(Boolean);
  const onUploadStep = activeIndex === 0;
  const canAdvance = !onUploadStep || uploadsComplete;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Navigation Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-800 px-6">
        {/* Left Side: Back Button */}
        <div className="flex flex-1 items-center justify-start">
          {prevModule && (
            <Link
              href={prevModule.href}
              className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
            >
              Back
            </Link>
          )}
        </div>

        {/* Center: Title */}
        <h2 className="text-xl font-semibold text-white">Design Studio</h2>

        {/* Right Side: Next/Finish Button */}
        <div className="flex flex-1 items-center justify-end">
          {nextModule ? (
            canAdvance ? (
              <Link
                href={nextModule.href}
                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-200"
              >
                Next
              </Link>
            ) : (
              <span
                title="Upload all four base photos before continuing"
                className="cursor-not-allowed rounded-md bg-white/40 px-4 py-2 text-sm font-medium text-black/60"
              >
                Next
              </span>
            )
          ) : null}
        </div>
      </header>

      {/* Top Horizontal Progress Stepper */}
      <div className="border-b border-gray-800 bg-gray-900/30 px-6 py-5">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
          {modules.map((item, index) => {
            const isActive = index === activeIndex;
            const isPast = index < activeIndex;

            return (
              <Fragment key={item.href}>
                {/* Step Indicator */}
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${isActive
                        ? "bg-blue-600 text-white ring-4 ring-blue-900/50"
                        : isPast
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-400"
                      }`}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={`hidden sm:block text-sm font-medium transition-colors ${isActive ? "text-white" : isPast ? "text-gray-300" : "text-gray-600"
                      }`}
                  >
                    {item.label}
                  </span>
                </div>

                {/* Connecting Line (Hidden for the very last item) */}
                {index < modules.length - 1 && (
                  <div
                    className={`mx-4 h-[2px] flex-1 rounded-full transition-colors ${isPast ? "bg-blue-600" : "bg-gray-800"
                      }`}
                  />
                )}
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="grid flex-grow grid-cols-12">
        {/* Main Workspace (Expanded to 9 columns since sidebar is gone) */}
        <section className="col-span-9 p-6">{children}</section>

        {/* Right Sidebar - Previews */}
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
    </div>
  );
}