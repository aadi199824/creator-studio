import GeneratorForm from "@/components/generator/generator-form";

export default function GeneratorPage() {
  return (
    <main className="space-y-8 p-8">

      <h1 className="text-4xl font-bold">
        AI Content Generator
      </h1>

      <GeneratorForm />

    </main>
  );
}