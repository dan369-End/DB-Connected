import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ACADEMY_STORAGE_BUCKET,
  validateResourceFile,
  buildLessonResourceStoragePath,
  formatFileSize,
  getFriendlyFileFormat,
  getPrivateResourceSignedUrl,
  ALLOWED_EXTENSIONS,
} from '../utils/storage';
import { FileIcon, UploadIcon, CloseIcon } from '@/components/icons';
import type { AcademyLesson } from '@/types';

interface LessonAttachmentUploaderProps {
  courseId: string;
  moduleId: string;
  lessonId?: string;
  existingResourceUrl?: string | null;
  existingResourceName?: string | null;
  existingResourceType?: string | null;
  existingResourceSize?: number | null;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  onResourceDeleted?: () => void;
}

export const LessonAttachmentUploader: React.FC<LessonAttachmentUploaderProps> = ({
  courseId,
  moduleId,
  lessonId,
  existingResourceUrl,
  existingResourceName,
  existingResourceType,
  existingResourceSize,
  selectedFile,
  onFileSelect,
  onResourceDeleted,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingSignedUrl, setViewingSignedUrl] = useState(false);

  // Handle selected file validation
  const processFile = (file: File) => {
    setErrorMsg(null);
    const validation = validateResourceFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Fichier non valide.');
      return;
    }
    onFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Preview or consult existing resource via temporary signed URL
  const handleConsultExisting = async () => {
    if (!existingResourceUrl) return;
    setViewingSignedUrl(true);
    try {
      const { signedUrl, error } = await getPrivateResourceSignedUrl(existingResourceUrl, 600);
      if (error || !signedUrl) {
        alert("Impossible de générer l'accès temporaire au fichier.");
      } else {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      alert("Erreur lors de la consultation.");
    } finally {
      setViewingSignedUrl(false);
    }
  };

  // Delete existing resource:
  // 1. Remove object from private Storage bucket
  // 2. Set lesson resource columns to NULL
  const handleDeleteExisting = async () => {
    if (!supabase || !existingResourceUrl || !lessonId) return;

    const ok = window.confirm(
      `Confirmez-vous la suppression définitive du support de cours « ${existingResourceName || 'ce fichier'} » ?`
    );
    if (!ok) return;

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      // 1. Delete object from academy-resources bucket
      const { error: storageError } = await supabase.storage
        .from(ACADEMY_STORAGE_BUCKET)
        .remove([existingResourceUrl]);

      if (storageError) {
        console.warn('[DB-Connect Academy] Storage remove error:', storageError.message);
      }

      // 2. Update public.academy_lessons columns to NULL
      const { error: dbError } = await supabase
        .from('academy_lessons')
        .update({
          resource_url: null,
          resource_name: null,
          resource_type: null,
          resource_size: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lessonId);

      if (dbError) throw dbError;

      onFileSelect(null);
      if (onResourceDeleted) onResourceDeleted();
    } catch (err) {
      console.warn('[DB-Connect Academy] Delete resource error:', err);
      setErrorMsg("Impossible de supprimer le support.");
    } finally {
      setIsDeleting(false);
    }
  };

  const hasExisting = Boolean(existingResourceUrl);

  return (
    <div className="lesson-resource-uploader-block">
      <div className="resource-header-row">
        <div>
          <label className="form-label">Support de cours (Optionnel)</label>
          <span className="resource-hint-text">
            PDF, Word, PowerPoint, Excel, images, texte ou ZIP — 50 Mo maximum
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="auth-alert alert-error" role="alert">
          {errorMsg}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        accept={ALLOWED_EXTENSIONS.join(',')}
        onChange={handleInputChange}
      />

      {/* State 1: A new file is staged for upload */}
      {selectedFile ? (
        <div className="staged-file-card">
          <div className="staged-file-info">
            <div className="staged-file-icon">
              <FileIcon size={22} />
            </div>
            <div className="staged-file-details">
              <span className="staged-file-name">{selectedFile.name}</span>
              <span className="staged-file-meta">
                {getFriendlyFileFormat(selectedFile.name, selectedFile.type)} &bull; {formatFileSize(selectedFile.size)} &bull; <strong className="text-warning">En attente d'enregistrement</strong>
              </span>
            </div>
          </div>
          <div className="staged-file-actions">
            <button
              type="button"
              className="btn-replace-staged"
              onClick={() => fileInputRef.current?.click()}
            >
              Changer
            </button>
            <button
              type="button"
              className="btn-remove-staged"
              onClick={() => onFileSelect(null)}
              title="Annuler l'import"
            >
              <CloseIcon size={16} />
            </button>
          </div>
        </div>
      ) : hasExisting ? (
        /* State 2: An existing resource is already in Storage */
        <div className="existing-resource-card">
          <div className="resource-card-left">
            <div className="resource-card-icon">
              <FileIcon size={24} />
            </div>
            <div className="resource-card-meta">
              <span className="resource-card-name" title={existingResourceName || 'Support de cours'}>
                {existingResourceName || 'Support de cours'}
              </span>
              <span className="resource-card-sub">
                {getFriendlyFileFormat(existingResourceName, existingResourceType)} &bull; {formatFileSize(existingResourceSize)}
              </span>
            </div>
          </div>

          <div className="resource-card-actions">
            <button
              type="button"
              className="btn-resource-action consult"
              onClick={handleConsultExisting}
              disabled={viewingSignedUrl}
            >
              {viewingSignedUrl ? 'Ouverture...' : 'Consulter'}
            </button>
            <button
              type="button"
              className="btn-resource-action replace"
              onClick={() => fileInputRef.current?.click()}
            >
              Remplacer
            </button>
            <button
              type="button"
              className="btn-resource-action delete"
              onClick={handleDeleteExisting}
              disabled={isDeleting}
            >
              {isDeleting ? '...' : 'Supprimer'}
            </button>
          </div>
        </div>
      ) : (
        /* State 3: Empty drag & drop dropzone */
        <div
          className={`resource-dropzone ${isDragOver ? 'drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
          }}
        >
          <div className="dropzone-content">
            <div className="dropzone-icon">
              <UploadIcon size={26} />
            </div>
            <p className="dropzone-title">
              <strong>Cliquez pour importer</strong> ou glissez-déposez votre fichier ici
            </p>
            <span className="dropzone-hint">
              Formats supportés : PDF, DOCX, PPTX, XLSX, TXT, ZIP, Images (50 Mo max)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
