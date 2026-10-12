import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { StorageImageUploader } from '@/components/StorageImageUploader';
import {
  getAcademyCourseImageUrl,
  uploadCourseCoverImage,
  deleteCourseCoverImage,
} from '../utils/academyStorage';
import { AcademyIcon } from '@/components/icons';
import type { AcademyCourse, AcademyCategory, CourseStatus, AcademyDeliveryMode } from '@/types';

interface CourseFormProps {
  course?: AcademyCourse | null;
  categories: AcademyCategory[];
  onSaveSuccess: (savedCourse: AcademyCourse) => void;
  onCancel: () => void;
}

const parseCategoryId = (val: unknown): number | null => {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
};

export const CourseForm: React.FC<CourseFormProps> = ({
  course,
  categories,
  onSaveSuccess,
  onCancel,
}) => {
  const { user } = useAuth();

  const [title, setTitle] = useState(course?.title || '');
  const [slug, setSlug] = useState(course?.slug || '');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(Boolean(course));
  const [categoryId, setCategoryId] = useState<number | null>(() => parseCategoryId(course?.category_id));
  const [shortDescription, setShortDescription] = useState(course?.short_description || '');
  const [description, setDescription] = useState(course?.description || '');
  const [durationMinutes, setDurationMinutes] = useState(course?.duration_minutes || 0);
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(
    course?.level || 'beginner'
  );
  const [status, setStatus] = useState<CourseStatus>(course?.status || 'draft');

  // Pricing & Delivery state
  const [isPaid, setIsPaid] = useState<boolean>(course?.is_paid ?? false);
  const [price, setPrice] = useState<string>(
    course?.price != null ? String(course.price) : ''
  );
  const [deliveryMode, setDeliveryMode] = useState<AcademyDeliveryMode>(
    course?.delivery_mode || 'external'
  );
  const [externalPlatform, setExternalPlatform] = useState<string>(
    course?.external_platform || 'WhatsApp'
  );
  const [externalLink, setExternalLink] = useState<string>(
    course?.external_link || ''
  );
  const [organizerContactPhone, setOrganizerContactPhone] = useState<string>(
    course?.organizer_contact_phone || ''
  );
  const [accessInstructions, setAccessInstructions] = useState<string>(
    course?.access_instructions || ''
  );

  // Staged image file from computer
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Stored thumbnail path from DB
  const [currentThumbnailPath, setCurrentThumbnailPath] = useState<string | null>(
    course?.thumbnail_url || null
  );

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if course prop changes (e.g. switching between courses to edit)
  useEffect(() => {
    if (course) {
      setTitle(course.title || '');
      setSlug(course.slug || '');
      setIsSlugManuallyEdited(true);
      setCategoryId(parseCategoryId(course.category_id));
      setShortDescription(course.short_description || '');
      setDescription(course.description || '');
      setDurationMinutes(course.duration_minutes || 0);
      setLevel(course.level || 'beginner');
      setStatus((course.status as CourseStatus) || 'draft');
      setIsPaid(course.is_paid ?? false);
      setPrice(course.price != null ? String(course.price) : '');
      setDeliveryMode(course.delivery_mode || 'external');
      setExternalPlatform(course.external_platform || 'WhatsApp');
      setExternalLink(course.external_link || '');
      setOrganizerContactPhone(course.organizer_contact_phone || '');
      setAccessInstructions(course.access_instructions || '');
      setCurrentThumbnailPath(course.thumbnail_url || null);
      setSelectedFile(null);
    }
  }, [course]);

  useEffect(() => {
    if (!isSlugManuallyEdited && title.trim()) {
      const generated = title
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  }, [title, isSlugManuallyEdited]);

  const handleExistingImageRemoved = async () => {
    if (course?.id && supabase) {
      const { error } = await supabase
        .from('academy_courses')
        .update({
          thumbnail_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', course.id);

      if (error) {
        console.error('[DB-Connect Academy] Error removing image from course:', error);
      }
    }
    setCurrentThumbnailPath(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMessage('Le titre de la formation est obligatoire.');
      return;
    }

    if (!user) {
      setErrorMessage('Session utilisateur expirée. Veuillez vous reconnecter.');
      return;
    }

    if (!supabase) {
      setErrorMessage('Client de base de données indisponible.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const finalSlug = slug.trim() || 'formation-' + Date.now();
    const finalStatus: CourseStatus = status || 'draft';
    const safeCategoryId: number | null =
      typeof categoryId === 'number' && Number.isFinite(categoryId)
        ? categoryId
        : null;
    const finalShortDesc = shortDescription.trim() || null;
    const finalDesc = description.trim() || null;
    const finalDuration = Number.isFinite(durationMinutes) && durationMinutes >= 0 ? durationMinutes : 0;
    const finalLevel = level || 'beginner';

    // Pricing validation
    let finalPrice: number | null = null;
    if (isPaid) {
      const parsedPrice = parseFloat(price);
      if (price.trim() === '' || isNaN(parsedPrice) || parsedPrice < 0) {
        setErrorMessage('Veuillez renseigner un prix valide (supérieur ou égal à 0 FCFA).');
        setSaving(false);
        return;
      }
      finalPrice = parsedPrice;
    }

    // External link reasonable validation
    const trimmedLink = externalLink.trim();
    if (deliveryMode === 'external' && trimmedLink) {
      try {
        const urlToTest = trimmedLink.includes('://') ? trimmedLink : `https://${trimmedLink}`;
        new URL(urlToTest);
      } catch {
        setErrorMessage("Veuillez renseigner un lien d'accès valide (ex : https://...).");
        setSaving(false);
        return;
      }
    }

    const finalExternalPlatform = deliveryMode === 'external' ? (externalPlatform.trim() || null) : null;
    const finalExternalLink = deliveryMode === 'external' ? (trimmedLink || null) : null;
    const finalContactPhone = deliveryMode === 'external' ? (organizerContactPhone.trim() || null) : null;
    const finalAccessInstructions = deliveryMode === 'external' ? (accessInstructions.trim() || null) : null;

    try {
      if (course) {
        // ==========================================
        // UPDATE EXISTING COURSE
        // ==========================================
        let newStoragePath: string | null = currentThumbnailPath;
        let uploadedNewImagePath: string | null = null;
        const oldStoragePath = course.thumbnail_url;

        // 1. If a new file was chosen, upload to private Storage first
        if (selectedFile) {
          const uploadRes = await uploadCourseCoverImage(course.id, selectedFile);
          if (!uploadRes.success || !uploadRes.path) {
            console.error('[DB-Connect Academy] Cover upload failed:', uploadRes.error);
            setErrorMessage(uploadRes.error || "Échec de l'importation de l'image de couverture.");
            setSaving(false);
            return;
          }
          newStoragePath = uploadRes.path;
          uploadedNewImagePath = uploadRes.path;
        }

        // 2. Exact payload containing columns in public.academy_courses
        const updatePayload: Record<string, unknown> = {
          title: title.trim(),
          slug: finalSlug,
          category_id: safeCategoryId,
          short_description: finalShortDesc,
          description: finalDesc,
          thumbnail_url: newStoragePath,
          duration_minutes: finalDuration,
          level: finalLevel,
          status: finalStatus,
          is_paid: isPaid,
          price: finalPrice,
          currency: 'XAF',
          delivery_mode: deliveryMode,
          external_platform: finalExternalPlatform,
          external_link: finalExternalLink,
          organizer_contact_phone: finalContactPhone,
          access_instructions: finalAccessInstructions,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('academy_courses')
          .update(updatePayload)
          .eq('id', course.id)
          .select()
          .single();

        if (error) {
          console.error('[DB-Connect Academy] Course save error:', error);

          // Clean up newly uploaded orphan image if DB update failed
          if (uploadedNewImagePath) {
            deleteCourseCoverImage(uploadedNewImagePath).catch(() => {});
          }

          if (error.code === '23505') {
            setErrorMessage('Une formation avec ce slug existe déjà.');
          } else {
            setErrorMessage("Impossible d'enregistrer les modifications.");
          }
          setSaving(false);
          return;
        }

        // 3. Delete old file only after DB update was completely successful
        if (selectedFile && oldStoragePath && oldStoragePath !== newStoragePath) {
          deleteCourseCoverImage(oldStoragePath).catch((err) => {
            console.warn('[DB-Connect Academy] Could not delete previous storage image:', err);
          });
        }

        onSaveSuccess(data as AcademyCourse);
      } else {
        // ==========================================
        // CREATE NEW COURSE
        // ==========================================
        // 1. Insert course first to retrieve its generated UUID
        const insertPayload: Record<string, unknown> = {
          title: title.trim(),
          slug: finalSlug,
          category_id: safeCategoryId,
          short_description: finalShortDesc,
          description: finalDesc,
          thumbnail_url: null,
          duration_minutes: finalDuration,
          level: finalLevel,
          status: finalStatus,
          is_paid: isPaid,
          price: finalPrice,
          currency: 'XAF',
          delivery_mode: deliveryMode,
          external_platform: finalExternalPlatform,
          external_link: finalExternalLink,
          organizer_contact_phone: finalContactPhone,
          access_instructions: finalAccessInstructions,
          created_by: user.id,
        };

        const { data, error } = await supabase
          .from('academy_courses')
          .insert(insertPayload)
          .select()
          .single();

        if (error) {
          console.error('[DB-Connect Academy] Course creation error:', error);
          if (error.code === '23505') {
            setErrorMessage('Une formation avec ce slug existe déjà.');
          } else {
            setErrorMessage('Impossible de créer la formation.');
          }
          setSaving(false);
          return;
        }

        const createdCourse = data as AcademyCourse;

        // 2. Upload cover image if selected
        if (selectedFile) {
          const uploadRes = await uploadCourseCoverImage(createdCourse.id, selectedFile);
          if (uploadRes.success && uploadRes.path) {
            const { data: updatedData, error: updateError } = await supabase
              .from('academy_courses')
              .update({
                thumbnail_url: uploadRes.path,
                updated_at: new Date().toISOString(),
              })
              .eq('id', createdCourse.id)
              .select()
              .single();

            if (updateError) {
              console.error('[DB-Connect Academy] Error updating thumbnail_url after creation:', updateError);
            }

            onSaveSuccess(updatedData ? (updatedData as AcademyCourse) : createdCourse);
            return;
          } else {
            console.warn('[DB-Connect Academy] Cover upload skipped/failed on creation:', uploadRes.error);
          }
        }

        onSaveSuccess(createdCourse);
      }
    } catch (err) {
      console.error('[DB-Connect Academy] Course save error:', err);
      setErrorMessage('Une erreur imprévue est survenue.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="course-form-card">
      <div className="form-card-header">
        <div>
          <h3 className="form-card-title">
            {course ? 'Éditer la formation' : 'Créer une nouvelle formation'}
          </h3>
          <p className="form-card-sub">
            {course
              ? `Modification de « ${course.title} »`
              : 'Renseignez les métadonnées et importez une image de couverture.'}
          </p>
        </div>
        <div className="header-status-indicator">
          <span className="status-indicator-label">Statut actuel :</span>
          <span className={`status-badge status-${course?.status || 'draft'}`}>
            {course?.status === 'published'
              ? 'Publié'
              : course?.status === 'archived'
              ? 'Archivé'
              : 'Brouillon'}
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="auth-alert alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-course-form">
        <div className="form-grid-2col">
          <div className="form-group">
            <label className="form-label" htmlFor="course-title">
              Titre de la formation *
            </label>
            <input
              id="course-title"
              type="text"
              required
              className="form-input"
              placeholder="Ex : Introduction à la Cybersécurité"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="course-slug">
              Slug d'URL (généré automatiquement)
            </label>
            <input
              id="course-slug"
              type="text"
              required
              className="form-input font-mono"
              placeholder="introduction-a-la-cybersecurite"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setIsSlugManuallyEdited(true);
              }}
              disabled={saving}
            />
          </div>
        </div>

        <div className="form-grid-2col">
          <div className="form-group">
            <label className="form-label" htmlFor="course-cat">
              Catégorie de rattachement
            </label>
            <select
              id="course-cat"
              className="form-input"
              value={categoryId !== null ? String(categoryId) : ''}
              onChange={(e) => {
                const val = e.target.value;
                if (!val || val.trim() === '') {
                  setCategoryId(null);
                } else {
                  const num = Number(val);
                  setCategoryId(Number.isFinite(num) ? num : null);
                }
              }}
              disabled={saving}
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
            <label className="form-label" htmlFor="course-level">
              Niveau pédagogique
            </label>
            <select
              id="course-level"
              className="form-input"
              value={level}
              onChange={(e) => setLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
              disabled={saving}
            >
              <option value="beginner">Débutant</option>
              <option value="intermediate">Intermédiaire</option>
              <option value="advanced">Avancé</option>
            </select>
          </div>
        </div>

        {/* Storage Image Uploader for Course Cover */}
        <div className="form-group">
          <StorageImageUploader
            label="Image de couverture"
            bucket="academy-images"
            existingImagePath={currentThumbnailPath}
            selectedFile={selectedFile}
            onFileSelect={(file) => setSelectedFile(file)}
            onExistingImageRemoved={handleExistingImageRemoved}
            resolveImageUrl={getAcademyCourseImageUrl}
            deleteImageObject={deleteCourseCoverImage}
            fallbackIcon={<AcademyIcon size={26} />}
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="course-short-desc">
            Description courte (affichée sur les cartes)
          </label>
          <input
            id="course-short-desc"
            type="text"
            className="form-input"
            placeholder="Synthèse de la formation en une ou deux phrases..."
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="course-full-desc">
            Description détaillée du programme
          </label>
          <textarea
            id="course-full-desc"
            rows={5}
            className="form-input"
            placeholder="Détails du cursus, objectifs pédagogiques, prérequis..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={saving}
          />
        </div>

        {/* Section Tarification et déroulement */}
        <div className="form-section-divider">
          <h4 className="form-section-heading">Tarification et déroulement</h4>
          <p className="form-section-sub">
            Définissez les modalités de tarification et le mode de suivi de la formation.
          </p>
        </div>

        {/* 1. Type de formation : Gratuite ou Payante */}
        <div className="form-group">
          <label className="form-label">Type de formation *</label>
          <div className="form-radio-row">
            <label className={`form-radio-card ${!isPaid ? 'active' : ''}`}>
              <input
                type="radio"
                name="isPaidChoice"
                checked={!isPaid}
                onChange={() => {
                  setIsPaid(false);
                  setPrice('');
                }}
                disabled={saving}
              />
              <div className="radio-card-content">
                <span className="radio-card-title">Gratuite</span>
                <span className="radio-card-desc">Accessible sans frais pour tous les apprenants</span>
              </div>
            </label>

            <label className={`form-radio-card ${isPaid ? 'active' : ''}`}>
              <input
                type="radio"
                name="isPaidChoice"
                checked={isPaid}
                onChange={() => setIsPaid(true)}
                disabled={saving}
              />
              <div className="radio-card-content">
                <span className="radio-card-title">Payante</span>
                <span className="radio-card-desc">Tarif fixé en FCFA avant inscription</span>
              </div>
            </label>
          </div>
        </div>

        {/* 2. Prix si payante */}
        {isPaid && (
          <div className="form-group">
            <label className="form-label" htmlFor="course-price">
              Prix (FCFA) *
            </label>
            <div className="price-input-wrapper">
              <input
                id="course-price"
                type="number"
                min="0"
                step="500"
                required={isPaid}
                className="form-input font-mono"
                placeholder="Ex : 15000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={saving}
              />
              <span className="currency-suffix">FCFA</span>
            </div>
            <span className="form-hint">Indiquez le montant en FCFA (affiché aux utilisateurs).</span>
          </div>
        )}

        {/* 3. Mode de déroulement */}
        <div className="form-group">
          <label className="form-label">Mode de déroulement *</label>
          <div className="form-radio-row">
            <label className={`form-radio-card ${deliveryMode === 'external' ? 'active' : ''}`}>
              <input
                type="radio"
                name="deliveryModeChoice"
                checked={deliveryMode === 'external'}
                onChange={() => setDeliveryMode('external')}
                disabled={saving}
              />
              <div className="radio-card-content">
                <span className="radio-card-title">Plateforme externe</span>
                <span className="radio-card-desc">WhatsApp, Google Classroom, Zoom, Meet, etc.</span>
              </div>
            </label>

            <label className={`form-radio-card ${deliveryMode === 'dbconnect' ? 'active' : ''}`}>
              <input
                type="radio"
                name="deliveryModeChoice"
                checked={deliveryMode === 'dbconnect'}
                onChange={() => setDeliveryMode('dbconnect')}
                disabled={saving}
              />
              <div className="radio-card-content">
                <span className="radio-card-title">Directement sur DB-Connect</span>
                <span className="radio-card-desc">Modules, leçons interactives et supports intégrés</span>
              </div>
            </label>
          </div>
        </div>

        {/* 4. Champs si delivery_mode === 'external' */}
        {deliveryMode === 'external' && (
          <div className="external-delivery-box">
            <div className="form-grid-2col">
              <div className="form-group">
                <label className="form-label" htmlFor="course-external-platform">
                  Plateforme de formation
                </label>
                <select
                  id="course-external-platform"
                  className="form-input"
                  value={externalPlatform}
                  onChange={(e) => setExternalPlatform(e.target.value)}
                  disabled={saving}
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Google Classroom">Google Classroom</option>
                  <option value="Google Meet">Google Meet</option>
                  <option value="Zoom">Zoom</option>
                  <option value="Telegram">Telegram</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="course-external-link">
                  Lien d'accès ou lien de formation (optionnel)
                </label>
                <input
                  id="course-external-link"
                  type="text"
                  className="form-input"
                  placeholder="https://chat.whatsapp.com/... ou https://meet.google.com/..."
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="course-organizer-phone">
                Numéro de contact / WhatsApp de l'organisateur (optionnel)
              </label>
              <input
                id="course-organizer-phone"
                type="text"
                className="form-input"
                placeholder="Ex : +242 06 123 45 67 ou 05 987 65 43"
                value={organizerContactPhone}
                onChange={(e) => setOrganizerContactPhone(e.target.value)}
                disabled={saving}
              />
              <span className="form-hint">Permet aux apprenants de contacter le formateur ou l'assistance.</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="course-access-instructions">
                Instructions d'accès (optionnel)
              </label>
              <textarea
                id="course-access-instructions"
                rows={3}
                className="form-input"
                placeholder="Ex : Après votre inscription, vous serez ajouté au groupe WhatsApp ou recevrez les détails par message."
                value={accessInstructions}
                onChange={(e) => setAccessInstructions(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>
        )}

        <div className="form-grid-2col">
          <div className="form-group">
            <label className="form-label" htmlFor="course-duration">
              Durée estimée (minutes)
            </label>
            <input
              id="course-duration"
              type="number"
              min="0"
              step="5"
              className="form-input font-mono"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="course-status">
              Statut de publication
            </label>
            <select
              id="course-status"
              className="form-input"
              value={status}
              onChange={(e) => setStatus(e.target.value as CourseStatus)}
              disabled={saving}
            >
              <option value="draft">Brouillon (non visible des apprenants)</option>
              <option value="published">Publié (accessible au catalogue)</option>
              <option value="archived">Archivé (masqué)</option>
            </select>
          </div>
        </div>

        <div className="form-actions-bar">
          <button
            type="button"
            className="btn-admin-cta"
            onClick={onCancel}
            disabled={saving}
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
                <span className="spinner"></span> Enregistrement en cours...
              </span>
            ) : (
              course ? 'Mettre à jour la formation' : 'Créer la formation'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
