"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  contentSchema,
  ContentFormValues,
} from "@/lib/validations/content";

import { ImageUpload } from "@/components/publishing/image-upload";
import { ContentService } from "@/lib/services/content.service";
import { StorageService } from "@/lib/services/storage.service";
import { createClient } from "@/lib/supabase/client";
import { Content } from "@/lib/types/content";

const supabase = createClient();

// Instagram's publishing API accepts JPEG/PNG images up to 8 MB.
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: Content | null;
  onUpdated: () => void;
}

export default function EditContentDialog({
  open,
  onOpenChange,
  content,
  onUpdated,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContentFormValues>({
    resolver: zodResolver(contentSchema),
  });

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!content) return;

    setImageUrl(content.image_url ?? null);

    reset({
      topic: content.topic ?? "",
      platform: content.platform ?? "",
      content_type: content.content_type ?? "",
      tone: content.tone ?? "",
      status: content.status ?? "draft",
      prompt: content.prompt ?? "",
    });
  }, [content, reset]);

  /**
   * Attaches an image to the draft immediately (separate from "Save
   * Changes"), so drafts created without one — e.g. CSP automation drafts —
   * can be published.
   */
  async function handleImageSelect(file: File) {
    if (!content) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Please choose a JPG or PNG image — Instagram doesn't accept other formats.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("This image is larger than 8 MB, which is Instagram's limit. Please use a smaller file.");
      return;
    }

    setUploadingImage(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Your session has expired. Please log in again.");
        return;
      }

      const publicUrl = await StorageService.uploadImage(file, user.id);
      const { error } = await ContentService.update(content.id, { image_url: publicUrl });

      if (error) {
        console.error("Attach image error:", error);
        toast.error("The image uploaded, but we couldn't attach it to this draft. Please try again.");
        return;
      }

      setImageUrl(publicUrl);
      toast.success("Image attached. You can publish this draft now.");
      onUpdated();
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("We couldn't upload this image. Please check your connection and try again.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function onSubmit(values: ContentFormValues) {
    if (!content) return;

    try {
      const { error } = await ContentService.update(
        content.id,
        values
      );

      if (error) {
        console.error("Update Content Error:", error);
        toast.error("Failed to update content.");
        return;
      }

      toast.success("Content updated successfully.");

      onUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Update Content Error:", error);
      toast.error("Failed to update content.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Content</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          {/* Image */}
          <div className="rounded-lg border p-4">
            <p className="mb-3 text-sm font-medium">Post image</p>

            <div className="flex items-center gap-4">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt="Post image"
                  width={96}
                  height={120}
                  className="h-[120px] w-[96px] rounded-md border object-cover"
                />
              ) : (
                <div className="flex h-[120px] w-[96px] items-center justify-center rounded-md border border-dashed text-center text-xs text-gray-500">
                  No image yet
                </div>
              )}

              <div className="space-y-1">
                {uploadingImage ? (
                  <p className="text-sm text-gray-600">Uploading…</p>
                ) : (
                  <ImageUpload onSelect={handleImageSelect} />
                )}
                <p className="text-xs text-gray-500">
                  JPG or PNG, up to 8 MB. {imageUrl ? "Uploading replaces the current image." : "Saved to this draft immediately."}
                </p>
              </div>
            </div>
          </div>

          {/* Topic */}
          <div>
            <Input
              placeholder="Topic"
              {...register("topic")}
            />

            {errors.topic && (
              <p className="mt-1 text-sm text-red-500">
                {errors.topic.message}
              </p>
            )}
          </div>

          {/* Platform */}
          <Select
            value={watch("platform") ?? ""}
            onValueChange={(value) => {
              if (value !== null) {
                setValue("platform", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Platform" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="Instagram">
                Instagram
              </SelectItem>

              <SelectItem value="Facebook">
                Facebook
              </SelectItem>

              <SelectItem value="LinkedIn">
                LinkedIn
              </SelectItem>

              <SelectItem value="X">
                X
              </SelectItem>

              <SelectItem value="YouTube">
                YouTube
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Content Type */}
          <Select
            value={watch("content_type") ?? ""}
            onValueChange={(value) => {
              if (value !== null) {
                setValue("content_type", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Content Type" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="Post">
                Post
              </SelectItem>

              <SelectItem value="Carousel">
                Carousel
              </SelectItem>

              <SelectItem value="Reel">
                Reel
              </SelectItem>

              <SelectItem value="Story">
                Story
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Tone */}
          <Select
            value={watch("tone") ?? ""}
            onValueChange={(value) => {
              if (value !== null) {
                setValue("tone", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tone" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="Professional">
                Professional
              </SelectItem>

              <SelectItem value="Funny">
                Funny
              </SelectItem>

              <SelectItem value="Motivational">
                Motivational
              </SelectItem>

              <SelectItem value="Devotional">
                Devotional
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Status */}
          <Select
            value={watch("status") ?? ""}
            onValueChange={(value) => {
              if (value !== null) {
                setValue("status", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="draft">
                Draft
              </SelectItem>

              <SelectItem value="scheduled">
                Scheduled
              </SelectItem>

              <SelectItem value="published">
                Published
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Prompt */}
          <div>
            <Textarea
              rows={8}
              placeholder="Prompt"
              {...register("prompt")}
            />

            {errors.prompt && (
              <p className="mt-1 text-sm text-red-500">
                {errors.prompt.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}