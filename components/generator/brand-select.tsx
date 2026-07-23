"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Brand {
  id: string;
  name: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function BrandSelect({ value, onChange }: Props) {
  const supabase = createClient();
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    async function fetchBrands() {
      const { data, error } = await supabase
        .from("brands")
        .select("id, name")
        .order("name");

      if (!error && data) {
        setBrands(data);
      }
    }

    fetchBrands();
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border p-3"
    >
      <option value="">Select Brand</option>

      {brands.map((brand) => (
        <option key={brand.id} value={brand.id}>
          {brand.name}
        </option>
      ))}
    </select>
  );
}