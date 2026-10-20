"use client";

import { useState } from "react";
import { toast } from "sonner";

import { CSP_FORMATS, CSP_FORMAT_LABELS, type CspFormat } from "@/lib/automation/csp-content";

const ACCOUNTS = [
  { value: "csp_officials", label: "@csp_officials" },
  { value: "tradeverse.academy", label: "@tradeverse.academy" },
] as const;

type AccountValue = (typeof ACCOUNTS)[number]["value"];

interface Props {
  onGenerated: () => void;
}

/**
 * "Create a post now" panel for the Content Library: pick an account (and a
 * template for CSP), then generate a review-only draft immediately instead
 * of waiting for the daily run.
 */
export default function GeneratePostPanel({ onGenerated }: Props) {
  const [account, setAccount] = useState<AccountValue>("csp_officials");
  const [format, setFormat] = useState<CspFormat | "">("");
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    const toastId = toast.loading("Creating your post… this can take up to 2 minutes.");

    try {
      const response = await fetch("/api/automation/generate-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, format: account === "csp_officials" ? format : "" }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data?.error || "We couldn't create the post. Please try again.", { id: toastId });
        return;
      }

      toast.success(`Draft ready: ${data?.draft?.topic ?? "new post"}. Review it below before publishing.`, { id: toastId });
      onGenerated();
    } catch {
      toast.error("Network error — check your connection and try again.", { id: toastId });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Create a post now</h2>
      <p className="mt-1 text-sm text-gray-500">
        Generates a draft with its image. Nothing is published until you click Publish.
      </p>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
          Account
          <select
            value={account}
            onChange={(e) => setAccount(e.target.value as AccountValue)}
            disabled={generating}
            className="rounded-lg border p-2"
          >
            {ACCOUNTS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        {account === "csp_officials" && (
          <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
            Template
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as CspFormat | "")}
              disabled={generating}
              className="rounded-lg border p-2"
            >
              <option value="">Today&apos;s template (auto rotation)</option>
              {CSP_FORMATS.map((item) => (
                <option key={item} value={item}>
                  {CSP_FORMAT_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          {generating ? "Creating…" : "✨ Generate draft"}
        </button>
      </div>
    </div>
  );
}
