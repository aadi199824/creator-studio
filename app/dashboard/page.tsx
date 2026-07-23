import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Link
        href="/login"
        className="rounded-lg bg-black px-6 py-3 text-white"
      >
        Login to Creator Studio AI
      </Link>
    </div>
  );
}