"use client";

import { useRef } from "react";

interface Props {
  onSelect(file: File): void;
}

export function ImageUpload({ onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border px-4 py-2"
      >
        Upload Image
      </button>

      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (!e.target.files?.length) return;

          onSelect(e.target.files[0]);
        }}
      />
    </div>
  );
}