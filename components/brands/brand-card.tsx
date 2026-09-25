"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BrandService } from "@/lib/services/brand.service";
import { Brand } from "@/lib/types/brand";

export default function BrandCard({
  brand,
  onDeleted,
}: {
  brand: Brand;
  onDeleted?: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);

    const { error } = await BrandService.delete(brand.id);

    setDeleting(false);

    if (error) {
      toast.error("Failed to delete brand.");
      return;
    }

    toast.success("Brand deleted.");
    onDeleted?.(brand.id);
  }

  return (
    <Card className="transition hover:shadow-lg">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-start justify-between">
          <div className="text-4xl">{brand.icon || "✨"}</div>

          <div className="flex gap-1">
            <Link href={`/dashboard/brands/id/edit?id=${brand.id}`}>
              <Button variant="ghost" size="icon" aria-label="Edit brand">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>

            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete brand"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                }
              />

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{brand.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This can't be undone. Content already generated for this
                    brand will stay, but it will no longer be linked to a
                    brand.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deleting}
                    onClick={handleDelete}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold">{brand.name}</h2>
          {brand.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {brand.description}
            </p>
          )}
        </div>

        {brand.color && (
          <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">
            {brand.color}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
