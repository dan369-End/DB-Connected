import React, { useState, useRef, useEffect } from 'react';
import {
  validateProductImageFile,
  getMarketplaceImageUrl,
  deleteMarketplaceStorageImage,
} from '../utils/imageStorage';
import { UploadIcon, CloseIcon, MarketplaceIcon } from '@/components/icons';

interface ProductImageUploaderProps {
  productId?: string;
  existingImagePath?: string | null;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  onExistingImageRemoved?: () => void;
  disabled?: boolean;
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  productId,
  existingImagePath,
  selectedFile,
  onFileSelect,
  onExistingImageRemoved,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Local object URL for previewing staged file
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  // Resolved Signed URL for existing image
  const [existingPreviewUrl, setExistingPreviewUrl] = useState<string | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Generate object preview URL when a new file is staged
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

  // Load existing image signed URL if available and no new file staged
  useEffect(() => {
    let isCancelled = false;

    if (existingImagePath && !selectedFile) {
      setLoadingExisting(true);
      getMarketplaceImageUrl(existingImagePath).then((url) => {
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
  }, [existingImagePath, selectedFile]);

  const processFile = (file: File) => {
    setErrorMsg(null);
    const validation = validateProductImageFile(file);
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

  // Delete existing image permanently
  const handleDeleteExisting = async () => {
    if (!existingImagePath || disabled) return;

    const ok = window.confirm(
      'Êtes-vous sûr de vouloir supprimer définitivement cette image du produit ?'
    );
    if (!ok) return;

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      await deleteMarketplaceStorageImage(existingImagePath);
      if (onExistingImageRemoved) {
        onExistingImageRemoved();
      }
      setExistingPreviewUrl(null);
    } catch {
      setErrorMsg("Impossible de supprimer l'image.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="product-image-uploader-section">
      <div className="uploader-header-row">
        <label className="form-label">Image du produit (Optionnel)</label>
        <span className="uploader-hint-text">
          JPG, PNG ou WEBP &bull; 5 Mo maximum
        </span>
      </div>

      {errorMsg && (
        <div className="auth-alert alert-error" role="alert">
          {errorMsg}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        disabled={disabled}
      />

      {/* State 1: Staged file (preview of chosen local image) */}
      {localPreviewUrl && selectedFile ? (
        <div className="product-image-preview-card">
          <div className="preview-image-container">
            <img
              src={localPreviewUrl}
              alt="Aperçu avant enregistrement"
              className="preview-img"
            />
            <span className="preview-badge-status warning">
              En attente d'enregistrement
            </span>
          </div>

          <div className="preview-info-column">
            <span className="preview-file-name">{selectedFile.name}</span>
            <span className="preview-file-size">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} Mo
            </span>

            <div className="preview-actions-row">
              <button
                type="button"
                className="btn-uploader-action replace"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                Changer l'image
              </button>
              <button
                type="button"
                className="btn-uploader-action cancel"
                onClick={() => onFileSelect(null)}
                disabled={disabled}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      ) : existingPreviewUrl ? (
        /* State 2: Existing image stored in private bucket */
        <div className="product-image-preview-card">
          <div className="preview-image-container">
            <img
              src={existingPreviewUrl}
              alt="Image actuelle du produit"
              className="preview-img"
            />
            <span className="preview-badge-status success">
              Image actuelle
            </span>
          </div>

          <div className="preview-info-column">
            <span className="preview-file-name">Image principale du produit</span>
            <span className="preview-file-size font-mono text-muted">
              {existingImagePath?.split('/').pop()}
            </span>

            <div className="preview-actions-row">
              <button
                type="button"
                className="btn-uploader-action replace"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isDeleting}
              >
                Remplacer
              </button>
              <button
                type="button"
                className="btn-uploader-action delete"
                onClick={handleDeleteExisting}
                disabled={disabled || isDeleting}
              >
                {isDeleting ? 'Suppression...' : "Supprimer l'image"}
              </button>
            </div>
          </div>
        </div>
      ) : loadingExisting ? (
        /* State 3: Loading existing image */
        <div className="product-image-dropzone loading-zone">
          <div className="spinner"></div>
          <span>Chargement de l'aperçu de l'image...</span>
        </div>
      ) : (
        /* State 4: Empty dropzone */
        <div
          className={`product-image-dropzone ${isDragOver ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              fileInputRef.current?.click();
            }
          }}
        >
          <div className="dropzone-inner-content">
            <div className="dropzone-icon-box">
              <UploadIcon size={24} />
            </div>
            <p className="dropzone-main-text">
              Glissez une image ici ou <span className="highlight-text">Choisir une image</span>
            </p>
            <span className="dropzone-sub-text">
              JPG, PNG ou WEBP &bull; 5 Mo maximum
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
