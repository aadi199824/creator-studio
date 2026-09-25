"use client";

import { useRouter } from "next/navigation";
import { Sparkles, ImageIcon, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function QuickActions() {
  const router = useRouter();

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 font-semibold">Quick Actions</h2>

      <div className="space-y-3">
        <Button
          className="w-full justify-start"
          onClick={() => router.push("/dashboard/generator")}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Post
        </Button>

        <Button
          className="w-full justify-start"
          variant="outline"
          onClick={() =>
            toast.info("AI Image generation is coming soon.")
          }
        >
          <ImageIcon className="mr-2 h-4 w-4" />
          Generate Image
        </Button>

        <Button
          className="w-full justify-start"
          variant="outline"
          onClick={() => router.push("/dashboard/calendar")}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          Schedule Content
        </Button>
      </div>
    </div>
  );
}
