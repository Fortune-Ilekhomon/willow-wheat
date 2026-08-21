"use client";

import { useState } from "react";
import { requestProductImageUploadUrl } from "@/lib/storage/uploadImage";

// Presigned-URL upload: this component asks the server for a signed URL,
// then PUTs the file bytes directly to R2 from the browser. The server
// action never sees the image bytes — see the comment in
// lib/storage/uploadImage.ts for why that matters on Replit's memory
// budget. This means a failed upload here is a browser-to-Cloudflare
// network error, not something the Next.js server can log — errors are
// surfaced to the admin directly rather than silently retried, since a
// silent retry of a large file on a flaky connection is a worse
// experience than a clear "try again" prompt.
export function ImageUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file name after removal
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const { uploadUrl, publicUrl } = await requestProductImageUploadUrl({
        fileName: file.name,
        contentType: file.type,
        fileSizeBytes: file.size,
        folder: "products",
      });

      const putResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!putResponse.ok) {
        throw new Error("Upload to storage failed. Check your connection and try again.");
      }

      onChange([...images, publicUrl]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Try again.");
    } finally {
      setIsUploading(false);
    }
  }

  function removeImage(url: string) {
    onChange(images.filter((image) => image !== url));
  }

  return (
    <div>
      <label className="block text-sm font-medium text-text-primary">
        Product images
      </label>

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((url) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-md border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element -- external R2 URLs, no next/image domain config needed for admin-only preview */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute right-1 top-1 rounded-full bg-cocoa/90 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3">
        <label className="inline-flex cursor-pointer items-center rounded-md border border-border bg-page-bg px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-cream">
          {isUploading ? "Uploading…" : "Add image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </label>
        <p className="mt-1 text-xs text-text-secondary">
          JPEG, PNG, or WebP. Up to 8MB.
        </p>
      </div>

      {error && (
        <p className="mt-2 rounded-md bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
