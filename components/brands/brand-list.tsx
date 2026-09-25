"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import BrandCard from "./brand-card";
import { Button } from "@/components/ui/button";
import { BrandService } from "@/lib/services/brand.service";
import { Brand } from "@/lib/types/brand";

export default function BrandList() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  async function fetchBrands() {
    setLoading(true);
    const { data } = await BrandService.getAll();
    setBrands(data ?? []);
    setLoading(false);
  }

  function handleDeleted(id: string) {
    setBrands((prev) => prev.filter((b) => b.id !== id));
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-xl border bg-slate-50"
          />
        ))}
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="text-lg font-semibold text-slate-800">
          No brands yet
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first brand to start generating on-brand AI content.
        </p>
        <Link href="/dashboard/brands/new">
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Create Brand
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {brands.map((brand) => (
        <BrandCard key={brand.id} brand={brand} onDeleted={handleDeleted} />
      ))}
    </div>
  );
}
