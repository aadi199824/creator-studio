"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function BrandForm() {
  const supabase = createClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [icon, setIcon] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.from("brands").insert([
      {
        name,
        description,
        color,
        icon,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Brand Created Successfully!");

    setName("");
    setDescription("");
    setColor("");
    setIcon("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <input
        className="w-full border rounded-lg p-3"
        placeholder="Brand Name"
        value={name}
        onChange={(e)=>setName(e.target.value)}
      />

      <textarea
        className="w-full border rounded-lg p-3"
        placeholder="Description"
        value={description}
        onChange={(e)=>setDescription(e.target.value)}
      />

      <input
        className="w-full border rounded-lg p-3"
        placeholder="Color"
        value={color}
        onChange={(e)=>setColor(e.target.value)}
      />

      <input
        className="w-full border rounded-lg p-3"
        placeholder="Emoji Icon"
        value={icon}
        onChange={(e)=>setIcon(e.target.value)}
      />

      <button
        className="bg-black text-white px-6 py-3 rounded-lg"
      >
        Save Brand
      </button>

    </form>
  );
}