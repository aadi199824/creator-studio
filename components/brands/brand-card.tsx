"use client";

import { Card, CardContent } from "@/components/ui/card";

interface Brand {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export default function BrandCard({ brand }: { brand: Brand }) {
  return (
    <Card className="hover:shadow-lg transition">
      <CardContent className="p-8">
        <div className="text-5xl font-extrabold">{brand.icon}</div>

        <h2 className="mt-4 text-xl font-bold">
          {brand.name}
        </h2>

        <p className="text-gray-500 mt-2">
          {brand.description}
        </p>

        <span className="inline-block mt-4 rounded-full bg-gray-100 px-3 py-1 text-sm">
          {brand.color}
        </span>
      </CardContent>
    </Card>
  );
}