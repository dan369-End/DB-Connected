import { supabase } from '@/lib/supabase';

export const MARKETPLACE_STORAGE_BUCKET = 'marketplace-images';
export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates a selected product image file.
 * Allowed: JPG, PNG, WEBP. Max size: 5 Mo.
 */
export function validateProductImageFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
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
      error: "Le fichier doit être une image JPG, PNG ou WEBP.",
    };
  }

  return { valid: true };
}

/**
 * Builds the canonical Storage path for a product image:
 * products/{product_id}/main-{timestamp}.{ext}
 */
export function buildProductImageStoragePath(productId: string, originalFilename: string): string {
  const lastDot = originalFilename.lastIndexOf('.');
  const ext = lastDot !== -1 ? originalFilename.slice(lastDot).toLowerCase() : '.webp';
  const cleanExt = ALLOWED_IMAGE_EXTENSIONS.includes(ext) ? ext : '.webp';
  const timestamp = Date.now();
  return `products/${productId}/main-${timestamp}${cleanExt}`;
}

// In-memory cache for generated signed URLs to avoid redundant calls during component lifecycle
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Resolves a product image URL.
 * Handles backwards compatibility:
 * - If path starts with 'http://' or 'https://', returns it directly.
 * - Otherwise, treats it as a private Storage path in 'marketplace-images' and creates a short-lived Signed URL.
 */
export async function getMarketplaceImageUrl(
  imagePath?: string | null,
  expiresInSeconds = 1800 // 30 minutes
): Promise<string | null> {
  if (!imagePath || !imagePath.trim()) {
    return null;
  }

  const trimmed = imagePath.trim();

  // 1. Backwards compatibility: external HTTP(S) URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // 2. Check memory cache (expires 60s before actual Supabase expiry)
  const cached = signedUrlCache.get(trimmed);
  const now = Date.now();
  if (cached && cached.expiresAt > now + 60000) {
    return cached.url;
  }

  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from(MARKETPLACE_STORAGE_BUCKET)
      .createSignedUrl(trimmed, expiresInSeconds);

    if (error || !data?.signedUrl) {
      console.warn('[DB-Connect Marketplace] Signed URL error for image:', error?.message);
      return null;
    }

    // Cache the resolved signed URL
    signedUrlCache.set(trimmed, {
      url: data.signedUrl,
      expiresAt: now + expiresInSeconds * 1000,
    });

    return data.signedUrl;
  } catch (err) {
    console.warn('[DB-Connect Marketplace] Error resolving image URL:', err);
    return null;
  }
}

/**
 * Removes an image object from the private marketplace-images bucket.
 */
export async function deleteMarketplaceStorageImage(imagePath: string): Promise<boolean> {
  if (!supabase || !imagePath || imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return false;
  }

  try {
    const { error } = await supabase.storage
      .from(MARKETPLACE_STORAGE_BUCKET)
      .remove([imagePath]);

    if (error) {
      console.warn('[DB-Connect Marketplace] Storage delete error:', error.message);
      return false;
    }

    signedUrlCache.delete(imagePath);
    return true;
  } catch (err) {
    console.warn('[DB-Connect Marketplace] Unexpected storage delete error:', err);
    return false;
  }
}
