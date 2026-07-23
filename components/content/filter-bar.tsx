"use client";

interface Props {
  brands: string[];
  brand: string;
  setBrand: (value: string) => void;

  platform: string;
  setPlatform: (value: string) => void;

  status: string;
  setStatus: (value: string) => void;
}

export default function FilterBar({
  brands,
  brand,
  setBrand,
  platform,
  setPlatform,
  status,
  setStatus,
}: Props) {
  return (
    <div className="grid gap-4 rounded-xl border bg-white p-4 md:grid-cols-3">
      <select
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        className="rounded-lg border p-3"
      >
        <option value="">All Brands</option>

        {brands.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>

      <select
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
        className="rounded-lg border p-3"
      >
        <option value="">All Platforms</option>
        <option>Instagram</option>
        <option>Facebook</option>
        <option>LinkedIn</option>
        <option>X</option>
        <option>YouTube</option>
      </select>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded-lg border p-3"
      >
        <option value="">All Status</option>
        <option>draft</option>
        <option>scheduled</option>
        <option>published</option>
      </select>
    </div>
  );
}