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
      <label className="block text-xs uppercase tracking-wide text-gray-500" htmlFor="recipe-title">
        Recipe title
      </label>
      <div className="flex flex-wrap gap-3">
        <input
          id="recipe-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="min-w-0 flex-1 rounded border border-gray-800 bg-gray-950 px-3 py-2 text-2xl font-semibold text-white outline-none ring-white/20 placeholder:text-gray-600 focus:ring-2"
          placeholder="Untitled Recipe"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save title"}
        </button>
      </div>
      {message && <p className="text-xs text-gray-400">{message}</p>}
    </div>
  );
}
