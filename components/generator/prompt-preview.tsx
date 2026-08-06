"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Hash,
  ImageIcon,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface PromptPreviewProps {
  prompt: string;
  onChange: (value: string) => void;
}

export default function PromptPreview({
  prompt,
  onChange,
}: PromptPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("Post");

  async function handleCopy() {
    if (!prompt) return;

    try {
      await navigator.clipboard.writeText(prompt);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  }

  if (!prompt) {
    return null;
  }

  const tabs = [
    "Post",
    "Carousel",
    "Reel Script",
    "Hashtags",
    "Image",
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-100 px-6 pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-950">
                AI Generated Content
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review and edit your generated content
              </p>
            </div>
          </div>

          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex gap-6 overflow-x-auto">
          {tabs.map((tab) => {
            const active = activeTab === tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition ${
                  active
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-5 p-6">
        {/* Caption heading */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-900">
            Caption
          </label>

          <button
            type="button"
            onClick={handleCopy}
            className="flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-600" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>
        </div>

        {/* Editable AI content */}
        <textarea
          value={prompt}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[330px] w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-800 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          placeholder="AI generated content will appear here..."
        />

        {/* Key Highlights */}
        <div>
          <p className="mb-3 text-sm font-semibold text-slate-900">
            Key Highlights
          </p>

          <div className="flex flex-wrap gap-2">
            <HighlightBadge text="High Engagement" />
            <HighlightBadge text="Trending Topic" />
            <HighlightBadge text="Viral Ready" />
            <HighlightBadge text="SEO Friendly" />
          </div>
        </div>

        {/* Hashtags */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-purple-600" />

              <p className="text-sm font-semibold text-slate-900">
                Hashtags
              </p>
            </div>

            <button
              type="button"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-purple-600"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy All
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <p className="text-sm leading-6 text-slate-600">
              Hashtags generated by AI will be displayed as
              part of the content above.
            </p>
          </div>
        </div>

        {/* Image Prompt */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-purple-600" />

              <p className="text-sm font-semibold text-slate-900">
                Image Prompt
              </p>
            </div>

            <button
              type="button"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-purple-600"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <p className="text-sm leading-6 text-slate-600">
              AI image suggestions will appear here once we
              separate the generated response into structured
              content.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="h-3.5 w-3.5" />

            Generated by AI. Review the content before
            publishing.
          </div>
        </div>
      </div>
    </div>
  );
}

function HighlightBadge({
  text,
}: {
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
        <Check className="h-2.5 w-2.5 text-white" />
      </span>

      {text}
    </span>
  );
}