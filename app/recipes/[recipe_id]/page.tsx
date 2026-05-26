import Image from "next/image";
import Link from "next/link";
import RecipeTitleEditor from "@/components/recipes/RecipeTitleEditor";
import { getRecipe } from "@/lib/recipe/repository";
import type {
  MakeupEffectSelection,
  MakeupRegion,
  PublishedRecipe,
  WardrobeSlotId
} from "@/types/recipe";

export const dynamic = "force-dynamic";

interface RecipePageProps {
  params: Promise<{ recipe_id: string }>;
}

interface RecipeImage {
  label: string;
  url: string;
  detail?: string;
}

const WARDROBE_LABELS: Record<WardrobeSlotId, string> = {
  top: "Top",
  bottom: "Bottom",
  hat: "Hat",
  bag: "Bag"
};

const MAKEUP_LABELS: Record<MakeupRegion, string> = {
  foundation: "Foundation",
  concealer: "Concealer",
  blush: "Blush",
  bronzer: "Bronzer",
  contour: "Contour",
  highlighter: "Highlighter",
  eyebrows: "Eyebrows",
  eye_shadow: "Eye Shadow",
  eye_liner: "Eye Liner",
  eyelashes: "Eyelashes",
  lip_color: "Lip Color",
  lip_liner: "Lip Liner",
  skin_smooth: "Skin Smooth"
};

const EXTRA_EFFECT_FIELDS: Array<[keyof MakeupEffectSelection, string]> = [
  ["skinSmoothStrength", "Smooth strength"],
  ["skinSmoothColorIntensity", "Smooth color intensity"],
  ["glowIntensity", "Glow"],
  ["coverageIntensity", "Coverage intensity"],
  ["colorUnderEyeIntensity", "Under-eye color"],
  ["coverageLevel", "Coverage level"],
  ["shimmerIntensity", "Shimmer intensity"],
  ["shimmerDensity", "Shimmer density"],
  ["shimmerSize", "Shimmer size"],
  ["lipFullness", "Lip fullness"],
  ["lipWrinkless", "Lip smoothing"],
  ["lipLinerThickness", "Liner thickness"],
  ["lipLinerSmoothness", "Liner smoothness"],
  ["eyebrowCurvature", "Brow curvature"],
  ["eyebrowThickness", "Brow thickness"],
  ["eyebrowDefinition", "Brow definition"]
];

function collectRecipeImages(recipe: PublishedRecipe): RecipeImage[] {
  const images: RecipeImage[] = [];
  const seen = new Set<string>();
  const addImage = (label: string, url: string | null | undefined, detail?: string) => {
    if (!url) return;
    const key = `${label}:${url}`;
    if (seen.has(key)) return;
    seen.add(key);
    images.push({ label, url, detail });
  };

  addImage("Display picture", recipe.display_image_url, "Published recipe cover");

  (Object.keys(WARDROBE_LABELS) as WardrobeSlotId[]).forEach((slotId) => {
    const slot = recipe.wardrobe[slotId];
    addImage(
      `${WARDROBE_LABELS[slotId]} reference`,
      slot.preview_url ?? slot.ref_image_url,
      slot.prompt ? `Prompt: ${slot.prompt}` : slot.source ? `${slot.source} source` : undefined
    );
  });

  const transfer = recipe.hair.transfer;
  if (transfer?.mode === "template") {
    addImage("Hair template", transfer.thumb, transfer.title);
  } else if (transfer?.mode === "reference") {
    addImage("Hair reference", transfer.ref_image_url, transfer.title);
  }

  addImage("Nail texture", recipe.nails.global.custom_texture_url, "Global nail style");
  Object.entries(recipe.nails.overrides ?? {}).forEach(([finger, style]) => {
    addImage(`${finger} nail texture`, style?.custom_texture_url, "Nail override");
  });

  recipe.jewelry.rings.forEach((ring) => {
    addImage("Ring reference", ring.ref_image_url, `${ring.finger} finger`);
  });
  recipe.jewelry.bracelets.forEach((bracelet) => {
    addImage("Bracelet reference", bracelet.ref_image_url, `${bracelet.wrist} wrist`);
  });
  addImage("Watch reference", recipe.jewelry.watch?.ref_image_url, recipe.jewelry.watch?.wrist);
  addImage("Necklace reference", recipe.jewelry.necklace?.ref_image_url);

  return images;
}

function makeupEntries(recipe: PublishedRecipe) {
  return Object.entries(recipe.makeup.effects ?? {}) as Array<
    [MakeupRegion, MakeupEffectSelection]
  >;
}

function effectDetails(effect: MakeupEffectSelection) {
  return EXTRA_EFFECT_FIELDS.flatMap(([key, label]) => {
    const value = effect[key];
    return typeof value === "number" ? [`${label}: ${value}`] : [];
  });
}

