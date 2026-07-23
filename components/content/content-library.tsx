"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import ContentCard from "./content-card";
import FilterBar from "./filter-bar";
import EditContentDialog from "./edit-content-dialog";

import { ContentService } from "@/lib/services/content.service";
import { Content } from "@/lib/types/content";

export default function ContentLibrary() {
  const [generations, setGenerations] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [brandFilter, setBrandFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedContent, setSelectedContent] =
    useState<Content | null>(null);

  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
  fetchGenerations();
}, []);

async function fetchGenerations() {
  setLoading(true);

  const { data, error } =
    await ContentService.getAll();

  if (error) {
    toast.error("Failed to load content.");
  } else {
    setGenerations((data ?? []) as Content[]);
  }

  setLoading(false);
}

async function handleDelete(id: string) {
  const { error } = await ContentService.delete(id);

  if (error) {
    toast.error("Failed to delete content.");
    return;
  }

  toast.success("Content deleted successfully.");

  setGenerations((prev) =>
    prev.filter((item) => item.id !== id)
  );
}
async function handleDuplicate(item: Content) {
  const {
    id,
    created_at,
    brands,
    ...newContent
  } = item;

  const { data, error } =
    await ContentService.duplicate({
      ...newContent,
      topic: `Copy of ${item.topic}`,
      status: "draft",
    });

  if (error) {
    toast.error("Failed to duplicate content.");
    return;
  }

  toast.success("Content duplicated successfully.");

  if (data) {
    setGenerations((prev) => [
      data as Content,
      ...prev,
    ]);
  }
}

function handleEdit(item: Content) {
  setSelectedContent(item);
  setEditOpen(true);
}

const brands = [
  ...new Set(
    generations
      .map((item) => item.brands?.name)
      .filter(Boolean)
  ),
] as string[];

const filteredData = useMemo(() => {
  return generations.filter((item) => {
    const value = search.toLowerCase();

    const matchesSearch =
      item.topic.toLowerCase().includes(value) ||
      item.prompt.toLowerCase().includes(value) ||
      item.platform.toLowerCase().includes(value) ||
      item.tone.toLowerCase().includes(value) ||
      item.brands?.name
        ?.toLowerCase()
        .includes(value);

    const matchesBrand =
      !brandFilter ||
      item.brands?.name === brandFilter;

    const matchesPlatform =
      !platformFilter ||
      item.platform === platformFilter;

    const matchesStatus =
      !statusFilter ||
      item.status === statusFilter;

    return (
      matchesSearch &&
      matchesBrand &&
      matchesPlatform &&
      matchesStatus
    );
  });
}, [
  generations,
  search,
  brandFilter,
  platformFilter,
  statusFilter,
]);

if (loading) {
  return (
    <div className="rounded-xl border bg-white p-10 text-center">
      Loading content...
    </div>
  );
}

return (
  <div className="space-y-6">
    {/* Search */}
    <input
      type="text"
      placeholder="🔍 Search content..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full rounded-xl border p-3"
    />

    {/* Filters */}
    <FilterBar
      brands={brands}
      brand={brandFilter}
      setBrand={setBrandFilter}
      platform={platformFilter}
      setPlatform={setPlatformFilter}
      status={statusFilter}
      setStatus={setStatusFilter}
    />

    {/* Content */}
    {filteredData.length === 0 ? (
      <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
        No content found.
      </div>
    ) : (
      <div className="space-y-6">
        {filteredData.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            />
        ))}
      </div>
    )}

    {/* Edit Dialog */}
    <EditContentDialog
      open={editOpen}
      onOpenChange={setEditOpen}
      content={selectedContent}
      onUpdated={fetchGenerations}
    />
  </div>
);
}