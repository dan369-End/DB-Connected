import React, { useState } from 'react';
import { useAuth } from '@/features/auth';
import type { Opportunity } from '@/types';
import {
  submitOpportunityApplication,
  isDeadlinePassed,
} from '../opportunitiesService';
import { CloseIcon, BuildingIcon, LocationIcon } from '@/components/icons';

interface ApplicationFormModalProps {
  opportunity: Opportunity;
  onClose: () => void;
  onSuccess: () => void;
}

export const ApplicationFormModal: React.FC<ApplicationFormModalProps> = ({
  opportunity,
  onClose,
  onSuccess,
}) => {
  const { user, profile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [coverMessage, setCoverMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const deadlinePassed = isDeadlinePassed(opportunity.deadline);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setErrorMessage('Vous devez être connecté pour postuler.');
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage('Veuillez renseigner votre nom complet.');
      return;
    }

    if (deadlinePassed) {
      setErrorMessage('Les candidatures pour cette opportunité sont désormais clôturées.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await submitOpportunityApplication({
        opportunityId: opportunity.id,
        userId: user.id,
        fullName: fullName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        coverMessage: coverMessage.trim() || null,
      });

      if (!res.success) {
        if (res.alreadyApplied) {
          setErrorMessage('Vous avez déjà postulé à cette opportunité.');
        } else {
          setErrorMessage(res.error || "Impossible d'enregistrer votre candidature.");
        }
        setIsSubmitting(false);
        return;
      }

      onSuccess();
    } catch (err: unknown) {
      console.warn('[DB-Connect Application] Error submitting application:', err);
      setErrorMessage('Une erreur imprévue est survenue.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container application-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Candidater à l'opportunité</h2>
            <p className="modal-subtitle">
              Remplissez le formulaire ci-dessous pour transmettre votre profil à l'organisation.
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Fermer"
            disabled={isSubmitting}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Opportunity Summary Card inside modal */}
        <div className="application-modal-target">
          <div className="modal-target-title">{opportunity.title}</div>
          <div className="modal-target-meta">
            <span className="target-meta-item">
              <BuildingIcon size={14} />
              <span>{opportunity.organization_name}</span>
            </span>
            {opportunity.location && (
              <span className="target-meta-item">
                <LocationIcon size={14} />
                <span>{opportunity.location}</span>
              </span>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="auth-alert alert-error" role="alert">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-course-form">
          <div className="form-group">
            <label className="form-label" htmlFor="app-fullname">
              Nom complet *
            </label>
            <input
              id="app-fullname"
              type="text"
              required
              className="form-input"
              placeholder="Ex : Sarah Makaya"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-grid-2col">
            <div className="form-group">
              <label className="form-label" htmlFor="app-email">
                Adresse email
              </label>
              <input
                id="app-email"
                type="email"
                className="form-input"
                placeholder="contact@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="app-phone">
                Numéro de téléphone
              </label>
              <input
                id="app-phone"
                type="tel"
                className="form-input"
                placeholder="Ex : +242 06 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="app-message">
              Message de motivation
            </label>
            <textarea
              id="app-message"
              rows={4}
              className="form-input"
              placeholder="Présentez brièvement vos compétences, expériences pertinentes ou disponibilités..."
              value={coverMessage}
              onChange={(e) => setCoverMessage(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="modal-footer-actions">
            <button
              type="button"
              className="btn-admin-cta"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-admin-cta primary"
              disabled={isSubmitting || deadlinePassed}
            >
              {isSubmitting ? (
                <span className="btn-loading-content">
                  <span className="spinner" /> Envoi en cours...
                </span>
              ) : (
                'Envoyer ma candidature'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
