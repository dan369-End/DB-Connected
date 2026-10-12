import {
  getPrivateImageSignedUrl,
  uploadPrivateImage,
  deletePrivateStorageImage,
  validateImageFile,
} from '@/utils/storageHelper';

export const ACADEMY_STORAGE_BUCKET = 'academy-images';

/**
 * Builds canonical Storage path for a course cover image:
 * courses/{course_id}/cover-{timestamp}.{ext}
 */
export function buildCourseCoverStoragePath(courseId: string, originalFilename: string): string {
  const lastDot = originalFilename.lastIndexOf('.');
  const ext = lastDot !== -1 ? originalFilename.slice(lastDot).toLowerCase() : '.webp';
  const cleanExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.webp';
  const timestamp = Date.now();
  return `courses/${courseId}/cover-${timestamp}${cleanExt}`;
}

export async function getAcademyCourseImageUrl(
  thumbnailUrl?: string | null,
  expiresInSeconds = 1800
): Promise<string | null> {
  return getPrivateImageSignedUrl(ACADEMY_STORAGE_BUCKET, thumbnailUrl, expiresInSeconds);
}

export async function uploadCourseCoverImage(
  courseId: string,
  file: File
): Promise<{ success: boolean; path?: string; error?: string }> {
  const path = buildCourseCoverStoragePath(courseId, file.name);
  return uploadPrivateImage(ACADEMY_STORAGE_BUCKET, path, file);
}

export async function deleteCourseCoverImage(
  path?: string | null
): Promise<{ success: boolean; error?: string }> {
  return deletePrivateStorageImage(ACADEMY_STORAGE_BUCKET, path);
}

export { validateImageFile };
