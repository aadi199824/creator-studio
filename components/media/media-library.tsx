"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2, Image as ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { StorageService } from "@/lib/services/storage.service";

interface MediaAsset {
  id: string;
  url: string;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export default function MediaLibrary() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("media_assets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Media library load error:", error);
    }

    setAssets(data ?? []);
    setLoading(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Please sign in again.");
      }

      const publicUrl = await StorageService.uploadImage(file, user.id);

      const { error } = await supabase.from("media_assets").insert({
        user_id: user.id,
        url: publicUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      });

      if (error) throw error;

      toast.success("Media uploaded.");
      load();
    } catch (err: any) {
      toast.error(err?.message || "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from("media_assets")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete media.");
      return;
    }

    toast.success("Media deleted.");
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Images you've uploaded for posts, reused across brands.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Uploading..." : "Upload Image"}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <ImageIcon className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-800">No media yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload an image to reuse it across posts and brands.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group relative aspect-square overflow-hidden rounded-xl border bg-slate-50"
            >
              <img
                src={asset.url}
                alt={asset.file_name ?? "Uploaded media"}
                className="h-full w-full object-cover"
              />

              <button
                type="button"
                onClick={() => handleDelete(asset.id)}
                aria-label="Delete media"
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
