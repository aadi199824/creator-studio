"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    // Return to the page that sent the user here (e.g. /approve/<id> from a
    // phone notification). Only same-site paths are accepted.
    const next = new URLSearchParams(window.location.search).get("next");
    const target =
      next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
        ? next
        : "/dashboard";

    router.refresh();
    router.push(target);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold">
          Creator Studio AI
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            className="w-full rounded-lg border p-3"
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full rounded-lg border p-3"
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="w-full rounded-lg bg-black p-3 text-white">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}