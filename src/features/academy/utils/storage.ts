import { supabase } from '@/lib/supabase';

export const ACADEMY_STORAGE_BUCKET = 'academy-resources';
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// Authorized extensions and MIME types
export const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.xls',
  '.xlsx',
  '.txt',
  '.zip',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
];

/**
 * Validates a file against allowed formats and size limits (50 MB).
 */
export function validateResourceFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Le fichier dépasse la taille maximale autorisée de 50 Mo (Taille actuelle : ${formatFileSize(file.size)}).`,
    };
  }

  const name = file.name.toLowerCase();
  const hasAllowedExt = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  if (!hasAllowedExt) {
    return {
      valid: false,
      error: `Format non autorisé. Formats acceptés : PDF, Word, PowerPoint, Excel, images (JPG, PNG, WEBP), texte (TXT) et ZIP.`,
    };
  }

  // Check for dangerous executables
  const dangerous = ['.exe', '.bat', '.sh', '.bin', '.cmd', '.msi', '.vbs', '.js', '.scr'];
  if (dangerous.some((ext) => name.endsWith(ext))) {
    return {
      valid: false,
      error: `Type de fichier interdit pour des raisons de sécurité.`,
    };
  }

  return { valid: true };
}

/**
 * Sanitizes a filename to prevent invalid characters in Storage paths.
 */
export function sanitizeFileName(name: string): string {
  const lastDot = name.lastIndexOf('.');
  const base = lastDot !== -1 ? name.slice(0, lastDot) : name;
  const ext = lastDot !== -1 ? name.slice(lastDot).toLowerCase() : '';

  const cleanBase = base
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 60);

  // Append short random salt to prevent collisions
  const salt = Math.random().toString(36).substring(2, 7);
  return `${cleanBase}_${salt}${ext}`;
}

/**
 * Constructs the canonical private storage path:
 * courses/{course_id}/{module_id}/{lesson_id}/{filename}
 */
export function buildLessonResourceStoragePath(
  courseId: string,
  moduleId: string,
  lessonId: string,
  originalFilename: string
): string {
  const safeFilename = sanitizeFileName(originalFilename);
  return `courses/${courseId}/${moduleId}/${lessonId}/${safeFilename}`;
}

/**
 * Formats byte size into human readable string (Ko, Mo)
 */
export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '0 Ko';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/**
 * Returns a human-friendly format tag for the file based on extension or mime type
 */
export function getFriendlyFileFormat(filename?: string | null, mimeType?: string | null): string {
  if (!filename && !mimeType) return 'Fichier';
  const name = (filename || '').toLowerCase();

  if (name.endsWith('.pdf') || mimeType === 'application/pdf') return 'PDF';
  if (name.endsWith('.doc') || name.endsWith('.docx')) return 'Word';
  if (name.endsWith('.ppt') || name.endsWith('.pptx')) return 'PowerPoint';
  if (name.endsWith('.xls') || name.endsWith('.xlsx')) return 'Excel';
  if (name.endsWith('.zip')) return 'Archive ZIP';
  if (name.endsWith('.txt')) return 'Texte';
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp')) return 'Image';
  return 'Document';
}

/**
 * Creates a short-lived Signed URL for viewing or downloading a file from private storage.
 * The Signed URL is ephemeral (never stored in database).
 * @param path Storage path in 'academy-resources'
 * @param expiresInSeconds Duration before expiry (defaults to 10 minutes = 600s)
 * @param download Optional boolean or string filename to trigger download attachment
 */
export async function getPrivateResourceSignedUrl(
  path: string,
  expiresInSeconds = 600,
  download?: boolean | string
): Promise<{ signedUrl: string | null; error: Error | null }> {
  if (!supabase) {
    return { signedUrl: null, error: new Error('Supabase client indisponible') };
  }

  try {
    const options: { download?: string | boolean } = {};
    if (download) {
      options.download = download;
    }

    const { data, error } = await supabase.storage
      .from(ACADEMY_STORAGE_BUCKET)
      .createSignedUrl(path, expiresInSeconds, options);

    if (error) {
      return { signedUrl: null, error };
    }

    return { signedUrl: data.signedUrl, error: null };
  } catch (err) {
    return { signedUrl: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Downloads a private resource directly as a Blob using the current authenticated session.
 */
export async function downloadPrivateResourceBlob(path: string): Promise<{ blob: Blob | null; error: Error | null }> {
  if (!supabase) {
    return { blob: null, error: new Error('Supabase client indisponible') };
  }

  try {
    const { data, error } = await supabase.storage
      .from(ACADEMY_STORAGE_BUCKET)
      .download(path);

    if (error) {
      return { blob: null, error };
    }

    return { blob: data, error: null };
  } catch (err) {
    return { blob: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
