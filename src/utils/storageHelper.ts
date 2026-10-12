import { supabase } from '@/lib/supabase';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates an image file.
 * Formats: JPG, PNG, WEBP. Max size: 5 Mo.
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: "L'image ne doit pas dépasser 5 Mo.",
    };
  }

  const name = file.name.toLowerCase();
  const hasAllowedExt = ALLOWED_IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext));
  const hasAllowedMime = ALLOWED_IMAGE_MIME_TYPES.includes(file.type);

  if (!hasAllowedExt && !hasAllowedMime) {
    return {
      valid: false,
      error: 'Le fichier doit être une image JPG, PNG ou WEBP.',
    };
  }

  return { valid: true };
}

// In-memory cache for generated signed URLs per bucket:path
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Resolves a private bucket storage image or legacy HTTP(S) URL.
 * - If urlOrPath starts with 'http://' or 'https://', returns it directly.
 * - Otherwise, calls createSignedUrl on the private bucket and caches result.
 */
export async function getPrivateImageSignedUrl(
  bucket: string,
  urlOrPath?: string | null,
  expiresInSeconds = 1800 // 30 minutes
): Promise<string | null> {
  if (!urlOrPath || !urlOrPath.trim()) {
    return null;
  }

  const trimmed = urlOrPath.trim();

  // 1. Backwards compatibility for existing full HTTP(S) URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // 2. Check memory cache (expires 60s before actual Supabase expiry)
  const cacheKey = `${bucket}:${trimmed}`;
  const cached = signedUrlCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now + 60000) {
    return cached.url;
  }

  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(trimmed, expiresInSeconds);

    if (error || !data?.signedUrl) {
      console.warn(`[DB-Connect Storage] Signed URL error for ${bucket}:${trimmed}:`, error?.message);
      return null;
    }

    signedUrlCache.set(cacheKey, {
      url: data.signedUrl,
      expiresAt: now + expiresInSeconds * 1000,
    });

    return data.signedUrl;
  } catch (err) {
    console.warn(`[DB-Connect Storage] Exception resolving signed URL for ${bucket}:${trimmed}:`, err);
    return null;
  }
}

/**
 * Uploads an image to a private storage bucket.
 * Returns the exact internal storage path.
 */
export async function uploadPrivateImage(
  bucket: string,
  path: string,
  file: File
): Promise<{ success: boolean; path?: string; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Client Supabase indisponible.' };
  }

  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/webp',
      });

    if (error) {
      console.warn(`[DB-Connect Storage] Upload error to ${bucket}:${path}:`, error.message);
      return { success: false, error: error.message };
    }

    return { success: true, path };
  } catch (err: unknown) {
    return { success: false, error: "Erreur réseau lors de l'importation de l'image." };
  }
}

/**
 * Deletes an object from a private storage bucket.
 */
export async function deletePrivateStorageImage(
  bucket: string,
  path?: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!path || !path.trim() || !supabase) {
    return { success: true };
  }

  const trimmed = path.trim();
  // Do not try to delete external http URLs from storage
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return { success: true };
  }

  try {
    const { error } = await supabase.storage.from(bucket).remove([trimmed]);
    if (error) {
      console.warn(`[DB-Connect Storage] Remove error for ${bucket}:${trimmed}:`, error.message);
      return { success: false, error: error.message };
    }

    signedUrlCache.delete(`${bucket}:${trimmed}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Erreur lors de la suppression du fichier.' };
  }
}
