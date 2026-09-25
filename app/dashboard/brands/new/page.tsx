import BrandForm from "@/components/brands/brand-form";

export default function NewBrandPage() {
  return (
    <main className="max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Brand</h1>
        <p className="text-muted-foreground">
          Brands let you keep AI-generated content on-voice for each business
          or persona you manage.
        </p>
      </div>

      <BrandForm />
    </main>
  );
}
