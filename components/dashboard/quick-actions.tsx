import { Button } from "@/components/ui/button";

export default function QuickActions() {
  return (
    <div className="space-y-3">
      <Button className="w-full">✨ Generate Post</Button>
      <Button className="w-full" variant="outline">
        🖼 Generate Image
      </Button>
      <Button className="w-full" variant="outline">
        📅 Schedule Content
      </Button>
    </div>
  );
}