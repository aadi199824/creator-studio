import { Users } from "lucide-react";

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team</h1>
        <p className="text-muted-foreground">
          Invite teammates to collaborate on brands and content.
        </p>
      </div>

      <div className="rounded-xl border border-dashed p-12 text-center">
        <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="font-semibold text-slate-800">Coming soon</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Multi-user team accounts with shared brands and role-based access
          are on the roadmap.
        </p>
      </div>
    </div>
  );
}
