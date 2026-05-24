"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import PhotoUploader from "@/components/shared/PhotoUploader";
import HairPipelinePreview from "@/components/studio/hair/HairPipelinePreview";
import HairSectionTabs from "@/components/studio/hair/HairSectionTabs";
import HairTemplateSelector from "@/components/studio/hair/HairTemplateSelector";
import ColorCategoryFilter from "@/components/studio/makeup/ColorCategoryFilter";
import ColorPicker from "@/components/studio/makeup/ColorPicker";
import IntensitySlider from "@/components/studio/makeup/IntensitySlider";
import MakeupEffectPanel from "@/components/studio/makeup/MakeupEffectPanel";
import type { HairSection } from "@/constants/hair-slots";
import { HAIR_SECTION_LABEL } from "@/constants/hair-slots";
import { uploadModuleFile } from "@/lib/api/sse-task-client";
import {
  defaultHairColor,
  hairHasSelection,
  normalizeHairConfig,
  type LegacyHairConfig
} from "@/lib/hair/normalize-hair-config";
import { useHairTemplates } from "@/lib/hair/use-hair-templates";
import { useCharacterForgeStore } from "@/store/characterforge.store";
import type { HairColorSelection, HairTransferSelection, HairTransferTemplate } from "@/types/hair";
import type { HairConfig } from "@/types/recipe";

function uniqueTemplateCategories(templates: HairTransferTemplate[]): string[] {
  const categories = new Set(
    templates.map((template) => template.category_name).filter(Boolean)
  );
  return Array.from(categories).sort((a, b) => a.localeCompare(b));
}

function resolveHairColor(color: HairColorSelection | null | undefined): HairColorSelection {
  return color ?? defaultHairColor();
}

