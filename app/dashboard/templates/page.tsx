import { LayoutTemplate } from "lucide-react";

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Templates</h1>
        <p className="text-muted-foreground">
          Reusable content templates for common post types.
        </p>
      </div>

      <div className="rounded-xl border border-dashed p-12 text-center">
        <LayoutTemplate className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="font-semibold text-slate-800">Coming soon</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Save your best-performing prompts as reusable templates — festival
          posts, product launches, quotes and more.
        </p>
      </div>
    </div>
  );
}
