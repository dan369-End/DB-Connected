import React, { useState, useRef, useEffect } from 'react';
import { validateImageFile } from '@/utils/storageHelper';
import { UploadIcon, CloseIcon } from '@/components/icons';

interface StorageImageUploaderProps {
  label: string;
  bucket: string;
  existingImagePath?: string | null;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  onExistingImageRemoved?: () => void;
  resolveImageUrl: (path: string) => Promise<string | null>;
  deleteImageObject: (path: string) => Promise<{ success: boolean; error?: string }>;
  fallbackIcon?: React.ReactNode;
  disabled?: boolean;
}

export const StorageImageUploader: React.FC<StorageImageUploaderProps> = ({
  label,
  existingImagePath,
  selectedFile,
  onFileSelect,
  onExistingImageRemoved,
  resolveImageUrl,
  deleteImageObject,
  fallbackIcon,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Local object URL for previewing newly staged file
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  // Resolved Signed URL for existing saved image
  const [existingPreviewUrl, setExistingPreviewUrl] = useState<string | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Staged file local preview with revocation
  useEffect(() => {
    if (selectedFile) {
      const objUrl = URL.createObjectURL(selectedFile);
      setLocalPreviewUrl(objUrl);
      return () => {
        URL.revokeObjectURL(objUrl);
      };
    } else {
      setLocalPreviewUrl(null);
    }
  }, [selectedFile]);

  // Load existing image URL if present and no new file selected
  useEffect(() => {
    let isCancelled = false;

    if (existingImagePath && !selectedFile) {
      setLoadingExisting(true);
      resolveImageUrl(existingImagePath).then((url) => {
        if (!isCancelled) {
          setExistingPreviewUrl(url);
          setLoadingExisting(false);
        }
      });
    } else {
      setExistingPreviewUrl(null);
    }

    return () => {
      isCancelled = true;
    };
  }, [existingImagePath, selectedFile, resolveImageUrl]);

  const processFile = (file: File) => {
    setErrorMsg(null);
    const validation = validateImageFile(file);
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
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDeleteExisting = async () => {
    if (!existingImagePath || isDeleting || disabled) return;

    const ok = window.confirm(
      'Confirmez-vous la suppression de cette image ? Cette action est irréversible.'
    );
    if (!ok) return;

    setIsDeleting(true);
    setErrorMsg(null);

    const res = await deleteImageObject(existingImagePath);
    if (!res.success) {
      setErrorMsg(res.error || "Erreur lors de la suppression de l'image.");
      setIsDeleting(false);
    } else {
      setExistingPreviewUrl(null);
      setIsDeleting(false);
      if (onExistingImageRemoved) {
        onExistingImageRemoved();
      }
    }
  };

  const handleCancelNewFile = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const activePreview = localPreviewUrl || existingPreviewUrl;

  return (
    <div className="product-image-uploader-container">
      <div className="uploader-header-row">
        <label className="form-label">{label}</label>
        <span className="uploader-hint-text">JPG, PNG ou WEBP &bull; Max 5 Mo</span>
      </div>

      {errorMsg && (
        <div className="auth-alert alert-error" style={{ marginBottom: '0.75rem' }}>
          {errorMsg}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        disabled={disabled || isDeleting}
        style={{ display: 'none' }}
      />

      {/* Active Preview Box */}
      {activePreview ? (
        <div className="product-image-preview-card">
          <div className="preview-img-wrapper">
            <img
              src={activePreview}
              alt="Aperçu"
              className="preview-img"
              onError={() => setErrorMsg("Impossible d'afficher l'aperçu de l'image.")}
            />
            {localPreviewUrl && (
              <span className="preview-status-pill new">Nouvelle image (non sauvegardée)</span>
            )}
            {existingPreviewUrl && !localPreviewUrl && (
              <span className="preview-status-pill saved">Image actuelle</span>
            )}
          </div>

          <div className="preview-details-box">
            <div className="preview-info-text">
              {selectedFile ? (
                <>
                  <span className="preview-file-name" title={selectedFile.name}>
                    {selectedFile.name}
                  </span>
                  <span className="preview-file-size">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} Mo
                  </span>
                </>
              ) : (
                <span className="preview-file-name">Fichier enregistré</span>
              )}
            </div>

            <div className="preview-actions-row">
              <button
                type="button"
                className="btn-uploader-action replace"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isDeleting}
              >
                Remplacer
              </button>

              {selectedFile && (
                <button
                  type="button"
                  className="btn-uploader-action cancel"
                  onClick={handleCancelNewFile}
                  disabled={disabled || isDeleting}
                >
                  Annuler le choix
                </button>
              )}

              {!selectedFile && existingImagePath && (
                <button
                  type="button"
                  className="btn-uploader-action delete"
                  onClick={handleDeleteExisting}
                  disabled={disabled || isDeleting}
                >
                  {isDeleting ? 'Suppression...' : "Supprimer l'image"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Dropzone Box */
        <div
          className={`product-image-dropzone ${isDragOver ? 'drag-over' : ''} ${
            disabled ? 'disabled' : ''
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled) fileInputRef.current?.click();
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              if (!disabled) fileInputRef.current?.click();
            }
          }}
        >
          {loadingExisting ? (
            <div className="dropzone-inner-content">
              <div className="spinner"></div>
              <span className="dropzone-text-sub">Chargement de l'image actuelle...</span>
            </div>
          ) : (
            <div className="dropzone-inner-content">
              <div className="dropzone-icon-box">
                {fallbackIcon || <UploadIcon size={24} />}
              </div>
              <div className="dropzone-text-group">
                <span className="dropzone-text-main">
                  Glissez une image ici ou <strong className="text-accent">cliquez pour choisir</strong>
                </span>
                <span className="dropzone-text-sub">
                  Formats supportés : JPG, PNG, WEBP (5 Mo max)
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
