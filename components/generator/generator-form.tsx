"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import BrandSelect from "./brand-select";
import PromptPreview from "./prompt-preview";

export default function GeneratorForm() {
  const [brand, setBrand] = useState("");
  const [platform, setPlatform] = useState("");
  const [contentType, setContentType] = useState("");
  const [tone, setTone] = useState("");
  const [topic, setTopic] = useState("");
  const [prompt, setPrompt] = useState("");

  const supabase = createClient();

  async function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const generatedPrompt = `
Generate a ${contentType} for ${platform}.

Brand ID:
${brand}

Tone:
${tone}

Topic:
${topic}

Requirements:
- High engagement
- Clear CTA
- Trending hashtags
- SEO friendly
`;

    setPrompt(generatedPrompt);

    const { error } = await supabase.from("ai_generations").insert([
      {
        brand_id: brand,
        platform,
        content_type: contentType,
        tone,
        topic,
        prompt: generatedPrompt,
      },
    ]);

    if (error) {
      console.error("Insert Error:", error);
      alert("Failed to save prompt.");
      return;
    }

    console.log("Prompt saved successfully!");
    alert("Prompt saved successfully!");
    console.log({
  brand,
  platform,
  contentType,
  tone,
  topic,
});
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleGenerate} className="space-y-5">
        <BrandSelect value={brand} onChange={setBrand} />

        <select
          className="w-full rounded-lg border p-3"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        >
          <option value="">Platform</option>
          <option value="Instagram">Instagram</option>
          <option value="Facebook">Facebook</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="X">X</option>
          <option value="YouTube">YouTube</option>
        </select>

        <select
          className="w-full rounded-lg border p-3"
          value={contentType}
          onChange={(e) => setContentType(e.target.value)}
        >
          <option value="">Content Type</option>
          <option value="Post">Post</option>
          <option value="Carousel">Carousel</option>
          <option value="Reel">Reel</option>
          <option value="Story">Story</option>
        </select>

        <select
          className="w-full rounded-lg border p-3"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
        >
          <option value="">Tone</option>
          <option value="Professional">Professional</option>
          <option value="Funny">Funny</option>
          <option value="Motivational">Motivational</option>
          <option value="Devotional">Devotional</option>
        </select>

        <textarea
          placeholder="Enter Topic"
          className="w-full rounded-lg border p-3"
          rows={5}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        <button
          type="submit"
          className="rounded-lg bg-black px-6 py-3 text-white hover:bg-gray-800"
        >
          Generate Prompt
        </button>
      </form>

      <PromptPreview prompt={prompt} />
    </div>
  );
}