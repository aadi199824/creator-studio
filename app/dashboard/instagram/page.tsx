import InstagramAccounts from "@/components/instagram/instagram-accounts";

export default function InstagramPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Instagram Accounts
        </h1>

        <p className="text-slate-500 mt-2">
          Connect and manage your Instagram Business accounts.
        </p>
      </div>

      <InstagramAccounts />
    </div>
  );
}