import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { useNavigation } from '@/hooks/useNavigation';
import { ProgressBar } from './ProgressBar';
import { getAcademyCourseImageUrl } from '../utils/academyStorage';
import {
  AcademyIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  PhoneIcon,
  CloseIcon,
} from '@/components/icons';
import type { AcademyCourse, AcademyModule, AcademyLesson, AcademyEnrollment, AcademyPaymentRequest } from '@/types';
import { ContactRequestModal } from '@/features/requests';
import { createAcademyPaymentRequest } from '../academyPaymentService';

interface CourseDetailProps {
  courseId: string;
}

export const CourseDetail: React.FC<CourseDetailProps> = ({ courseId }) => {
  const { user, profile } = useAuth();
  const { navigate, setReturnTo } = useNavigation();

  const [course, setCourse] = useState<AcademyCourse | null>(null);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [modules, setModules] = useState<AcademyModule[]>([]);
  const [currentEnrollment, setCurrentEnrollment] = useState<AcademyEnrollment | null>(null);
  const [pendingPaymentRequest, setPendingPaymentRequest] = useState<AcademyPaymentRequest | null>(null);
  const [totalLessons, setTotalLessons] = useState<number>(0);
  const [completedLessonsCount, setCompletedLessonsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Enrollment Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [isSameWhatsapp, setIsSameWhatsapp] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<string>('airtel_money');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [paymentCreatedSuccess, setPaymentCreatedSuccess] = useState<boolean>(false);
  const [submittingEnroll, setSubmittingEnroll] = useState<boolean>(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const fetchCourseData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('academy_courses')
        .select(`
          *,
          academy_categories ( id, name )
        `)
        .eq('id', courseId)
        .maybeSingle();

      if (courseError) {
        throw courseError;
      }

      if (!courseData) {
        setErrorMessage("Cette formation n'a pas été trouvée ou n'est plus accessible.");
        setLoading(false);
        return;
      }

      setCourse(courseData as AcademyCourse);

      // Resolve cover signed URL if present
      if (courseData.thumbnail_url) {
        getAcademyCourseImageUrl(courseData.thumbnail_url).then((url) => {
          setResolvedImageUrl(url);
        });
      } else {
        setResolvedImageUrl(null);
      }

      // 2. Fetch modules for this course
      const { data: modulesData, error: modulesError } = await supabase
        .from('academy_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('position', { ascending: true });

      if (modulesError) {
        console.warn('[DB-Connect Academy] Modules fetch error:', modulesError.message);
      }

      const rawModules = (modulesData as AcademyModule[]) || [];

      // 3. For each module, fetch lessons
      const modulesWithLessons = await Promise.all(
        rawModules.map(async (mod) => {
          const { data: lessonsData } = await supabase!
            .from('academy_lessons')
            .select('*')
            .eq('module_id', mod.id)
            .order('position', { ascending: true });

          return {
            ...mod,
            lessons: (lessonsData as AcademyLesson[]) || [],
          };
        })
      );

      setModules(modulesWithLessons);

      // Count total lessons
      const total = modulesWithLessons.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
      setTotalLessons(total);

      // 4. Check user enrollment & lesson progress if logged in
      if (user) {
        const { data: enrollData } = await supabase
          .from('academy_enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .maybeSingle();

        if (enrollData) {
          setCurrentEnrollment(enrollData as AcademyEnrollment);
          // Set phone default if available
          if (enrollData.participant_phone) {
            setPhone(enrollData.participant_phone);
          }
          if (enrollData.participant_whatsapp) {
            setWhatsapp(enrollData.participant_whatsapp);
            setIsSameWhatsapp(enrollData.participant_whatsapp === enrollData.participant_phone);
          }
        } else {
          setCurrentEnrollment(null);
        }

        // Check for existing payment request
        const { data: payReqData } = await supabase
          .from('academy_payment_requests')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .order('created_at', { ascending: false })
          .limit(1);

        const latestReq = (payReqData as AcademyPaymentRequest[])?.[0] || null;
        if (latestReq && latestReq.status === 'pending') {
          setPendingPaymentRequest(latestReq);
        } else {
          setPendingPaymentRequest(null);
        }

        // Get completed lessons count
        if (enrollData) {
          const allLessonIds = modulesWithLessons.flatMap((m) => (m.lessons || []).map((l) => l.id));
          if (allLessonIds.length > 0) {
            const { data: progressData } = await supabase
              .from('academy_lesson_progress')
              .select('id')
              .eq('user_id', user.id)
              .eq('completed', true)
              .in('lesson_id', allLessonIds);

            setCompletedLessonsCount(progressData?.length || 0);
          }
        }
      }
    } catch (err) {
      console.warn('[DB-Connect Academy] Course detail fetch error:', err);
      setErrorMessage("Impossible de charger les informations de la formation.");
    } finally {
      setLoading(false);
    }
  }, [courseId, user]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  // Pre-fill phone from user profile if empty
  useEffect(() => {
    if (!phone && profile?.phone) {
      setPhone(profile.phone);
    }
  }, [profile, phone]);

  const handleStartLearning = () => {
    navigate('academy_player', { courseId });
  };

  const handleOpenEnrollModal = () => {
    if (!user) {
      setReturnTo(`/academy`);
      navigate('login');
      return;
    }
    setEnrollError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (!submittingEnroll) {
      setIsModalOpen(false);
      setEnrollError(null);
    }
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('login');
      return;
    }

    if (!supabase || !course) return;

    if (!phone.trim()) {
      setEnrollError('Veuillez renseigner votre numéro de téléphone.');
      return;
    }

    const finalWhatsapp = isSameWhatsapp ? phone.trim() : whatsapp.trim() || null;
    const enrollStatus = course.is_paid ? 'pending_payment' : 'enrolled';

    setSubmittingEnroll(true);
    setEnrollError(null);

    try {
      const { data, error } = await supabase
        .from('academy_enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          participant_phone: phone.trim(),
          participant_whatsapp: finalWhatsapp,
          status: enrollStatus,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505' || error.message.includes('unique') || error.message.includes('already exists')) {
          // Already enrolled, refresh data
          await fetchCourseData();
          setIsModalOpen(false);
        } else {
          setEnrollError(error.message || "Une erreur est survenue lors de l'enregistrement de votre inscription.");
        }
      } else {
        setCurrentEnrollment(data as AcademyEnrollment);
        setIsModalOpen(false);
      }
    } catch (err) {
      console.warn('[DB-Connect Academy] Enrollment submit error:', err);
      setEnrollError("Impossible de valider votre inscription.");
    } finally {
      setSubmittingEnroll(false);
    }
  };

  if (loading) {
    return (
      <div className="academy-loading-box">
        <div className="spinner large" />
        <p>Chargement de la formation...</p>
      </div>
    );
  }

  if (errorMessage || !course) {
    return (
      <div className="academy-error-box">
        <p>{errorMessage || "Formation introuvable."}</p>
        <button
          type="button"
          className="btn-back-catalog"
          onClick={() => navigate('academy')}
        >
          Retour au catalogue de l'Académie
        </button>
      </div>
    );
  }

  const categoryName = course.academy_categories?.name || course.category?.name;
  const isEnrolled = Boolean(currentEnrollment);
  const isEnrolledConfirmed = currentEnrollment?.status === 'enrolled';
  const isPendingPayment = currentEnrollment?.status === 'pending_payment';
  const isExternalDelivery = course.delivery_mode === 'external';

  // Sanitized external link
  let safeExternalUrl: string | null = null;
  if (course.external_link && course.external_link.trim()) {
    const trimmed = course.external_link.trim();
    safeExternalUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
  }

  return (
    <div className="course-detail-view">
      {/* Back button */}
      <button
        type="button"
        className="btn-back-breadcrumb"
        onClick={() => navigate('academy')}
      >
        &larr; Retour à l'Académie
      </button>

      {/* Hero section of course: Complete presentation before any action */}
      <div className="course-detail-hero">
        <div className="hero-content">
          {categoryName && (
            <span className="course-hero-category">{categoryName}</span>
          )}

          <h1 className="course-hero-title">{course.title}</h1>

          {course.short_description && (
            <p className="course-hero-desc">{course.short_description}</p>
          )}

          {/* Key Attributes Badges Strip */}
          <div className="course-detail-badges-strip">
            {/* 1. Price Badge */}
            <span className={`detail-pill-badge ${course.is_paid ? 'paid' : 'free'}`}>
              {course.is_paid
                ? `${Number(course.price || 0).toLocaleString('fr-FR')} FCFA`
                : 'Gratuit'}
            </span>

            {/* 2. Delivery Mode Badge */}
            <span className="detail-pill-badge mode">
              {isExternalDelivery
                ? `Plateforme externe (${course.external_platform || 'En ligne'})`
                : 'Directement sur DB-Connect'}
            </span>

            {/* 3. Level */}
            <span className="detail-pill-badge level">
              {course.level === 'beginner'
                ? 'Niveau Débutant'
                : course.level === 'intermediate'
                ? 'Niveau Intermédiaire'
                : 'Niveau Avancé'}
            </span>

            {/* 4. Duration */}
            <span className="detail-pill-badge duration">
              {course.duration_minutes > 0 ? `${course.duration_minutes} min` : 'À son rythme'}
            </span>
          </div>

          {/* Action button & Status row */}
          <div className="course-hero-actions" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
            {!isEnrolled ? (
              <button
                type="button"
                className="btn-primary-action"
                onClick={handleOpenEnrollModal}
              >
                <span>
                  {course.is_paid
                    ? 'Continuer vers le paiement'
                    : "S'inscrire gratuitement"}
                </span>
                <ArrowRightIcon size={16} />
              </button>
            ) : isEnrolledConfirmed ? (
              <div className="enrolled-status-group">
                <span className="enrolled-tag confirmed">
                  <CheckCircleIcon size={16} className="text-emerald-400" />
                  <span>Vous êtes inscrit à cette formation</span>
                </span>
                {!isExternalDelivery && (
                  <button
                    type="button"
                    className="btn-primary-action"
                    onClick={handleStartLearning}
                  >
                    <span>Accéder à la formation</span>
                    <ArrowRightIcon size={16} />
                  </button>
                )}
              </div>
            ) : isPendingPayment ? (
              <div className="enrolled-status-group">
                <span className="enrolled-tag pending">
                  <span className="dot amber" />
                  <span>Inscription en attente de paiement ({Number(course.price || 0).toLocaleString('fr-FR')} FCFA)</span>
                </span>
              </div>
            ) : null}

            <button
              type="button"
              className="btn-admin-cta secondary"
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
              onClick={() => setIsContactModalOpen(true)}
            >
              Contacter l'équipe
            </button>
          </div>

          {/* If enrolled and DB-Connect mode, show progress bar */}
          {isEnrolledConfirmed && !isExternalDelivery && totalLessons > 0 && (
            <div className="course-hero-progress">
              <ProgressBar completed={completedLessonsCount} total={totalLessons} />
            </div>
          )}
        </div>

        {resolvedImageUrl ? (
          <div className="hero-thumb-wrapper">
            <img
              src={resolvedImageUrl}
              alt={course.title}
              className="course-hero-img"
            />
          </div>
        ) : (
          <div className="hero-thumb-wrapper fallback">
            <AcademyIcon size={64} className="text-slate-600" />
          </div>
        )}
      </div>

      {/* Post-Enrollment Confirmation Block */}
      {isEnrolledConfirmed && (
        <div className="post-enroll-banner confirmed">
          <div className="post-enroll-header">
            <CheckCircleIcon size={24} className="text-emerald-400" />
            <div>
              <h3 className="post-enroll-title">Inscription confirmée</h3>
              <p className="post-enroll-subtitle">
                {isExternalDelivery
                  ? `Cette formation se déroule via ${course.external_platform || 'une plateforme externe'}. Retrouvez vos informations d'accès ci-dessous.`
                  : "Votre formation est prête. Vous pouvez démarrer les cours dès maintenant sur DB-Connect."}
              </p>
            </div>
          </div>

          {isExternalDelivery && (
            <div className="post-enroll-external-details">
              {safeExternalUrl && (
                <div className="external-action-row">
                  <a
                    href={safeExternalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-external-access"
                  >
                    <span>Rejoindre la formation sur {course.external_platform || 'la plateforme'}</span>
                    <ExternalLinkIcon size={16} />
                  </a>
                </div>
              )}

              {course.organizer_contact_phone && (
                <div className="external-info-row">
                  <span className="info-label">Contact / WhatsApp formateur :</span>
                  <a
                    href={`tel:${course.organizer_contact_phone}`}
                    className="info-value font-mono text-cyan-400 hover:underline"
                  >
                    <PhoneIcon size={14} className="inline mr-1" />
                    {course.organizer_contact_phone}
                  </a>
                </div>
              )}

              {course.access_instructions && (
                <div className="external-instructions-card">
                  <h4 className="instructions-card-title">Instructions d'accès :</h4>
                  <p className="instructions-card-text">{course.access_instructions}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Post-Enrollment Pending Payment Block */}
      {isPendingPayment && (
        <div className="post-enroll-banner pending">
          <div className="post-enroll-header">
            <span className="status-dot-amber" />
            <div>
              <h3 className="post-enroll-title">Inscription en attente de paiement</h3>
              <p className="post-enroll-subtitle">
                Votre demande d'inscription à la formation « {course.title} » a bien été enregistrée.
              </p>
            </div>
          </div>

          <div className="pending-payment-body">
            <div className="pending-payment-row">
              <span className="text-muted">Montant à régler :</span>
              <span className="font-bold text-slate-100 text-lg">
                {Number(course.price || 0).toLocaleString('fr-FR')} FCFA
              </span>
            </div>

            {currentEnrollment?.participant_phone && (
              <div className="pending-payment-row">
                <span className="text-muted">Numéro de contact renseigné :</span>
                <span className="font-mono text-slate-200">
                  {currentEnrollment.participant_phone}
                </span>
              </div>
            )}

            <div className="pending-payment-notice">
              <p>
                Le paiement en ligne de l'Académie sera traité dans l'étape suivante. Notre équipe administrative prendra contact avec vous au numéro renseigné afin de valider votre modalité de règlement (Mobile Money ou virement) et activer votre accès.
              </p>
            </div>

            {course.organizer_contact_phone && (
              <div className="pending-contact-row">
                <span className="text-sm text-slate-400">Besoin d'aide ou question directe ?</span>
                <a
                  href={`tel:${course.organizer_contact_phone}`}
                  className="font-mono text-cyan-400 hover:underline text-sm ml-2"
                >
                  <PhoneIcon size={13} className="inline mr-1" />
                  {course.organizer_contact_phone}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main detail content & Curriculum */}
      <div className="course-detail-main">
        {/* Full description */}
        {course.description && (
          <div className="course-section-block">
            <h2 className="section-block-title">Présentation du programme</h2>
            <div className="course-description-content">
              {course.description.split('\n').map((paragraph, index) =>
                paragraph.trim() ? <p key={index}>{paragraph}</p> : null
              )}
            </div>
          </div>
        )}

        {/* Modalités & déroulement de la formation (si externe) */}
        {isExternalDelivery && (course.external_platform || course.organizer_contact_phone || course.access_instructions) && (
          <div className="course-section-block">
            <h2 className="section-block-title">Modalités de déroulement</h2>
            <div className="external-details-grid">
              {course.external_platform && (
                <div className="external-detail-card">
                  <span className="detail-card-label">Plateforme de formation</span>
                  <span className="detail-card-value font-semibold text-slate-100">
                    {course.external_platform}
                  </span>
                </div>
              )}

              {course.organizer_contact_phone && (
                <div className="external-detail-card">
                  <span className="detail-card-label">Contact formateur</span>
                  <span className="detail-card-value font-mono text-cyan-400">
                    {course.organizer_contact_phone}
                  </span>
                </div>
              )}
            </div>

            {course.access_instructions && (
              <div className="external-instructions-preview mt-4">
                <span className="detail-card-label block mb-1">Informations d'accès</span>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {course.access_instructions}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Modules and Lessons Syllabus */}
        <div className="course-section-block">
          <div className="syllabus-header-row">
            <div>
              <h2 className="section-block-title">Programme pédagogique</h2>
              <p className="section-block-sub">
                {modules.length} modules &bull; {totalLessons} leçons
              </p>
            </div>
          </div>

          {modules.length === 0 ? (
            <div className="empty-syllabus-box">
              <AcademyIcon size={32} />
              <p>Le cursus détaillé sera mis à disposition prochainement.</p>
            </div>
          ) : (
            <div className="syllabus-modules-list">
              {modules.map((mod, modIdx) => (
                <div key={mod.id} className="syllabus-module-card">
                  <div className="module-card-header">
                    <span className="module-idx-chip">Module {modIdx + 1}</span>
                    <h3 className="module-title-text">{mod.title}</h3>
                    {mod.description && (
                      <p className="module-desc-text">{mod.description}</p>
                    )}
                  </div>

                  {mod.lessons && mod.lessons.length > 0 && (
                    <ul className="module-lessons-list">
                      {mod.lessons.map((lesson, lessIdx) => (
                        <li key={lesson.id} className="module-lesson-item">
                          <span className="lesson-number font-mono">{lessIdx + 1}.</span>
                          <span className="lesson-name">{lesson.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal d'inscription (Gratuite ou Étape Préparatoire Payante) */}
      {isModalOpen && (
        <div className="academy-modal-backdrop" onClick={handleCloseModal}>
          <div
            className="academy-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="academy-modal-header">
              <div>
                <h3 className="academy-modal-title">
                  {course.is_paid
                    ? "Inscription — Formation payante"
                    : "Inscription à la formation"}
                </h3>
                <p className="academy-modal-subtitle">
                  {course.is_paid
                    ? `Tarif : ${Number(course.price || 0).toLocaleString('fr-FR')} FCFA`
                    : "Formation gratuite • Accès sans frais"}
                </p>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={handleCloseModal}
                disabled={submittingEnroll}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {enrollError && (
              <div className="auth-alert alert-error" role="alert">
                {enrollError}
              </div>
            )}

            <form onSubmit={handleEnrollSubmit} className="academy-enroll-form">
              <div className="form-group">
                <label className="form-label" htmlFor="enroll-phone">
                  Numéro de téléphone *
                </label>
                <input
                  id="enroll-phone"
                  type="tel"
                  required
                  className="form-input"
                  placeholder="Ex : +242 06 123 45 67 ou 05 987 65 43"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={submittingEnroll}
                />
                <span className="form-hint">
                  Nécessaire pour le suivi pédagogique et la confirmation.
                </span>
              </div>

              <div className="form-group">
                <label className="whatsapp-checkbox-row">
                  <input
                    type="checkbox"
                    checked={isSameWhatsapp}
                    onChange={(e) => setIsSameWhatsapp(e.target.checked)}
                    disabled={submittingEnroll}
                  />
                  <span>Mon numéro WhatsApp est identique à mon numéro de téléphone</span>
                </label>
              </div>

              {!isSameWhatsapp && (
                <div className="form-group">
                  <label className="form-label" htmlFor="enroll-whatsapp">
                    Numéro WhatsApp
                  </label>
                  <input
                    id="enroll-whatsapp"
                    type="tel"
                    className="form-input"
                    placeholder="Ex : +242 06 999 88 77"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    disabled={submittingEnroll}
                  />
                  <span className="form-hint">
                    Utilisé pour les communications de groupe et liens de cours.
                  </span>
                </div>
              )}

              {course.is_paid && (
                <div className="paid-enrollment-notice">
                  <p className="notice-title">Étape préparatoire de règlement :</p>
                  <p className="notice-body">
                    Cette étape enregistre votre inscription avec le statut « En attente de paiement ». Aucun débit immédiat n'est effectué. Les modalités de paiement vous seront transmises pour finaliser votre accès.
                  </p>
                </div>
              )}

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={handleCloseModal}
                  disabled={submittingEnroll}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={submittingEnroll}
                >
                  {submittingEnroll ? (
                    <span className="btn-loading-content">
                      <span className="spinner"></span> Validation en cours...
                    </span>
                  ) : course.is_paid ? (
                    "Valider mon inscription"
                  ) : (
                    "Confirmer mon inscription gratuite"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Team Modal */}
      <ContactRequestModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        requestType="contact"
        sourceType="academy"
        course={course}
      />
    </div>
  );
};
