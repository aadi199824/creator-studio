"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { brandSchema, BrandFormValues } from "@/lib/validations/brand";
import { BrandService } from "@/lib/services/brand.service";
import { Brand } from "@/lib/types/brand";

const COLOR_OPTIONS = [
  { value: "purple", label: "Purple", swatch: "bg-purple-500" },
  { value: "blue", label: "Blue", swatch: "bg-blue-500" },
  { value: "green", label: "Green", swatch: "bg-emerald-500" },
  { value: "orange", label: "Orange", swatch: "bg-orange-500" },
  { value: "pink", label: "Pink", swatch: "bg-pink-500" },
];

interface Props {
  /** Pass an existing brand to edit it in place; omit to create a new one. */
  brand?: Brand | null;
  onSaved?: (brand: Brand) => void;
}

export default function BrandForm({ brand, onSaved }: Props) {
  const router = useRouter();
  const isEditing = Boolean(brand);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: brand?.name ?? "",
      description: brand?.description ?? "",
      color: brand?.color ?? "purple",
      icon: brand?.icon ?? "✨",
    },
  });

  useEffect(() => {
    if (brand) {
      reset({
        name: brand.name,
        description: brand.description ?? "",
        color: brand.color ?? "purple",
        icon: brand.icon ?? "✨",
      });
    }
  }, [brand, reset]);

  const selectedColor = watch("color");

  async function onSubmit(values: BrandFormValues) {
    const payload = {
      name: values.name,
      description: values.description || null,
      color: values.color || null,
      icon: values.icon || "✨",
    };

    const { data, error } = isEditing
      ? await BrandService.update(brand!.id, payload as any)
      : await BrandService.create(payload as any);

    if (error || !data) {
      toast.error(
        isEditing ? "Failed to update brand." : "Failed to create brand."
      );
      return;
    }

    toast.success(isEditing ? "Brand updated." : "Brand created.");

    if (onSaved) {
      onSaved(data);
    } else {
      router.push("/dashboard/brands");
      router.refresh();
    }

    if (!isEditing) {
      reset({ name: "", description: "", color: "purple", icon: "✨" });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="brand-name">Brand Name</Label>
        <Input
          id="brand-name"
          placeholder="e.g. Hanuman Bhakt"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="brand-description">Description</Label>
        <Textarea
          id="brand-description"
          placeholder="What is this brand about?"
          {...register("description")}
        />
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setValue("color", option.value)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                selectedColor === option.value
                  ? "border-purple-600 ring-1 ring-purple-600"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className={`h-3 w-3 rounded-full ${option.swatch}`} />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="brand-icon">Emoji Icon</Label>
        <Input
          id="brand-icon"
          placeholder="✨"
          maxLength={4}
          {...register("icon")}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : isEditing
            ? "Save Changes"
            : "Create Brand"}
        </Button>

        {isEditing && (
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/brands")}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
