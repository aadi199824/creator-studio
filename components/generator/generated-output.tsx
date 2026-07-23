"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Generation = {
  id: string;
  platform: string;
  content_type: string;
  tone: string;
  topic: string;
  prompt: string;
};

export default function GeneratedOutput() {
  const supabase = createClient();

  const [items, setItems] = useState<Generation[]>([]);

  useEffect(() => {
    fetchGenerations();
  }, []);

  async function fetchGenerations() {
    const { data, error } = await supabase
      .from("ai_generations")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setItems(data);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Previous Generations</h2>

      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border bg-white p-5 shadow"
        >
          <h3 className="font-semibold">
            {item.platform} • {item.content_type}
          </h3>

          <p className="text-sm text-gray-500">
            {item.topic}
          </p>

          <pre className="mt-3 whitespace-pre-wrap text-sm">
            {item.prompt}
          </pre>
        </div>
      ))}
    </div>
  );
}