"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PublishedPostsService } from "@/lib/services/published-posts.service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PublishedPost {
  id: string;
  image_url: string;
  caption: string;
  platform: string;
  status: string;
  published_at: string;
}

export function PublishingHistory() {
  const [posts, setPosts] = useState<PublishedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const data = await PublishedPostsService.getPosts();
      setPosts(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p>Loading history...</p>;
  }

  if (!posts.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          No posts published yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardContent className="flex gap-4 p-4">
            <Image
              src={post.image_url}
              alt="Post"
              width={120}
              height={120}
              className="rounded-lg object-cover"
            />

            <div className="flex-1 space-y-2">
              <p className="line-clamp-3">{post.caption}</p>

              <div className="flex gap-2">
                <Badge>{post.platform}</Badge>
                <Badge variant="secondary">
                  {post.status}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                {new Date(post.published_at).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}