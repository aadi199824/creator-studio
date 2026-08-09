"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
}

export function PublishDialog() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      const response = await fetch("/api/instagram/accounts");
      const data = await response.json();

      if (data.accounts) {
        setAccounts(data.accounts);

        if (data.accounts.length > 0) {
          setSelectedAccount(data.accounts[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load Instagram accounts:", error);
    }
  }

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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not logged in.");
      }

      const publicUrl = await StorageService.uploadImage(
        file,
        user.id
      );

      setImageUrl(publicUrl);

      const response = await fetch("/api/instagram/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: selectedAccount,
          imageUrl: publicUrl,
          caption,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to publish Instagram post."
        );
      }

      alert("Instagram post published successfully!");

      setCaption("");
      setFile(null);
      setImageUrl("");

      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <ImageUpload
        onSelect={(selectedFile) => setFile(selectedFile)}
      />

      {file && (
        <div className="rounded-lg border p-2">
          <Image
            src={URL.createObjectURL(file)}
            alt="Preview"
            width={600}
            height={600}
            className="w-full h-auto rounded-lg"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Instagram Account
        </label>

        <select
          className="w-full rounded-lg border p-3"
          value={selectedAccount}
          onChange={(e) =>
            setSelectedAccount(e.target.value)
          }
        >
          {accounts.map((account) => (
            <option
              key={account.id}
              value={account.id}
            >
              @{account.username}
            </option>
          ))}
        </select>
      </div>

      <textarea
        className="w-full rounded-lg border p-3"
        rows={6}
        placeholder="Write your caption..."
        value={caption}
        onChange={(e) =>
          setCaption(e.target.value)
        }
      />

      <Button
        onClick={handlePublish}
        disabled={loading || !file}
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

      {imageUrl && (
        <div className="break-all rounded-md bg-green-50 p-3 text-sm text-green-700">
          <strong>Uploaded Image URL:</strong>
          <br />
          {imageUrl}
        </div>
      )}
    </div>
  );
}