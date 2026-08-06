"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import {
  Sparkles,
  FileText,
  Clapperboard,
  PanelsTopLeft,
  BookOpen,
  ImageIcon,
  RotateCcw,
  WandSparkles,
  Check,
} from "lucide-react";

import BrandSelect from "./brand-select";
import PromptPreview from "./prompt-preview";

export default function GeneratorForm() {
  const [brand, setBrand] = useState("");
  const [platform, setPlatform] = useState("");
  const [contentType, setContentType] = useState("");
  const [tone, setTone] = useState("");
  const [topic, setTopic] = useState("");

  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [addCTA, setAddCTA] = useState(true);
  const [includeImageSuggestion, setIncludeImageSuggestion] =
    useState(true);

  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const supabase = createClient();
  const platforms = [
  {
    name: "Instagram",
    icon: "◎",
  },
  {
    name: "YouTube",
    icon: "▶",
  },
  {
    name: "Facebook",
    icon: "f",
  },
  {
    name: "LinkedIn",
    icon: "in",
  },
  {
    name: "X",
    icon: "𝕏",
  },
];
  const contentTypes = [
    {
      name: "Post",
      icon: FileText,
    },
    {
      name: "Reel",
      label: "Reel Script",
      icon: Clapperboard,
    },
    {
      name: "Carousel",
      icon: PanelsTopLeft,
    },
    {
      name: "Story",
      icon: BookOpen,
    },
    {
      name: "Thumbnail",
      icon: ImageIcon,
    },
  ];

  async function handleGenerate(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!brand || !platform || !contentType || !tone || !topic.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    const requirements = [
      "High engagement",
      "SEO friendly",
      addCTA ? "Include a clear CTA" : "",
      includeHashtags ? "Include relevant trending hashtags" : "",
      includeImageSuggestion
        ? "Include an image/visual suggestion"
        : "",
    ]
      .filter(Boolean)
      .map((item) => `- ${item}`)
      .join("\n");

    const generatedPrompt = `
Generate a ${contentType} for ${platform}.

Brand ID:
${brand}

Tone:
${tone}

Topic:
${topic}

Requirements:
${requirements}
`;

    try {
      setIsGenerating(true);
      setGeneratedContent("");

      const { data, error } = await supabase
        .from("ai_generations")
        .insert({
          brand_id: brand,
          platform,
          content_type: contentType,
          tone,
          topic,
          prompt: generatedPrompt,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase Insert Error:", error);
        alert("Failed to save prompt.");
        return;
      }

      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          generationId: data.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("AI Generation Error:", result);
        alert(result.error || "Failed to generate content.");
        return;
      }

      setGeneratedContent(result.content);

      console.log("Generated Content:", result.content);
    } catch (err: any) {
      console.error("Generation Error:", err);

      alert(
        err?.message ||
          "Something went wrong while generating content."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleReset() {
    setBrand("");
    setPlatform("");
    setContentType("");
    setTone("");
    setTopic("");
    setGeneratedContent("");

    setIncludeHashtags(true);
    setAddCTA(true);
    setIncludeImageSuggestion(true);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {/* ============================= */}
      {/* AI CONTENT GENERATOR */}
      {/* ============================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-slate-100 px-6 pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-950">
                AI Content Generator
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Create viral content for any platform with AI
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-7 overflow-x-auto text-sm font-medium">
            <button
              type="button"
              className="border-b-2 border-purple-600 px-1 pb-3 font-semibold text-purple-600"
            >
              Generate
            </button>

            <button
              type="button"
              className="px-1 pb-3 text-slate-500 transition hover:text-slate-900"
            >
              Bulk Generate
            </button>

            <button
              type="button"
              className="px-1 pb-3 text-slate-500 transition hover:text-slate-900"
            >
              AI Image
            </button>

            <button
              type="button"
              className="px-1 pb-3 text-slate-500 transition hover:text-slate-900"
            >
              Hashtags
            </button>
          </div>
        </div>

        <form
          onSubmit={handleGenerate}
          className="space-y-5 p-6"
        >
          {/* Brand */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Select Brand
            </label>

            <BrandSelect
              value={brand}
              onChange={setBrand}
            />
          </div>

          {/* Platform */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Platform
            </label>

            <div className="flex flex-wrap gap-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Platform
                </label>

                <div className="flex flex-wrap gap-2">
                  {platforms.map((item) => {
                    const active = platform === item.name;

                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setPlatform(item.name)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          active
                            ? "border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-600"
                            : "border-slate-200 bg-white text-slate-600 hover:border-purple-300 hover:bg-purple-50/40"
                        }`}
                      >
                        <span className="flex h-4 min-w-4 items-center justify-center text-xs font-bold">
                          {item.icon}
                        </span>

                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Content type */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Content Type
            </label>

            <div className="flex flex-wrap gap-2">
              {contentTypes.map((item) => {
                const Icon = item.icon;
                const active = contentType === item.name;

                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setContentType(item.name)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-600"
                        : "border-slate-200 bg-white text-slate-600 hover:border-purple-300 hover:bg-purple-50/40"
                    }`}
                  >
                    <Icon className="h-4 w-4" />

                    {item.label || item.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Tone / Style
            </label>

            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              required
            >
              <option value="">Select tone / style</option>
              <option value="Professional">
                💼 Professional
              </option>
              <option value="Funny">
                😄 Funny & Engaging
              </option>
              <option value="Motivational">
                🔥 Motivational
              </option>
              <option value="Devotional">
                🙏 Devotional & Motivational
              </option>
            </select>
          </div>

          {/* Topic */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-800">
                Topic / What&apos;s the post about?
              </label>

              <span className="text-xs text-slate-400">
                {topic.length}/500
              </span>
            </div>

            <textarea
              placeholder="Describe what you want to create..."
              className="min-h-[110px] w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              maxLength={500}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <OptionCheckbox
              label="Include Hashtags"
              checked={includeHashtags}
              onChange={() =>
                setIncludeHashtags(!includeHashtags)
              }
            />

            <OptionCheckbox
              label="Add CTA"
              checked={addCTA}
              onChange={() => setAddCTA(!addCTA)}
            />

            <OptionCheckbox
              label="Include Image Suggestion"
              checked={includeImageSuggestion}
              onChange={() =>
                setIncludeImageSuggestion(
                  !includeImageSuggestion
                )
              }
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              className="text-sm font-medium text-slate-500 transition hover:text-purple-600"
            >
              Advanced Options ↓
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={isGenerating}
                className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>

              <button
                type="submit"
                disabled={isGenerating}
                className="flex h-11 min-w-[165px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 px-5 text-sm font-semibold text-white shadow-md shadow-purple-200 transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                <WandSparkles className="h-4 w-4" />

                {isGenerating
                  ? "Generating..."
                  : "Generate with AI"}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* ============================= */}
      {/* AI GENERATED CONTENT */}
      {/* ============================= */}

      <section className="min-w-0">
        {isGenerating ? (
          <div className="flex min-h-[450px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-purple-100">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>

              <h3 className="font-semibold text-slate-900">
                Creating your content
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                AI is generating something amazing...
              </p>
            </div>
          </div>
        ) : generatedContent ? (
          <PromptPreview
            prompt={generatedContent}
            onChange={setGeneratedContent}
          />
        ) : (
          <div className="flex min-h-[450px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="max-w-sm text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50">
                <Sparkles className="h-7 w-7 text-purple-600" />
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                AI Generated Content
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Select your brand, platform and content
                preferences, then generate your first piece
                of AI content.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function OptionCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex items-center gap-2 text-sm font-medium text-slate-700"
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded ${
          checked
            ? "bg-purple-600"
            : "border border-slate-300 bg-white"
        }`}
      >
        {checked && (
          <Check className="h-3 w-3 text-white" />
        )}
      </span>

      {label}
    </button>
  );
}