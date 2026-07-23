"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import BrandCard from "./brand-card";

export default function BrandList() {
  const supabase = createClient();

  const [brands, setBrands] = useState<any[]>([]);

  useEffect(() => {
    fetchBrands();
  }, []);

  async function fetchBrands() {
    const { data } = await supabase
      .from("brands")
      .select("*")
      .order("created_at", { ascending: false });

    setBrands(data || []);
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {brands.map((brand) => (
        <BrandCard key={brand.id} brand={brand} />
      ))}
    </div>
  );
}