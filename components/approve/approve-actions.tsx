"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * Publish / Skip buttons on the phone approval page (app/approve/[id]).
 * Publish goes through the same route as "Publish Now" in the Content
 * Library, so the same checks and error messages apply.
 */

type Props = { draftId: string; hasImage: boolean; skipped: boolean };

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null);
  return (body && typeof body.error === "string" && body.error) || fallback;
}

export function ApproveActions({ draftId, hasImage, skipped }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"publish" | "skip" | null>(null);
  const [isSkipped, setIsSkipped] = useState(skipped);

  async function publish() {
    setBusy("publish");
    const toastId = toast.loading("Publishing to Instagram… this can take up to a minute.");
    try {
      const response = await fetch(`/api/content/${draftId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!response.ok) {
        throw new Error(await readError(response, "We couldn't publish this post. Please try again."));
      }
      toast.success("Published to Instagram ✅", { id: toastId });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Publishing failed.", { id: toastId });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function skip() {
    setBusy("skip");
    try {
      const response = await fetch(`/api/content/${draftId}/skip`, { method: "POST" });
      if (!response.ok) throw new Error(await readError(response, "We couldn't skip this draft."));
      setIsSkipped(true);
      toast.success("Skipped — no more reminders for this draft today.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't skip this draft.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 border-t bg-white/95 p-4 backdrop-blur">
      <div className="mx-auto flex max-w-lg flex-col gap-2">
        {isSkipped && (
          <p className="text-center text-xs text-muted-foreground">
            Reminders are off for this draft. You can still publish it.
          </p>
        )}
        <Button size="lg" className="h-12 w-full text-base" onClick={publish} disabled={!hasImage || busy !== null}>
          {busy === "publish" ? "Publishing…" : "✅ Publish now"}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-11 flex-1"
            onClick={skip}
            disabled={isSkipped || busy !== null}
          >
            {busy === "skip" ? "Skipping…" : "Skip today"}
          </Button>
          <Button
            variant="outline"
            className="h-11 flex-1"
            onClick={() => router.push("/dashboard/content")}
            disabled={busy !== null}
          >
            Edit in Studio
          </Button>
        </div>
      </div>
    </div>
  );
}
