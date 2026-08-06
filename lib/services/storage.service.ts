import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export class StorageService {
  static async uploadImage(file: File, userId: string) {
    const fileExt = file.name.split(".").pop();

    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("media")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from("media")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }
}