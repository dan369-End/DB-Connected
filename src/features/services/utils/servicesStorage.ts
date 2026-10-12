import {
  getPrivateImageSignedUrl,
  uploadPrivateImage,
  deletePrivateStorageImage,
  validateImageFile,
} from '@/utils/storageHelper';

export const SERVICES_STORAGE_BUCKET = 'services-images';

/**
 * Builds canonical Storage path for a service cover image:
 * services/{service_id}/cover-{timestamp}.{ext}
 */
export function buildServiceCoverStoragePath(serviceId: string, originalFilename: string): string {
  const lastDot = originalFilename.lastIndexOf('.');
  const ext = lastDot !== -1 ? originalFilename.slice(lastDot).toLowerCase() : '.webp';
  const cleanExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.webp';
  const timestamp = Date.now();
  return `services/${serviceId}/cover-${timestamp}${cleanExt}`;
}

export async function getServiceImageUrl(
  imageUrl?: string | null,
  expiresInSeconds = 1800
): Promise<string | null> {
  return getPrivateImageSignedUrl(SERVICES_STORAGE_BUCKET, imageUrl, expiresInSeconds);
}

export async function uploadServiceCoverImage(
  serviceId: string,
  file: File
): Promise<{ success: boolean; path?: string; error?: string }> {
  const path = buildServiceCoverStoragePath(serviceId, file.name);
  return uploadPrivateImage(SERVICES_STORAGE_BUCKET, path, file);
}

export async function deleteServiceCoverImage(
  path?: string | null
): Promise<{ success: boolean; error?: string }> {
  return deletePrivateStorageImage(SERVICES_STORAGE_BUCKET, path);
}

export { validateImageFile };
