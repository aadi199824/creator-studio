"use client";

import { useEffect, useState } from "react";

interface Account {
  id: string;
  username: string;
  profile_picture?: string;
  is_active: boolean;
}

export default function InstagramAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    const res = await fetch("/api/instagram/accounts");
    const data = await res.json();

    if (data.accounts) {
      setAccounts(data.accounts);
    }
  }

  function connectInstagram() {
    window.location.href = "/api/instagram/connect";
  }

  return (
    <div className="rounded-xl border bg-white p-6">

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          Connected Accounts
        </h2>

        <button
          onClick={connectInstagram}
          className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
        >
          + Connect Instagram
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-slate-500">
          No Instagram account connected.
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-4">

                <img
                  src={
                    account.profile_picture ||
                    "/default-avatar.png"
                  }
                  className="h-12 w-12 rounded-full"
                />

                <div>
                  <div className="font-semibold">
                    @{account.username}
                  </div>

                  <div className="text-sm text-green-600">
                    Connected
                  </div>
                </div>
              </div>

              <button
                className="rounded-lg border px-3 py-2 hover:bg-red-50"
              >
                Disconnect
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}