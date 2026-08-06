"use client";

import { useEffect } from "react";
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

import { ContentService } from "@/lib/services/content.service";
import { Content } from "@/lib/types/content";

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

  useEffect(() => {
    if (!content) return;

    reset({
      topic: content.topic ?? "",
      platform: content.platform ?? "",
      content_type: content.content_type ?? "",
      tone: content.tone ?? "",
      status: content.status ?? "draft",
      prompt: content.prompt ?? "",
    });
  }, [content, reset]);

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