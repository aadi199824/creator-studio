interface Props {
  prompt: string;
}

export default function PromptPreview({ prompt }: Props) {
  if (!prompt) return null;

  return (
    <div className="rounded-lg border bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-bold">
        Generated Prompt
      </h2>

      <pre className="whitespace-pre-wrap text-sm">
        {prompt}
      </pre>
    </div>
  );
}