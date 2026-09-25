import Link from "next/link";
import { Plus } from "lucide-react";

import BrandList from "@/components/brands/brand-list";
import { Button } from "@/components/ui/button";

export default function BrandsPage() {
  return (
    <main className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Brands</h1>
          <p className="text-muted-foreground">
            Each brand keeps its own AI Generator context — voice, tone and
            content history.
          </p>
        </div>

        <Link href="/dashboard/brands/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Brand
          </Button>
        </Link>
      </div>

      <BrandList />
    </main>
  );
}
