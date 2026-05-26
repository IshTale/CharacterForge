"use client";

import { useState } from "react";

export default function PromptInput() {
  const [prompt, setPrompt] = useState("");
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-plum-800">Garment Prompt</label>
      <input
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Cyberpunk leather jacket"
        className="beauty-input w-full"
      />
      <button className="beauty-primary" type="button">
        Generate
      </button>
    </div>
  );
}
