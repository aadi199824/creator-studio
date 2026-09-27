"use client";

import { useState } from "react";
import { toast } from "sonner";
import DeleteDialog from "./delete-dialog";
import { Content } from "@/lib/types/content";

interface InstagramAccountOption {
  id: string;
  username: string | null;
  is_active: boolean;
}

interface Props {
  item: Content;
  onEdit: (item: Content) => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: Content) => void;
  onSchedule: (item: Content) => void;
  onPublish: (item: Content, accountId?: string) => Promise<void>;
}

export default function ContentCard({
  item,
  onEdit,
  onDelete,
  onDuplicate,
  onSchedule,
  onPublish,
}: Props) {
  const [publishing, setPublishing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accounts, setAccounts] = useState<InstagramAccountOption[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");

  const createdDate = new Date(
    item.created_at
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  function copyContent() {
    if (!item.generated_content) {
      toast.error("No generated content available.");
      return;
    }

    navigator.clipboard.writeText(item.generated_content);

    toast.success("Content copied to clipboard.");
  }

  async function runPublish(accountId?: string) {
    setPublishing(true);

    try {
      await onPublish(item, accountId);
      setPickerOpen(false);
      setSelectedAccountId("");
    } finally {
      setPublishing(false);
    }
  }

  async function handlePublishClick() {
    // Automation-generated drafts already know which account they belong
    // to — publish straight away, same as before.
    if (item.social_account_id) {
      await runPublish();
      return;
    }

    // Older or manually-created drafts have no linked account yet. Ask
    // which connected Instagram account to publish to instead of guessing.
    setPickerOpen(true);
    setLoadingAccounts(true);

    try {
      const response = await fetch("/api/instagram/accounts");
      const data = await response.json().catch(() => ({ accounts: [] }));

      if (!response.ok) {
        toast.error(data?.error || "Couldn't load your connected Instagram accounts.");
        setPickerOpen(false);
        return;
      }

      setAccounts(data.accounts ?? []);
    } catch {
      toast.error("Couldn't load your connected Instagram accounts.");
      setPickerOpen(false);
    } finally {
      setLoadingAccounts(false);
    }
  }

  function handleConfirmAccount() {
    if (!selectedAccountId) {
      toast.error("Choose an Instagram account first.");
      return;
    }

    runPublish(selectedAccountId);
  }

  const alreadyPublished = item.status === "published";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {item.topic}
          </h2>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              📁 {item.brands?.name || "No Brand"}
            </span>

            <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
              📝 {item.content_type}
            </span>

            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
              🎭 {item.tone}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">
            {item.platform}
          </span>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              item.status === "published"
                ? "bg-green-100 text-green-700"
                : item.status === "scheduled"
                ? "bg-blue-100 text-blue-700"
                : item.status === "failed"
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {(item.status || "draft").toUpperCase()}
          </span>
        </div>
      </div>

      {/* Content Preview */}
      <div className="mt-6">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Content Preview
        </h3>

        <div className="rounded-xl border bg-gray-50 p-4">
          <p className="whitespace-pre-line text-gray-700">
            {(item.generated_content || item.prompt).length > 250
              ? (item.generated_content || item.prompt).substring(
                  0,
                  250
                ) + "..."
              : item.generated_content || item.prompt}
          </p>
        </div>

        {item.status === "failed" && item.publish_error && (
          <p className="mt-2 text-sm text-red-600">
            ⚠ {item.publish_error}
          </p>
        )}
      </div>

      {/* Inline account picker — only shown when a draft has no account
          attached yet and the user just clicked Publish Now. */}
      {pickerOpen && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="mb-2 text-sm font-medium text-gray-700">
            Which Instagram account should this publish to?
          </p>

          {loadingAccounts ? (
            <p className="text-sm text-gray-500">Loading connected accounts...</p>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-gray-500">
              No connected Instagram accounts found. Connect one from Social
              Accounts first.
            </p>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="flex-1 rounded-lg border p-2 text-sm"
              >
                <option value="">Select an account...</option>
                {accounts.map((account) => (
                  <option
                    key={account.id}
                    value={account.id}
                    disabled={!account.is_active}
                  >
                    {account.username || "Unnamed account"}
                    {!account.is_active ? " (reconnect required)" : ""}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  onClick={handleConfirmAccount}
                  disabled={publishing || !selectedAccountId}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
                >
                  {publishing ? "Publishing..." : "Confirm & Publish"}
                </button>

                <button
                  onClick={() => {
                    setPickerOpen(false);
                    setSelectedAccountId("");
                  }}
                  disabled={publishing}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 flex flex-col gap-4 border-t pt-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Created on{" "}
            <span className="font-medium">
              {createdDate}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={copyContent}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-100"
          >
            📋 Copy
          </button>

          <button
            onClick={() => onEdit(item)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-100"
          >
            ✏ Edit
          </button>

          <button
              onClick={() => onDuplicate(item)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-100"
            >
              📄 Duplicate
            </button>
            <button
              onClick={() => onSchedule(item)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-100"
            >
              📅 Schedule
            </button>

            {!alreadyPublished && !pickerOpen && (
              <button
                onClick={handlePublishClick}
                disabled={publishing}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                {publishing ? "Publishing..." : "🚀 Publish Now"}
              </button>
            )}

          <DeleteDialog
  topic={item.topic}
  onConfirm={() => onDelete(item.id)}
/>
        </div>
      </div>
    </div>
  );
}
