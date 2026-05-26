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
    <div className="flex min-h-screen flex-col text-plum-900">
      {/* Top Navigation Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-mint-200/80 bg-mint-50/70 px-6 shadow-sm shadow-mint-500/10 backdrop-blur-xl">
        {/* Left Side: Back Button */}
        <div className="flex flex-1 items-center justify-start">
          {prevModule && (
            <Link
              href={prevModule.href}
              className="beauty-secondary"
            >
              Back
            </Link>
          )}
        </div>

        {/* Center: Title */}
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-magenta-600">
            Design Studio
          </h2>
          <p className="text-xs text-plum-700/70">Title and cover are set at publish.</p>
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
                className="beauty-primary"
              >
                Next
              </Link>
            ) : (
              <span
                title="Upload all required base photos before continuing"
                className="cursor-not-allowed rounded-lg bg-mint-200 px-5 py-2.5 text-sm font-semibold text-plum-800/60"
              >
                Next
              </span>
            )
          ) : (
            <button
              type="button"
              onClick={openPublishDialog}
              disabled={publishing}
              className="beauty-primary"
            >
              {publishing ? "Publishing..." : "Publish recipe"}
            </button>
          )}
        </div>
      </header>

      {publishDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-plum-900/60 px-4 backdrop-blur-sm">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-recipe-title"
            className="beauty-card w-full max-w-lg p-6"
            onSubmit={(event) => {
              event.preventDefault();
              void handlePublish();
            }}
          >
            <h2 id="publish-recipe-title" className="text-lg font-semibold text-plum-900">
              Publish recipe
            </h2>
            <p className="mt-2 text-sm text-plum-700/75">
              Add the community title and cover image that will appear on the recipe card.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block" htmlFor="publish-title">
                <span className="text-sm font-medium text-plum-800">Recipe title</span>
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
                  className="beauty-input mt-2 w-full"
                />
              </label>

              <label
                htmlFor="publish-cover-image"
                className="block cursor-pointer rounded-xl border border-dashed border-mint-300 bg-mint-100/50 p-4 transition-colors hover:border-magenta-400"
              >
                <span className="text-sm font-medium text-plum-800">Recipe cover image</span>
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
                <p className="mt-1 text-xs text-plum-700/60">
                  {publishImageFile?.name ?? "Upload a PNG or JPEG cover for the community card."}
                </p>
              </label>

              {publishImagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={publishImagePreview}
                  alt="Selected recipe cover preview"
                  className="h-44 w-full rounded-xl border border-mint-200 object-cover shadow-lg shadow-mint-500/10"
                />
              )}
            </div>

            {publishError && <p className="mt-4 text-sm text-red-400">{publishError}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closePublishDialog}
                disabled={publishing}
                className="beauty-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={publishing}
                className="beauty-primary"
              >
                {publishing ? "Publishing..." : "Publish recipe"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Top Horizontal Progress Stepper */}
      <div className="border-b border-mint-200/80 bg-mint-100/70 px-6 py-5 shadow-inner shadow-white/50">
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
                        ? "bg-magenta-500 text-white ring-4 ring-magenta-400/25"
                        : isPast
                          ? "bg-mint-500 text-white"
                          : "bg-white/70 text-plum-700/50"
                      }`}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={`hidden sm:block text-sm font-medium transition-colors ${isActive ? "text-magenta-600" : isPast ? "text-plum-800" : "text-plum-700/50"
                      }`}
                  >
                    {item.label}
                  </span>
                </div>

                {/* Connecting Line (Hidden for the very last item) */}
                {index < modules.length - 1 && (
                  <div
                    className={`mx-4 h-[2px] flex-1 rounded-full transition-colors ${isPast ? "bg-mint-500" : "bg-white/70"
                      }`}
                  />
                )}
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="grid flex-grow grid-cols-12 bg-mint-50/20">
        {/* Main Workspace (Expanded to 9 columns since sidebar is gone) */}
        <section className="col-span-9 p-6">{children}</section>

        {/* Right Sidebar - Previews */}
        <aside className="col-span-3 border-l border-mint-200/80 bg-mint-50/50 p-4 backdrop-blur">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-magenta-600">
            Canvas Preview
          </h3>
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