export default function HairPage() {
  const recipe = useCharacterForgeStore((state) => state.recipe);
  const updateRecipe = useCharacterForgeStore((state) => state.updateRecipe);
  const markDirty = useCharacterForgeStore((state) => state.markDirty);
  const triggerRender = useCharacterForgeStore((state) => state.triggerRender);

  const hair = useMemo(
    () => normalizeHairConfig(recipe.hair as LegacyHairConfig),
    [recipe.hair]
  );

  const selectedSection: HairSection = hair.selected_section ?? "hairstyle";
  const hairColor = resolveHairColor(hair.color);

  const { templates, loading, loadingMore, error, nextToken, loadMore } = useHairTemplates();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    setCategoryFilter("all");
  }, [selectedSection]);

  const templateCategories = useMemo(() => uniqueTemplateCategories(templates), [templates]);

  const filteredTemplates = useMemo(() => {
    if (categoryFilter === "all") {
      return templates;
    }
    return templates.filter((template) => template.category_name === categoryFilter);
  }, [templates, categoryFilter]);

  const selectedTemplateId =
    hair.transfer?.mode === "template" ? hair.transfer.template_id : undefined;

  const referencePreview =
    hair.transfer?.mode === "reference" ? hair.transfer.ref_image_url : null;

  const updateHair = (patch: Partial<HairConfig>) => {
    updateRecipe((current) => ({
      ...current,
      hair: normalizeHairConfig({
        ...(current.hair as HairConfig),
        ...patch
      })
    }));
    markDirty("hair");
  };

  const selectSection = (section: HairSection) => {
    updateHair({
      selected_section: section,
      ...(section === "color" && !hair.color ? { color: defaultHairColor() } : {})
    });
  };

  const selectTemplate = (template: HairTransferTemplate) => {
    const next: HairTransferSelection = {
      mode: "template",
      template_id: template.id,
      title: template.title,
      thumb: template.thumb,
      category_name: template.category_name,
      keep_users_color: template.keep_users_color
    };
    updateHair({ transfer: next });
  };

  const handleReferenceUpload = async (file: File | null) => {
    setUploadError(null);
    if (!file) {
      updateHair({ transfer: null });
      return;
    }

    setUploadBusy(true);
    try {
      const uploaded = await uploadModuleFile(file, "hair-style");
      updateHair({
        transfer: {
          mode: "reference",
          ref_file_id: uploaded.file_id,
          ref_image_url: uploaded.public_url,
          title: file.name
        }
      });
    } catch (uploadErr) {
      setUploadError(uploadErr instanceof Error ? uploadErr.message : "Reference upload failed.");
    } finally {
      setUploadBusy(false);
    }
  };

  const clearTransfer = () => {
    updateHair({ transfer: null });
  };

  const setHairColor = (patch: Partial<HairColorSelection>) => {
    updateHair({
      color: {
        ...hairColor,
        ...patch
      }
    });
  };

  const handleApply = async () => {
    setApplyError(null);
    setApplying(true);
    try {
      await triggerRender(["hair"]);
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Failed to apply hair.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Hair Styling</h1>
      <p className="text-sm text-gray-400">
        Pick a hairstyle template or upload a reference, then optionally customize hair color.
      </p>

      <HairSectionTabs selected={selectedSection} onSelect={selectSection} />

      <section className="rounded border border-gray-700 p-3">
        <p className="mb-2 text-xs font-medium text-gray-400">Selection progress</p>
        <HairPipelinePreview hair={hair} />
      </section>

      <MakeupEffectPanel title={`${HAIR_SECTION_LABEL[selectedSection]} Options`}>
        <div className="space-y-4">
          {selectedSection === "hairstyle" ? (
            <>
              {templateCategories.length > 1 && (
                <div>
                  <p className="mb-2 text-xs text-gray-400">Category</p>
                  <ColorCategoryFilter
                    categories={templateCategories}
                    selected={categoryFilter}
                    onSelect={setCategoryFilter}
                  />
                </div>
              )}

              <div>
                <p className="mb-2 text-xs text-gray-400">Templates</p>
                {(error || uploadError) && (
                  <p className="mb-2 text-xs text-red-400">{error ?? uploadError}</p>
                )}
                <HairTemplateSelector
                  templates={filteredTemplates}
                  selectedId={selectedTemplateId}
                  onSelect={selectTemplate}
                  loading={loading}
                />
              </div>

              {nextToken && (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded border border-gray-600 px-3 py-1.5 text-xs text-gray-200 hover:border-gray-500 disabled:opacity-60"
                >
                  {loadingMore ? "Loading more…" : "Load more templates"}
                </button>
              )}

              <div className="space-y-2 border-t border-gray-800 pt-4">
                <p className="text-xs text-gray-400">Custom reference</p>
                <PhotoUploader
                  label="Upload hairstyle reference (JPG/PNG, max 5MB)"
                  onChange={handleReferenceUpload}
                />
                {uploadBusy && <p className="text-xs text-gray-500">Uploading reference…</p>}
              </div>

              {(referencePreview || hair.transfer?.mode === "template") && (
                <div className="flex items-center justify-between rounded border border-gray-800 px-3 py-2 text-xs text-gray-400">
                  <span>
                    {hair.transfer?.mode === "template"
                      ? `Template: ${hair.transfer.title}`
                      : `Reference: ${hair.transfer?.title}`}
                  </span>
                  <button type="button" onClick={clearTransfer} className="hover:text-white">
                    Clear
                  </button>
                </div>
              )}

              {referencePreview && (
                <div className="relative mx-auto aspect-[3/4] max-h-48 w-32 overflow-hidden rounded border border-gray-700">
                  <Image
                    src={referencePreview}
                    alt="Hairstyle reference"
                    fill
                    sizes="128px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2 rounded border border-gray-800 p-3">
                <p className="text-xs font-medium text-gray-300">Color</p>
                <ColorPicker
                  value={hairColor.color_hex}
                  onChange={(color_hex) => setHairColor({ color_hex })}
                />
                <div>
                  <p className="mb-1 text-xs text-gray-400">Intensity</p>
                  <IntensitySlider
                    value={hairColor.intensity}
                    onChange={(intensity) => setHairColor({ intensity })}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateHair({ color: null })}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Clear hair color
              </button>
            </div>
          )}
        </div>
      </MakeupEffectPanel>

      {applyError && <p className="text-sm text-red-400">{applyError}</p>}

      <button
        type="button"
        onClick={handleApply}
        disabled={applying || !hairHasSelection(hair)}
        className="rounded bg-white px-4 py-2 text-black disabled:opacity-60"
      >
        {applying ? "Applying…" : "Apply Hair"}
      </button>
    </div>
  );
}
