import { S3Client } from "@aws-sdk/client-s3";

// Cloudflare R2 exposes an S3-compatible API, so the standard AWS S3 SDK
// works against it unmodified — only the endpoint and region differ from
// talking to real AWS. This is the reasoning behind choosing R2 over a
// bespoke SDK: if this project ever needed to move to actual S3, the
// client code below would not need to change, only the environment
// variables would.
//
// region is hardcoded to "auto" per Cloudflare's own R2 documentation —
// R2 does not have AWS-style regions, but the S3 client requires the
// field to be present.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Product image upload requires all R2_* environment variables — see .env.example.`
    );
  }
  return value;
}

let cachedClient: S3Client | null = null;

// Lazily constructed and cached for the same reason as lib/db/prisma.ts:
// avoid re-creating the client (and its underlying connection handling) on
// every hot reload in development. Lazy rather than eager also means a
// developer who has not set up R2 yet can still run the app and use every
// other Phase 2 feature — the error above only fires the moment an upload
// is actually attempted, not at server startup.
export function getR2Client(): S3Client {
  if (cachedClient) return cachedClient;

  const accountId = requireEnv("R2_ACCOUNT_ID");

  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });

  return cachedClient;
}

export function getR2BucketName(): string {
  return requireEnv("R2_BUCKET_NAME");
}

export function getR2PublicUrl(objectKey: string): string {
  const publicBase = requireEnv("R2_PUBLIC_URL").replace(/\/$/, "");
  return `${publicBase}/${objectKey}`;
}
