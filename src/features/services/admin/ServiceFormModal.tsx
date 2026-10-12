import React, { useState } from 'react';
import { useAuth } from '@/features/auth';
import { supabase } from '@/lib/supabase';
import { upsertService } from '../servicesService';
import { generateSlug } from '../utils';
import { StorageImageUploader } from '@/components/StorageImageUploader';
import {
  getServiceImageUrl,
  uploadServiceCoverImage,
  deleteServiceCoverImage,
} from '../utils/servicesStorage';
import { ServicesIcon } from '@/components/icons';
import type { ServiceRecord, ServiceCategory, ServiceStatus } from '@/types';

interface ServiceFormModalProps {
  service?: ServiceRecord | null;
  categories: ServiceCategory[];
  onClose: () => void;
  onSaved: () => void;
}

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  service,
  categories,
  onClose,
  onSaved,
}) => {
  const { user } = useAuth();

  const [title, setTitle] = useState(service?.title || '');
  const [categoryId, setCategoryId] = useState(service?.category_id || '');
  const [slug, setSlug] = useState(service?.slug || '');
  const [shortDescription, setShortDescription] = useState(service?.short_description || '');
  const [description, setDescription] = useState(service?.description || '');
  const [priceFrom, setPriceFrom] = useState<string>(
    service?.price_from !== undefined && service?.price_from !== null
      ? String(service.price_from)
      : ''
  );
  const [currency, setCurrency] = useState(service?.currency || 'XAF');
  const [status, setStatus] = useState<ServiceStatus>(
    (service?.status as ServiceStatus) || 'draft'
  );

  // Staged image file from computer
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Stored image path from DB
  const [currentImagePath, setCurrentImagePath] = useState<string | null>(
    service?.image_url || null
  );

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!service) {
      setSlug(generateSlug(val));
    }
  };

  const handleExistingImageRemoved = async () => {
    if (service?.id) {
      await supabase
        ?.from('services')
        .update({
          image_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', service.id);
    }
    setCurrentImagePath(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMessage('Le titre de la prestation est obligatoire.');
      return;
    }

    if (!user?.id) {
      setErrorMessage('Session expirée. Veuillez vous reconnecter.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const parsedPrice = priceFrom.trim() === '' ? null : parseFloat(priceFrom);
    if (priceFrom.trim() !== '' && (isNaN(parsedPrice!) || parsedPrice! < 0)) {
      setErrorMessage('Le prix indicatif doit être un nombre positif ou être laissé vide (Sur devis).');
      setSaving(false);
      return;
    }

    try {
      if (service) {
        // === UPDATE EXISTING SERVICE ===
        let newStoragePath = currentImagePath;
        const oldStoragePath = service.image_url;

        // If a new file is chosen, upload it first
        if (selectedFile) {
          const uploadRes = await uploadServiceCoverImage(service.id, selectedFile);
          if (!uploadRes.success || !uploadRes.path) {
            setErrorMessage(uploadRes.error || "Échec de l'importation de l'image de la prestation.");
            setSaving(false);
            return;
          }
          newStoragePath = uploadRes.path;
        }

        const res = await upsertService({
          id: service.id,
          categoryId: categoryId || null,
          title,
          slug: slug || generateSlug(title),
          shortDescription,
          description,
          priceFrom: parsedPrice,
          currency: currency || 'XAF',
          imageUrl: newStoragePath,
          status,
          userId: user.id,
        });

        if (!res.success) {
          setErrorMessage(res.error || "Erreur lors de l'enregistrement du service.");
          setSaving(false);
          return;
        }

        // If replaced, delete old image object after DB update success
        if (selectedFile && oldStoragePath && oldStoragePath !== newStoragePath) {
          await deleteServiceCoverImage(oldStoragePath);
        }

        setSaving(false);
        onSaved();
      } else {
        // === CREATE NEW SERVICE ===
        // 1. Create service record first to get ID
        const res = await upsertService({
          categoryId: categoryId || null,
          title,
          slug: slug || generateSlug(title),
          shortDescription,
          description,
          priceFrom: parsedPrice,
          currency: currency || 'XAF',
          imageUrl: null,
          status,
          userId: user.id,
        });

        if (!res.success || !res.service) {
          setErrorMessage(res.error || 'Erreur lors de la création du service.');
          setSaving(false);
          return;
        }

        const createdService = res.service;

        // 2. Upload image if chosen
        if (selectedFile) {
          const uploadRes = await uploadServiceCoverImage(createdService.id, selectedFile);
          if (uploadRes.success && uploadRes.path) {
            await supabase
              ?.from('services')
              .update({
                image_url: uploadRes.path,
                updated_at: new Date().toISOString(),
              })
              .eq('id', createdService.id);
          }
        }

        setSaving(false);
        onSaved();
      }
    } catch (err: unknown) {
      console.warn('[DB-Connect Services] Save error:', err);
      setErrorMessage('Une erreur imprévue est survenue.');
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={() => !saving && onClose()}>
      <div className="admin-modal-box large" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <h3 className="modal-title">
              {service ? 'Modifier la prestation' : 'Créer une nouvelle prestation'}
            </h3>
            <span className="modal-sub">
              Renseignez les caractéristiques et conditions tarifaires de l'offre
            </span>
          </div>
          <button
            type="button"
            className="btn-close-modal"
            disabled={saving}
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {errorMessage && (
          <div className="auth-alert alert-error" role="alert" style={{ margin: '1rem 1.5rem 0' }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-modal-form">
          <div className="form-row-duo">
            <div className="form-group">
              <label className="form-label" htmlFor="serv-title">
                Titre de la prestation *
              </label>
              <input
                id="serv-title"
                type="text"
                required
                className="form-input"
                placeholder="Ex : Audit de Cybersécurité & Conformité"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="serv-category">
                Catégorie associée
              </label>
              <select
                id="serv-category"
                className="form-input"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={saving}
              >
                <option value="">Aucune catégorie</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row-duo">
            <div className="form-group">
              <label className="form-label" htmlFor="serv-slug">
                Identifiant d'URL (Slug)
              </label>
              <input
                id="serv-slug"
                type="text"
                className="form-input font-mono"
                placeholder="audit-cybersecurite-conformite"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="serv-status">
                Statut de publication *
              </label>
              <select
                id="serv-status"
                className="form-input"
                value={status}
                onChange={(e) => setStatus(e.target.value as ServiceStatus)}
                disabled={saving}
              >
                <option value="draft">Brouillon (non visible)</option>
                <option value="published">Publié (visible en catalogue)</option>
                <option value="archived">Archivé (retiré du catalogue)</option>
              </select>
            </div>
          </div>

          <div className="form-row-duo">
            <div className="form-group">
              <label className="form-label" htmlFor="serv-price">
                Prix indicatif « À partir de » (Optionnel)
              </label>
              <input
                id="serv-price"
                type="number"
                min="0"
                step="500"
                className="form-input font-mono"
                placeholder="Laisser vide pour « Sur devis »"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="serv-currency">
                Devise
              </label>
              <select
                id="serv-currency"
                className="form-input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={saving}
              >
                <option value="XAF">FCFA (XAF)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="USD">Dollar US (USD)</option>
              </select>
            </div>
          </div>

          {/* Real Storage Image Uploader for Service */}
          <div className="form-group">
            <StorageImageUploader
              label="Image du service"
              bucket="services-images"
              existingImagePath={currentImagePath}
              selectedFile={selectedFile}
              onFileSelect={(file) => setSelectedFile(file)}
              onExistingImageRemoved={handleExistingImageRemoved}
              resolveImageUrl={getServiceImageUrl}
              deleteImageObject={deleteServiceCoverImage}
              fallbackIcon={<ServicesIcon size={26} />}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="serv-short-desc">
              Description courte (affichée sur la carte)
            </label>
            <textarea
              id="serv-short-desc"
              rows={2}
              className="form-input"
              placeholder="Synthèse percutante en 1 ou 2 phrases..."
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="serv-desc">
              Description complète de la prestation
            </label>
            <textarea
              id="serv-desc"
              rows={5}
              className="form-input"
              placeholder="Détails de l'offre, méthodologie, livrables attendus..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="admin-modal-actions">
            <button
              type="button"
              className="btn-modal-cancel"
              disabled={saving}
              onClick={onClose}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-admin-cta primary"
              disabled={saving}
            >
              {saving ? (
                <span className="btn-loading-content">
                  <span className="spinner"></span> Sauvegarde en cours...
                </span>
              ) : (
                service ? 'Enregistrer les modifications' : 'Créer la prestation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
