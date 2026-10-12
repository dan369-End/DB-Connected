import {
  getPrivateImageSignedUrl,
  uploadPrivateImage,
  deletePrivateStorageImage,
  validateImageFile,
} from '@/utils/storageHelper';

export const OPPORTUNITY_STORAGE_BUCKET = 'opportunity-images';

/**
 * Builds canonical Storage path for an opportunity cover image:
 * opportunities/{opportunity_id}/cover-{timestamp}.{ext}
 */
export function buildOpportunityCoverStoragePath(
  opportunityId: string,
  originalFilename: string
): string {
  const lastDot = originalFilename.lastIndexOf('.');
  const ext = lastDot !== -1 ? originalFilename.slice(lastDot).toLowerCase() : '.webp';
  const cleanExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.webp';
  const timestamp = Date.now();
  return `opportunities/${opportunityId}/cover-${timestamp}${cleanExt}`;
}

/**
 * Resolves a signed URL for an opportunity cover image stored in private bucket opportunity-images.
 * Backwards compatible with legacy full http/https URLs.
 */
export async function getOpportunityImageUrl(
  imageUrl?: string | null,
  expiresInSeconds = 3600
): Promise<string | null> {
  return getPrivateImageSignedUrl(OPPORTUNITY_STORAGE_BUCKET, imageUrl, expiresInSeconds);
}

/**
 * Uploads a cover image to the private opportunity-images bucket.
 */
export async function uploadOpportunityCoverImage(
  opportunityId: string,
  file: File
): Promise<{ success: boolean; path?: string; error?: string }> {
  const path = buildOpportunityCoverStoragePath(opportunityId, file.name);
  return uploadPrivateImage(OPPORTUNITY_STORAGE_BUCKET, path, file);
}

/**
 * Deletes a cover image from the private opportunity-images bucket.
 */
export async function deleteOpportunityCoverImage(
  path?: string | null
): Promise<{ success: boolean; error?: string }> {
  return deletePrivateStorageImage(OPPORTUNITY_STORAGE_BUCKET, path);
}

export { validateImageFile };
