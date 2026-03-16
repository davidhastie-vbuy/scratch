import { supabase } from "@/integrations/supabase/client";

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();
const EXPIRY_SECONDS = 3600; // 1 hour
const BUFFER_SECONDS = 300; // refresh 5 min before expiry

export async function getSignedStorageUrl(
  bucket: string,
  path: string
): Promise<string | null> {
  const cacheKey = `${bucket}/${path}`;
  const cached = signedUrlCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() / 1000 + BUFFER_SECONDS) {
    return cached.url;
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, EXPIRY_SECONDS);

  if (error || !data?.signedUrl) return null;

  signedUrlCache.set(cacheKey, {
    url: data.signedUrl,
    expiresAt: Date.now() / 1000 + EXPIRY_SECONDS,
  });

  return data.signedUrl;
}

export async function getSignedStorageUrls(
  bucket: string,
  paths: string[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const toFetch: string[] = [];

  for (const path of paths) {
    const cacheKey = `${bucket}/${path}`;
    const cached = signedUrlCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now() / 1000 + BUFFER_SECONDS) {
      result.set(path, cached.url);
    } else {
      toFetch.push(path);
    }
  }

  if (toFetch.length > 0) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrls(toFetch, EXPIRY_SECONDS);

    if (!error && data) {
      for (const item of data) {
        if (item.signedUrl && item.path) {
          result.set(item.path, item.signedUrl);
          signedUrlCache.set(`${bucket}/${item.path}`, {
            url: item.signedUrl,
            expiresAt: Date.now() / 1000 + EXPIRY_SECONDS,
          });
        }
      }
    }
  }

  return result;
}
