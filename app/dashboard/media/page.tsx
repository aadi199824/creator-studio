import MediaLibrary from "@/components/media/media-library";

export default function MediaLibraryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Media Library</h1>
        <p className="text-muted-foreground">
          Your uploaded images, ready to reuse in posts.
        </p>
      </div>

      <MediaLibrary />
    </div>
  );
}
