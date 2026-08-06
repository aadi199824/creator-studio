"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ImageUpload } from "./image-upload";
import { StorageService } from "@/lib/services/storage.service";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export function PublishDialog() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePublish() {
    if (!file) {
      alert("Please select an image.");
      return;
    }

    setLoading(true);

    try {
      // Get logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not logged in.");
      }

      // Upload image to Supabase Storage
      const publicUrl = await StorageService.uploadImage(
        file,
        user.id
      );

      setImageUrl(publicUrl);

      // Publish to Instagram
      const response = await fetch("/api/instagram/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: publicUrl,
          caption,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to publish Instagram post."
        );
      }

      alert("Instagram post published successfully!");

      // Reset form
      setCaption("");
      setFile(null);
      setImageUrl("");

      // Refresh page so history updates
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-6">
      <h2 className="text-xl font-semibold">
        Publish to Instagram
      </h2>

      <ImageUpload
        onSelect={(selectedFile) => setFile(selectedFile)}
      />

      {file && (
        <div className="rounded-lg border p-2">
          <Image
            src={URL.createObjectURL(file)}
            alt="Preview"
            width={600}
            height={600}
            className="rounded-lg w-full h-auto"
          />
        </div>
      )}

      <textarea
        className="w-full rounded-lg border p-3"
        rows={6}
        placeholder="Write your caption..."
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />

      <Button
        onClick={handlePublish}
        disabled={loading || !file}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Publishing...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Publish Now
          </>
        )}
      </Button>

      {imageUrl && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 break-all">
          <strong>Uploaded Image URL:</strong>
          <br />
          {imageUrl}
        </div>
      )}
    </div>
  );
}