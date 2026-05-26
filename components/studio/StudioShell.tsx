"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { Fragment, useEffect, useState, type ReactNode } from "react";
import FullBodyCanvas from "@/components/canvas/FullBodyCanvas";
import HandWristCanvas from "@/components/canvas/HandWristCanvas";
import HeadshotCanvas from "@/components/canvas/HeadshotCanvas";
import { uploadRecipeCover } from "@/lib/api/recipe-cover-client";
import { useCharacterForgeStore } from "@/store/characterforge.store";
import type { StudioSectionKey } from "@/types/canvas";
import type { PublishedRecipe } from "@/types/recipe";

interface StudioShellProps {
  children: ReactNode;
}

const modules: Array<{ href: string; label: string; key: StudioSectionKey }> = [
  { href: "/studio/upload", label: "Upload", key: "upload" },
  { href: "/studio/wardrobe", label: "Wardrobe", key: "wardrobe" },
  { href: "/studio/accessories", label: "Accessories", key: "accessories" },
  { href: "/studio/hair", label: "Hair", key: "hair" },
  { href: "/studio/makeup", label: "Makeup", key: "makeup" }
];

export default function StudioShell({ children }: StudioShellProps) {
  const pathname = usePathname();
  const canvases = useCharacterForgeStore((state) => state.canvases);
  const fileIds = useCharacterForgeStore((state) => state.fileIds);
  const recipe = useCharacterForgeStore((state) => state.recipe);
  const restoreSectionSnapshot = useCharacterForgeStore((state) => state.restoreSectionSnapshot);
  const publishRecipe = useCharacterForgeStore((state) => state.publishRecipe);
  const loadPublishedRecipe = useCharacterForgeStore((state) => state.loadPublishedRecipe);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishTitle, setPublishTitle] = useState("");
  const [publishImageFile, setPublishImageFile] = useState<File | null>(null);
  const [publishImagePreview, setPublishImagePreview] = useState<string | null>(null);
  const [importedRecipeId, setImportedRecipeId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Find where we currently are in the flow
  const currentIndex = modules.findIndex((m) => pathname?.startsWith(m.href));
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  // Determine previous and next routes
  const prevModule = activeIndex > 0 ? modules[activeIndex - 1] : null;
  const nextModule = activeIndex < modules.length - 1 ? modules[activeIndex + 1] : null;
  const uploadsComplete = Boolean(fileIds.headshot && fileIds.fullbody && fileIds.handwrist);
  const onUploadStep = activeIndex === 0;
  const canAdvance = !onUploadStep || uploadsComplete;

  useEffect(() => {
    restoreSectionSnapshot(modules[activeIndex].key);
  }, [activeIndex, restoreSectionSnapshot]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const recipeId = new URLSearchParams(window.location.search).get("recipe_id");
    if (!recipeId || recipeId === importedRecipeId) {
      return;
    }

    const importRecipe = async () => {
      setImportError(null);
      try {
        const response = await fetch(`/api/recipes/${recipeId}`, { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as {
          data?: PublishedRecipe;
          error?: string;
        };
        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? "Could not load this recipe.");
        }
        loadPublishedRecipe(payload.data);
        setImportedRecipeId(recipeId);
      } catch (error) {
        setImportError(error instanceof Error ? error.message : "Could not load this recipe.");
      }
    };

    void importRecipe();
  }, [importedRecipeId, loadPublishedRecipe]);

  useEffect(() => {
    if (!publishImageFile) {
      setPublishImagePreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(publishImageFile);
    setPublishImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [publishImageFile]);

  const openPublishDialog = () => {
    setPublishError(null);
    setPublishTitle(recipe.title ?? "");
    setPublishImageFile(null);
    setPublishDialogOpen(true);
  };

  const closePublishDialog = () => {
    if (publishing) {
      return;
    }
    setPublishDialogOpen(false);
    setPublishError(null);
    setPublishImageFile(null);
  };

  const handlePublish = async () => {
    const trimmedTitle = publishTitle.trim();
    if (!trimmedTitle) {
      setPublishError("Enter a title before publishing.");
      return;
    }
    if (!publishImageFile) {
      setPublishError("Upload a recipe cover image before publishing.");
      return;
    }

    setPublishError(null);
    setPublishing(true);
    try {
      const displayImageUrl = await uploadRecipeCover(publishImageFile);
      await publishRecipe({ title: trimmedTitle, displayImageUrl });
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : "Failed to publish recipe.");
      setPublishing(false);
    }
  };

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
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Design Studio
          </h2>
          <p className="text-xs text-gray-600">Title and cover are set at publish.</p>
        </div>

        {/* Right Side: Next/Publish Button */}
        <div className="flex flex-1 items-center justify-end gap-3">
          {importError && (
            <span className="hidden max-w-xs truncate text-xs text-red-400 md:inline">
              {importError}
            </span>
          )}
          {publishError && (
            <span className="hidden max-w-xs truncate text-xs text-red-400 md:inline">
              {publishError}
            </span>
          )}
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
                title="Upload all required base photos before continuing"
                className="cursor-not-allowed rounded-md bg-white/40 px-4 py-2 text-sm font-medium text-black/60"
              >
                Next
              </span>
            )
          ) : (
            <button
              type="button"
              onClick={openPublishDialog}
              disabled={publishing}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {publishing ? "Publishing..." : "Publish recipe"}
            </button>
          )}
        </div>
      </header>

      {publishDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-recipe-title"
            className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-950 p-6 shadow-2xl"
            onSubmit={(event) => {
              event.preventDefault();
              void handlePublish();
            }}
          >
            <h2 id="publish-recipe-title" className="text-lg font-semibold text-white">
              Publish recipe
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Add the community title and cover image that will appear on the recipe card.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block" htmlFor="publish-title">
                <span className="text-sm font-medium text-gray-200">Recipe title</span>
                <input
                  id="publish-title"
                  type="text"
                  value={publishTitle}
                  onChange={(event) => {
                    setPublishTitle(event.target.value);
                    setPublishError(null);
                  }}
                  placeholder="Untitled Recipe"
                  disabled={publishing}
                  className="mt-2 w-full rounded-md border border-gray-800 bg-black px-3 py-2 text-sm text-white outline-none ring-white/20 placeholder:text-gray-600 focus:ring-2 disabled:opacity-60"
                />
              </label>

              <label
                htmlFor="publish-cover-image"
                className="block cursor-pointer rounded-lg border border-dashed border-gray-700 p-4 transition-colors hover:border-gray-500"
              >
                <span className="text-sm font-medium text-gray-200">Recipe cover image</span>
                <input
                  id="publish-cover-image"
                  type="file"
                  accept="image/png,image/jpeg"
                  disabled={publishing}
                  className="hidden"
                  onChange={(event) => {
                    setPublishImageFile(event.target.files?.[0] ?? null);
                    setPublishError(null);
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {publishImageFile?.name ?? "Upload a PNG or JPEG cover for the community card."}
                </p>
              </label>

              {publishImagePreview && (
                <img
                  src={publishImagePreview}
                  alt="Selected recipe cover preview"
                  className="h-44 w-full rounded-lg border border-gray-800 object-cover"
                />
              )}
            </div>

            {publishError && <p className="mt-4 text-sm text-red-400">{publishError}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closePublishDialog}
                disabled={publishing}
                className="rounded-md border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={publishing}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {publishing ? "Publishing..." : "Publish recipe"}
              </button>
            </div>
          </form>
        </div>
      )}

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
          </div>
        </aside>
      </main>
    </div>
  );
}