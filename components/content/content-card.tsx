import { toast } from "sonner";
import DeleteDialog from "./delete-dialog";
import { Content } from "@/lib/types/content";

interface Props {
  item: Content;
  onEdit: (item: Content) => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: Content) => void;
}

export default function ContentCard({
  item,
  onEdit,
  onDelete,
  onDuplicate,
}: Props) {
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
      </div>

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

          <DeleteDialog
  topic={item.topic}
  onConfirm={() => onDelete(item.id)}
/>
        </div>
      </div>
    </div>
  );
}