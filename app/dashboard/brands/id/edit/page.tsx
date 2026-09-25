"use client";

// NOTE: this route lives at the literal path "brands/id/edit" rather than
// the dynamic "brands/[id]/edit" — renaming the folder requires a
// filesystem move this session can't perform (no terminal access to your
// computer). The brand id is passed as a query string instead
// (?id=<brand-id>), which works identically. If you'd like the cleaner
// dynamic-route URL, rename the "id" folder to "[id]" yourself and this
// page can be simplified to read `params.id`.

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import BrandForm from "@/components/brands/brand-form";
import { BrandService } from "@/lib/services/brand.service";
import { Brand } from "@/lib/types/brand";

function EditBrandPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    BrandService.getById(id).then(({ data, error }) => {
      if (error || !data) {
        setNotFound(true);
      } else {
        setBrand(data);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <p className="text-muted-foreground">Loading brand...</p>;
  }

  if (notFound || !brand) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Brand not found</h1>
        <p className="text-muted-foreground">
          This brand doesn't exist, or you don't have access to it.
        </p>
        <button
          className="text-purple-600 underline"
          onClick={() => router.push("/dashboard/brands")}
        >
          Back to Brands
        </button>
      </div>
    );
  }

  return (
    <main className="max-w-xl space-y-6">
      <h1 className="text-3xl font-bold">Edit Brand</h1>
      <BrandForm brand={brand} />
    </main>
  );
}

export default function EditBrandPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}>
      <EditBrandPageInner />
    </Suspense>
  );
}
