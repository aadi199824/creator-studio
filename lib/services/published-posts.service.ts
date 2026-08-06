import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export class PublishedPostsService {
  static async getPosts() {
    const response = await fetch(
      "/api/publishing/history"
    );

    if (!response.ok) {
      throw new Error("Unable to load posts.");
    }

    return response.json();
  }
}