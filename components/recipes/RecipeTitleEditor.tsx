"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface RecipeTitleEditorProps {
  recipeId: string;
  initialTitle: string;
}

export default function RecipeTitleEditor({ recipeId, initialTitle }: RecipeTitleEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || undefined })
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not update recipe title.");
      }
      setMessage("Title saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update recipe title.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wide text-magenta-600" htmlFor="recipe-title">
        Recipe title
      </label>
      <div className="flex flex-wrap gap-3">
        <input
          id="recipe-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="beauty-input min-w-0 flex-1 text-2xl font-semibold"
          placeholder="Untitled Recipe"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="beauty-secondary"
        >
          {saving ? "Saving..." : "Save title"}
        </button>
      </div>
      {message && <p className="text-xs text-plum-700/60">{message}</p>}
    </div>
  );
}
