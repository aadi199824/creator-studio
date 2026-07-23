import BrandForm from "@/components/brands/brand-form";
import BrandList from "@/components/brands/brand-list";

export default function BrandsPage() {
  return (
    <main className="space-y-10 p-8">
      <h1 className="text-3xl font-bold">
        Brand Management
      </h1>

      <BrandForm />

      <BrandList />
    </main>
  );
}