"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ImageUpload } from "./image-upload";
import { StorageService } from "@/lib/services/storage.service";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface InstagramAccount {
  id: string;
  username: string;
  profile_picture?: string | null;
  is_active?: boolean;
}

export function PublishDialog() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Account selected from sidebar.
   *
   * Example:
   * /dashboard/publishing?account=ACCOUNT_ID
   */
  const requestedAccount = searchParams.get("account");

  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");

  /**
   * Load Instagram accounts whenever the requested
   * account changes.
   */
  useEffect(() => {
    loadAccounts();
  }, [requestedAccount]);

  /**
   * Load connected Instagram accounts.
   */
  async function loadAccounts() {
    try {
      const response = await fetch("/api/instagram/accounts");

      if (!response.ok) {
        throw new Error("Failed to load Instagram accounts.");
      }

      const data = await response.json();

      if (!data.accounts) {
        setAccounts([]);
        setSelectedAccount("");
        return;
      }

      const instagramAccounts: InstagramAccount[] =
        data.accounts;

      setAccounts(instagramAccounts);

      if (instagramAccounts.length === 0) {
        setSelectedAccount("");
        return;
      }

      /**
       * If the sidebar supplied an account ID,
       * select that account.
       */
      if (requestedAccount) {
        const requestedExists =
          instagramAccounts.some(
            (account) =>
              account.id === requestedAccount
          );

        if (requestedExists) {
          setSelectedAccount(requestedAccount);
          return;
        }
      }

      /**
       * Otherwise default to the first connected account.
       */
      setSelectedAccount(
        instagramAccounts[0].id
      );
    } catch (error) {
      console.error(
        "Failed to load Instagram accounts:",
        error
      );

      setAccounts([]);
      setSelectedAccount("");
    }
  }

  /**
   * Publish Instagram post.
   */
  async function handlePublish() {
    if (!file) {
      alert("Please select an image.");
      return;
    }

    if (!selectedAccount) {
      alert("Please select an Instagram account.");
      return;
    }

    setLoading(true);

    try {
      /**
       * Get logged-in Creator Studio user.
       */
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not logged in.");
      }

      /**
       * Upload image to Supabase Storage.
       */
      const publicUrl =
        await StorageService.uploadImage(
          file,
          user.id
        );

      setImageUrl(publicUrl);

      /**
       * Publish to selected Instagram account.
       */
      const response = await fetch(
        "/api/instagram/publish",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountId: selectedAccount,
            imageUrl: publicUrl,
            caption,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to publish Instagram post."
        );
      }

      alert(
        "Instagram post published successfully!"
      );

      /**
       * Reset form.
       */
      setCaption("");
      setFile(null);
      setImageUrl("");

      /**
       * Refresh publishing history.
       */
      router.refresh();
    } catch (err: any) {
      console.error(err);

      alert(
        err.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  /**
   * Find currently selected account.
   */
  const selectedInstagramAccount =
    accounts.find(
      (account) =>
        account.id === selectedAccount
    );

  return (
    <div className="space-y-6">
      {/* =========================
          IMAGE UPLOAD
      ========================== */}
      <ImageUpload
        onSelect={(selectedFile) =>
          setFile(selectedFile)
        }
      />

      {/* =========================
          IMAGE PREVIEW
      ========================== */}
      {file && (
        <div className="rounded-lg border p-2">
          <Image
            src={URL.createObjectURL(file)}
            alt="Preview"
            width={600}
            height={600}
            className="h-auto w-full rounded-lg"
          />
        </div>
      )}

      {/* =========================
          INSTAGRAM ACCOUNT
      ========================== */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Instagram Account
        </label>

        <select
          className="w-full rounded-lg border p-3"
          value={selectedAccount}
          onChange={(e) =>
            setSelectedAccount(
              e.target.value
            )
          }
          disabled={
            loading ||
            accounts.length === 0
          }
        >
          {accounts.length === 0 ? (
            <option value="">
              No Instagram account connected
            </option>
          ) : (
            accounts.map((account) => (
              <option
                key={account.id}
                value={account.id}
              >
                @{account.username}
              </option>
            ))
          )}
        </select>

        {/* Selected account information */}
        {selectedInstagramAccount && (
          <div className="flex items-center gap-3 rounded-lg border bg-purple-50 p-3">
            {selectedInstagramAccount.profile_picture ? (
              <img
                src={
                  selectedInstagramAccount.profile_picture
                }
                alt={`@${selectedInstagramAccount.username}`}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 font-semibold text-white">
                {selectedInstagramAccount.username
                  ?.charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <div>
              <p className="text-sm font-semibold">
                @{selectedInstagramAccount.username}
              </p>

              <p className="text-xs text-green-600">
                {selectedInstagramAccount.is_active ===
                false
                  ? "Connection expired"
                  : "Ready to publish"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* =========================
          CAPTION
      ========================== */}
      <textarea
        className="w-full rounded-lg border p-3"
        rows={6}
        placeholder="Write your caption..."
        value={caption}
        onChange={(e) =>
          setCaption(e.target.value)
        }
        disabled={loading}
      />

      {/* =========================
          PUBLISH BUTTON
      ========================== */}
      <Button
        onClick={handlePublish}
        disabled={
          loading ||
          !file ||
          !selectedAccount ||
          accounts.length === 0
        }
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Publishing...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Publish Now
          </>
        )}
      </Button>

      {/* =========================
          UPLOADED IMAGE URL
      ========================== */}
      {imageUrl && (
        <div className="break-all rounded-md bg-green-50 p-3 text-sm text-green-700">
          <strong>
            Uploaded Image URL:
          </strong>

          <br />

          {imageUrl}
        </div>
      )}
    </div>
  );
}