export default async function PublishedRecipePage({ params }: RecipePageProps) {
  const { recipe_id } = await params;
  const recipe = await getRecipe(recipe_id);

  if (!recipe) {
    return (
      <main className="mx-auto max-w-5xl p-10">
        <h1 className="text-3xl font-semibold text-plum-900">Recipe not found</h1>
        <p className="mt-2 text-plum-700/70">No published recipe matches this id.</p>
        <Link className="mt-6 inline-block text-sm font-medium text-magenta-600 underline" href="/">
          Back to community
        </Link>
      </main>
    );
  }

  const title = recipe.title ?? "Untitled Recipe";
  const images = collectRecipeImages(recipe);
  const effects = makeupEntries(recipe);

  return (
    <main className="mx-auto max-w-5xl p-10">
      <Link className="text-sm font-medium text-magenta-600 underline" href="/">
        Back to community
      </Link>
      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="beauty-card p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-magenta-600">
            Published {new Date(recipe.created_at).toLocaleDateString()}
          </p>
          <h1 className="sr-only">{title}</h1>
          <RecipeTitleEditor recipeId={recipe.recipe_id} initialTitle={title} />
          <p className="mt-3 text-sm font-medium text-plum-800/80">
            This recipe stores its reusable styling data and image references under recipe id{" "}
            <span className="font-mono text-plum-900">{recipe.recipe_id}</span>. Base user photos
            are still supplied by whoever opens the recipe.
          </p>
          <Link
            className="beauty-primary mt-6 inline-block"
            href={`/studio/upload?recipe_id=${recipe.recipe_id}`}
          >
            Open studio to try on
          </Link>
        </div>

        <CoverImage title={title} imageUrl={recipe.display_image_url} />
      </section>

      <section className="beauty-card mt-8 p-6">
        <h2 className="text-xl font-semibold text-plum-900">Images Used</h2>
        <p className="mt-2 text-sm font-medium text-plum-800/80">
          Reusable images saved with this recipe, including the display picture and any garment,
          hair, nail, or jewelry references.
        </p>
        {images.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <RecipeImageCard key={`${image.label}-${image.url}`} image={image} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm font-medium text-plum-800/70">
            No reusable image references were stored.
          </p>
        )}
      </section>

      <section className="beauty-card mt-8 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-plum-900">Makeup Data</h2>
            <p className="mt-2 text-sm font-medium text-plum-800/80">
              Type: {recipe.makeup.type}
              {recipe.makeup.selected_region
                ? ` - selected region: ${MAKEUP_LABELS[recipe.makeup.selected_region]}`
                : ""}
            </p>
          </div>
          {recipe.makeup.api_effects?.length ? (
            <span className="rounded-full bg-mint-200 px-3 py-1 text-xs font-medium text-mint-500">
              {recipe.makeup.api_effects.length} API effects
            </span>
          ) : null}
        </div>

        {effects.length ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {effects.map(([region, effect]) => (
              <MakeupEffectCard key={region} region={region} effect={effect} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm font-medium text-plum-800/70">
            No makeup regions have been configured.
          </p>
        )}
      </section>
    </main>
  );
}

function CoverImage({ title, imageUrl }: { title: string; imageUrl?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-mint-300/70 bg-white/70 shadow-[0_18px_45px_rgba(31,111,123,0.16)]">
      <div className="relative aspect-[4/5]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${title} display picture`}
            fill
            sizes="320px"
            className="object-cover"
            priority
            unoptimized
          />
        ) : (
          <CoverPlaceholder />
        )}
      </div>
    </div>
  );
}

function CoverPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_30%_20%,rgba(255,191,211,0.42),transparent_34%),linear-gradient(135deg,#fff3f8_0%,#e8fbfb_100%)] px-8 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full border border-white/80 bg-white/60 shadow-[0_14px_34px_rgba(31,111,123,0.16)]">
        <SparkleIcon />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-plum-800/80">
          Cover moment
        </p>
        <p className="mt-2 text-sm font-medium text-plum-800/70">
          Add a display picture to make this look shine.
        </p>
      </div>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-10 w-10 text-magenta-500"
      viewBox="0 0 32 32"
      fill="none"
    >
      <path
        d="M16 3.5l2.4 7.1 7.1 2.4-7.1 2.4-2.4 7.1-2.4-7.1-7.1-2.4 7.1-2.4L16 3.5z"
        fill="currentColor"
        opacity="0.9"
      />
      <path d="M24.5 20.5l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" fill="#3fb7c7" />
    </svg>
  );
}

function RecipeImageCard({ image }: { image: RecipeImage }) {
  return (
    <article className="overflow-hidden rounded-xl border border-mint-300/70 bg-mint-50/60 shadow-[0_12px_30px_rgba(31,111,123,0.12)]">
      <div className="relative aspect-square">
        <Image
          src={image.url}
          alt={image.label}
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-plum-900">{image.label}</h3>
        {image.detail && <p className="mt-1 text-xs font-medium text-plum-800/70">{image.detail}</p>}
      </div>
    </article>
  );
}

function MakeupEffectCard({
  region,
  effect
}: {
  region: MakeupRegion;
  effect: MakeupEffectSelection;
}) {
  const colors = effect.colors ?? [];
  const colorIntensities = effect.colorIntensities ?? [];
  const details = effectDetails(effect);

  return (
    <article className="rounded-xl border border-mint-300/70 bg-mint-50/60 p-4 shadow-[0_12px_30px_rgba(31,111,123,0.1)]">
      <h3 className="font-medium text-plum-900">{MAKEUP_LABELS[region]}</h3>
      {effect.pattern && (
        <p className="mt-1 text-xs font-medium text-plum-800/70">Pattern: {effect.pattern}</p>
      )}

      {colors.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {colors.map((color, index) => (
            <span
              key={`${color}-${index}`}
              className="inline-flex items-center gap-2 rounded-full border border-mint-300 bg-mint-100/60 px-2 py-1 text-xs text-plum-800"
            >
              <span
                className="h-4 w-4 rounded-full border border-white/20"
                style={{ backgroundColor: color }}
              />
              {color}
              {typeof colorIntensities[index] === "number" ? ` ${colorIntensities[index]}%` : ""}
            </span>
          ))}
        </div>
      )}

      {details.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs font-medium text-plum-800/70">
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
    </article>
  );
}
