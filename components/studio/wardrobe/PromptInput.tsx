"use client";

import { useState } from "react";

export default function PromptInput() {
  const [prompt, setPrompt] = useState("");
  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-300">Garment Prompt</label>
      <input
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Cyberpunk leather jacket"
        className="w-full rounded border border-gray-700 bg-transparent px-3 py-2"
      />
      <button className="rounded bg-white px-3 py-2 text-sm text-black" type="button">
        Generate
      </button>
    </div>
  );
}
