import {
  getPrivateImageSignedUrl,
  uploadPrivateImage,
  deletePrivateStorageImage,
} from '@/utils/storageHelper';

export const PROFILE_AVATAR_BUCKET = 'profile-avatars';

export const MAX_AVATAR_SIZE_BYTES = 3 * 1024 * 1024; // 3 Mo

export const ALLOWED_AVATAR_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
export const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates an avatar image file.
 * Formats: JPG, PNG, WEBP. Max size: 3 Mo.
 */
export function validateAvatarFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return {
      valid: false,
      error: "L'avatar ne doit pas dépasser 3 Mo.",
    };
  }

  const name = file.name.toLowerCase();
  const hasAllowedExt = ALLOWED_AVATAR_EXTENSIONS.some((ext) => name.endsWith(ext));
  const hasAllowedMime = ALLOWED_AVATAR_MIME_TYPES.includes(file.type);

  if (!hasAllowedExt && !hasAllowedMime) {
    return {
      valid: false,
      error: 'Le fichier doit être une image JPG, PNG ou WEBP.',
    };
  }

  return { valid: true };
}

/**
 * Builds canonical Storage path for a user avatar:
 * users/{user_id}/avatar-{timestamp}.{ext}
 */
export function buildAvatarStoragePath(userId: string, originalFilename: string): string {
  const lastDot = originalFilename.lastIndexOf('.');
  const ext = lastDot !== -1 ? originalFilename.slice(lastDot).toLowerCase() : '.webp';
  const cleanExt = ALLOWED_AVATAR_EXTENSIONS.includes(ext) ? ext : '.webp';
  const timestamp = Date.now();
  return `users/${userId}/avatar-${timestamp}${cleanExt}`;
}

/**
 * Retrieves a temporary signed URL for a private avatar image.
 * Valid for 3600 seconds (1 hour).
 */
export async function getProfileAvatarSignedUrl(
  avatarPath?: string | null,
  expiresInSeconds = 3600
): Promise<string | null> {
  return getPrivateImageSignedUrl(PROFILE_AVATAR_BUCKET, avatarPath, expiresInSeconds);
}

/**
 * Uploads a new avatar file to the private bucket.
 * Returns the exact Storage internal path.
 */
export async function uploadProfileAvatar(
  userId: string,
  file: File
): Promise<{ success: boolean; path?: string; error?: string }> {
  const validation = validateAvatarFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const path = buildAvatarStoragePath(userId, file.name);
  return uploadPrivateImage(PROFILE_AVATAR_BUCKET, path, file);
}

/**
 * Deletes an avatar file from the private bucket.
 */
export async function deleteProfileAvatar(
  path?: string | null
): Promise<{ success: boolean; error?: string }> {
  return deletePrivateStorageImage(PROFILE_AVATAR_BUCKET, path);
}
