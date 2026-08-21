"use server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { requireAdminSession } from "@/lib/admin/requireAdmin";
import { getR2Client, getR2BucketName, getR2PublicUrl } from "./r2Client";

// Only these — a bakery product photo has no legitimate reason to be an
// SVG (XSS risk if ever rendered unsanitized) or arbitrary file type.
const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB — generous for a phone photo, not for a raw camera file

interface RequestUploadUrlInput {
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  // Which entity this image belongs to, used only to namespace the
  // storage key for organization (e.g. easier manual bucket browsing) —
  // it has no bearing on authorization, which is enforced by
  // requireAdminSession below regardless of folder.
  folder: "products" | "custom-requests";
}

// Deliberately a presigned-URL flow rather than routing image bytes
// through a Next.js server action: uploading a multi-megabyte file through
// a server action means the file passes through the Node process's memory
// before reaching R2, which is exactly the kind of memory pressure that
// already caused the Replit build failure noted in Phase 1 verification.
// This function only issues a short-lived signed URL; the actual bytes go
// browser -> R2 directly. The server never holds the file in memory.
//
// This is exported for use by admin product forms only right now.
// CustomRequest inspiration images (customer-facing upload, Phase 3) will
// need a *different* authorization check here — a guest customer, not an
// admin — so that path should get its own function rather than relaxing
// this one's admin requirement.
export async function requestProductImageUploadUrl(input: RequestUploadUrlInput) {
  await requireAdminSession();

  if (!ALLOWED_CONTENT_TYPES.has(input.contentType)) {
    throw new Error(
      `Unsupported image type "${input.contentType}". Use JPEG, PNG, or WebP.`
    );
  }

  if (input.fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `Image is too large (${(input.fileSizeBytes / (1024 * 1024)).toFixed(1)}MB). Maximum is 8MB.`
    );
  }

  // Random key rather than the original filename: avoids collisions
  // between two products both uploading "cake.jpg", avoids leaking the
  // customer's or admin's local filesystem naming, and sidesteps needing
  // to sanitize arbitrary filename characters for a URL-safe object key.
  const extension = input.fileName.split(".").pop()?.toLowerCase() ?? "jpg";
  const objectKey = `${input.folder}/${randomUUID()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: getR2BucketName(),
    Key: objectKey,
    ContentType: input.contentType,
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, {
    expiresIn: 300, // 5 minutes — long enough for a slow mobile upload, short enough to not be a standing credential
  });

  return {
    uploadUrl,
    publicUrl: getR2PublicUrl(objectKey),
    objectKey,
  };
}
