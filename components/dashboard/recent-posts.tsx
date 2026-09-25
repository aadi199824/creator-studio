"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Row {
  id: string;
  topic: string;
  platform: string;
  status: string;
  brands: { name: string } | null;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  completed: "default",
  scheduled: "secondary",
  draft: "outline",
  pending: "outline",
};

export default function RecentPosts() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("ai_generations")
      .select("id, topic, platform, status, brands(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6);

    setRows((data as unknown as Row[]) ?? []);
    setLoading(false);
  }

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b p-5">
        <h2 className="font-semibold">Recent Generations</h2>
        <Link
          href="/dashboard/content"
          className="text-sm font-medium text-purple-600 hover:underline"
        >
          View All →
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3 p-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No content generated yet.{" "}
          <Link href="/dashboard/generator" className="text-purple-600 underline">
            Create your first post
          </Link>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Topic</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="max-w-[220px] truncate">
                  {row.topic}
                </TableCell>
                <TableCell>{row.brands?.name ?? "—"}</TableCell>
                <TableCell>{row.platform}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[row.status] ?? "outline"}>
                    {row.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
