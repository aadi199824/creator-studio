"use client";

import { useEffect, useState } from "react";
import { BrandService } from "@/lib/services/brand.service";
import { Brand } from "@/lib/types/brand";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function BrandSelect({ value, onChange }: Props) {
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    async function fetchBrands() {
      const { data } = await BrandService.getAll();
      setBrands(data ?? []);
    }

    fetchBrands();
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
    >
      <option value="">Select Brand</option>

      {brands.map((brand) => (
        <option key={brand.id} value={brand.id}>
          {brand.icon ? `${brand.icon} ` : ""}
          {brand.name}
        </option>
      ))}

      {brands.length === 0 && (
        <option value="" disabled>
          No brands yet — create one first
        </option>
      )}
    </select>
  );
}
