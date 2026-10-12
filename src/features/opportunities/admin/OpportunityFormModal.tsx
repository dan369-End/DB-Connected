import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth';
import type { Opportunity, OpportunityCategory, OpportunityStatus } from '@/types';
import {
  upsertOpportunity,
  updateOpportunityImageUrl,
  generateSlug,
} from '../opportunitiesService';
import {
  uploadOpportunityCoverImage,
  deleteOpportunityCoverImage,
  getOpportunityImageUrl,
  validateImageFile,
} from '../utils/opportunityStorage';
import { CloseIcon, UploadIcon, TrashIcon, EditIcon } from '@/components/icons';

interface OpportunityFormModalProps {
  opportunity?: Opportunity | null;
  categories: OpportunityCategory[];
  onClose: () => void;
  onSuccess: (saved: Opportunity) => void;
}

export const OpportunityFormModal: React.FC<OpportunityFormModalProps> = ({
  opportunity,
  categories,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState(opportunity?.title || '');
  const [slug, setSlug] = useState(opportunity?.slug || '');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(Boolean(opportunity));
  const [categoryId, setCategoryId] = useState<string>(
    opportunity?.category_id !== null && opportunity?.category_id !== undefined
      ? String(opportunity.category_id)
      : ''
  );
  const [organizationName, setOrganizationName] = useState(opportunity?.organization_name || '');
  const [location, setLocation] = useState(opportunity?.location || '');
  const [shortDescription, setShortDescription] = useState(opportunity?.short_description || '');
  const [description, setDescription] = useState(opportunity?.description || '');
  const [applicationUrl, setApplicationUrl] = useState(opportunity?.application_url || '');
  const [deadline, setDeadline] = useState(
    opportunity?.deadline ? opportunity.deadline.slice(0, 10) : ''
  );
  const [status, setStatus] = useState<OpportunityStatus>(
    (opportunity?.status as OpportunityStatus) || 'draft'
  );

  // Cover image management
  const [existingCoverPath, setExistingCoverPath] = useState<string | null>(
    opportunity?.image_url || null
  );
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isImageRemoved, setIsImageRemoved] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-generate slug when title changes unless manually edited
  useEffect(() => {
    if (!isSlugManuallyEdited && title.trim()) {
      setSlug(generateSlug(title));
    }
  }, [title, isSlugManuallyEdited]);

  // Resolve signed URL for existing cover if present
  useEffect(() => {
    let active = true;
    if (existingCoverPath && !isImageRemoved) {
      getOpportunityImageUrl(existingCoverPath).then((url) => {
        if (active && url) {
          setExistingCoverUrl(url);
        }
      });
    } else {
      setExistingCoverUrl(null);
    }
    return () => {
      active = false;
    };
  }, [existingCoverPath, isImageRemoved]);

  // Clean up object preview URL on unmount or file change
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const handleFileSelection = (file: File) => {
    setErrorMessage(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Format ou taille d’image invalide.');
      return;
    }

    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }

    const preview = URL.createObjectURL(file);
    setSelectedFile(file);
    setFilePreviewUrl(preview);
    setIsImageRemoved(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleRemoveImage = () => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setIsImageRemoved(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setErrorMessage('Session expirée. Veuillez vous reconnecter.');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Le titre de l’opportunité est obligatoire.');
      return;
    }

    if (!organizationName.trim()) {
      setErrorMessage('Le nom de l’organisation ou entreprise est obligatoire.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (opportunity) {
        // ==========================================
        // UPDATE EXISTING OPPORTUNITY
        // ==========================================
        let finalStoragePath: string | null = isImageRemoved ? null : existingCoverPath;
        let uploadedNewPath: string | null = null;
        const oldStoragePath = existingCoverPath;

        // 1. If a new file was staged, upload to Storage first
        if (selectedFile) {
          const uploadRes = await uploadOpportunityCoverImage(opportunity.id, selectedFile);
          if (!uploadRes.success || !uploadRes.path) {
            setErrorMessage(uploadRes.error || "Échec de l'importation de l'image.");
            setIsSaving(false);
            return;
          }
          finalStoragePath = uploadRes.path;
          uploadedNewPath = uploadRes.path;
        }

        // 2. Update record in DB
        const res = await upsertOpportunity({
          id: opportunity.id,
          title: title.trim(),
          slug: slug.trim() || generateSlug(title),
          categoryId: categoryId ? categoryId : null,
          organizationName: organizationName.trim(),
          location: location.trim() || null,
          shortDescription: shortDescription.trim() || null,
          description: description.trim() || null,
          imageUrl: finalStoragePath,
          applicationUrl: applicationUrl.trim() || null,
          deadline: deadline || null,
          status,
          userId: user.id,
        });

        if (!res.success || !res.opportunity) {
          setErrorMessage(res.error || "Impossible d'enregistrer l'opportunité.");
          setIsSaving(false);
          return;
        }

        // 3. Clean up previous storage file if replaced or removed
        if ((uploadedNewPath || isImageRemoved) && oldStoragePath && oldStoragePath !== finalStoragePath) {
          deleteOpportunityCoverImage(oldStoragePath).catch((err) => {
            console.warn('[DB-Connect Opportunities] Previous image cleanup note:', err);
          });
        }

        onSuccess(res.opportunity);
      } else {
        // ==========================================
        // CREATE NEW OPPORTUNITY
        // ==========================================
        // 1. Insert opportunity first to get generated UUID
        const res = await upsertOpportunity({
          title: title.trim(),
          slug: slug.trim() || generateSlug(title),
          categoryId: categoryId ? categoryId : null,
          organizationName: organizationName.trim(),
          location: location.trim() || null,
          shortDescription: shortDescription.trim() || null,
          description: description.trim() || null,
          imageUrl: null,
          applicationUrl: applicationUrl.trim() || null,
          deadline: deadline || null,
          status,
          userId: user.id,
        });

        if (!res.success || !res.opportunity) {
          setErrorMessage(res.error || "Impossible de créer l'opportunité.");
          setIsSaving(false);
          return;
        }

        let savedOpp = res.opportunity;

        // 2. If image was selected, upload using opportunity ID
        if (selectedFile) {
          const uploadRes = await uploadOpportunityCoverImage(savedOpp.id, selectedFile);
          if (uploadRes.success && uploadRes.path) {
            await updateOpportunityImageUrl(savedOpp.id, uploadRes.path);
            savedOpp = { ...savedOpp, image_url: uploadRes.path };
          } else {
            console.warn('[DB-Connect Opportunities] Cover upload failed on creation:', uploadRes.error);
          }
        }

        onSuccess(savedOpp);
      }
    } catch {
      setErrorMessage('Une erreur imprévue est survenue.');
      setIsSaving(false);
    }
  };

  // Determine which preview to show (staged file or existing DB cover)
  const currentPreview = filePreviewUrl || (!isImageRemoved ? existingCoverUrl : null);

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container opportunity-form-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {opportunity ? "Modifier l'opportunité" : 'Créer une opportunité'}
            </h2>
            <p className="modal-subtitle">
              {opportunity
                ? `Mise à jour de « ${opportunity.title} »`
                : 'Renseignez les détails du poste, de la mission ou de l’appel à projets.'}
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Fermer"
            disabled={isSaving}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {errorMessage && (
          <div className="auth-alert alert-error" role="alert">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-course-form">
          {/* Cover Image Upload / Preview Field */}
          <div className="form-group">
            <label className="form-label">Image de l'opportunité</label>

            {currentPreview ? (
              <div className="opportunity-preview-compact-box">
                <div className="preview-image-wrapper">
                  <img
                    src={currentPreview}
                    alt="Aperçu de l'opportunité"
                    className="compact-cover-img"
                  />
                </div>
                <div className="preview-actions-col">
                  <span className="text-xs text-slate-300 font-medium truncate max-w-[200px]">
                    {selectedFile ? selectedFile.name : 'Image actuelle enregistrée'}
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      className="btn-table-action"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSaving}
                    >
                      <EditIcon size={14} />
                      <span>Remplacer</span>
                    </button>
                    <button
                      type="button"
                      className="btn-table-action delete-action"
                      onClick={handleRemoveImage}
                      disabled={isSaving}
                    >
                      <TrashIcon size={14} />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`opportunity-dropzone ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
              >
                <div className="dropzone-icon-circle">
                  <UploadIcon size={22} className="text-cyan-400" />
                </div>
                <div className="dropzone-text-group">
                  <p className="dropzone-primary-text">
                    <span className="text-cyan-400 font-semibold">Glissez une image ici</span> ou{' '}
                    <span className="underline">choisir une image</span>
                  </p>
                  <p className="dropzone-sub-text">
                    Formats acceptés : JPG, PNG, WEBP (max. 5 Mo)
                  </p>
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleFileInputChange}
              disabled={isSaving}
            />
          </div>

          <div className="form-grid-2col">
            <div className="form-group">
              <label className="form-label" htmlFor="opp-title">
                Titre de l'opportunité *
              </label>
              <input
                id="opp-title"
                type="text"
                required
                className="form-input"
                placeholder="Ex : Développeur React Full-Stack Junior"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="opp-org">
                Organisation / Entreprise *
              </label>
              <input
                id="opp-org"
                type="text"
                required
                className="form-input"
                placeholder="Ex : Congo Digital Hub"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="form-grid-2col">
            <div className="form-group">
              <label className="form-label" htmlFor="opp-cat">
                Catégorie thématique
              </label>
              <select
                id="opp-cat"
                className="form-input"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={isSaving}
              >
                <option value="">-- Aucune catégorie --</option>
                {categories.map((c) => (
                  <option key={String(c.id)} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="opp-loc">
                Localisation
              </label>
              <input
                id="opp-loc"
                type="text"
                className="form-input"
                placeholder="Ex : Brazzaville / Télétravail"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="form-grid-2col">
            <div className="form-group">
              <label className="form-label" htmlFor="opp-slug">
                Slug URL
              </label>
              <input
                id="opp-slug"
                type="text"
                className="form-input font-mono"
                placeholder="developpeur-react-fullstack"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setIsSlugManuallyEdited(true);
                }}
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="opp-deadline">
                Date limite de candidature
              </label>
              <input
                id="opp-deadline"
                type="date"
                className="form-input font-mono"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="opp-shortdesc">
              Description synthétique (affichée sur la carte)
            </label>
            <input
              id="opp-shortdesc"
              type="text"
              className="form-input"
              placeholder="Synthèse du profil recherché ou de la mission en une phrase..."
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="opp-desc">
              Description complète de l'offre
            </label>
            <textarea
              id="opp-desc"
              rows={4}
              className="form-input"
              placeholder="Missions, responsabilités, compétences requises, avantages..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="form-grid-2col">
            <div className="form-group">
              <label className="form-label" htmlFor="opp-exturl">
                Lien de candidature externe (optionnel)
              </label>
              <input
                id="opp-exturl"
                type="url"
                className="form-input"
                placeholder="https://recrutement.entreprise.cg/postuler"
                value={applicationUrl}
                onChange={(e) => setApplicationUrl(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="opp-status">
                Statut de publication *
              </label>
              <select
                id="opp-status"
                className="form-input"
                value={status}
                onChange={(e) => setStatus(e.target.value as OpportunityStatus)}
                disabled={isSaving}
              >
                <option value="draft">Brouillon (non visible des utilisateurs)</option>
                <option value="published">Publiée (accessible au catalogue)</option>
                <option value="archived">Archivée (masquée)</option>
              </select>
            </div>
          </div>

          <div className="modal-footer-actions">
            <button
              type="button"
              className="btn-admin-cta"
              onClick={onClose}
              disabled={isSaving}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-admin-cta primary"
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="btn-loading-content">
                  <span className="spinner" /> Enregistrement...
                </span>
              ) : opportunity ? (
                'Mettre à jour'
              ) : (
                "Créer l'opportunité"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
