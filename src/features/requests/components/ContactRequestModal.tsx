import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { useNavigation } from '@/hooks/useNavigation';
import { createContactRequest } from '../requestsService';
import { CloseIcon, CheckCircleIcon } from '@/components/icons';
import type {
  ContactRequestType,
  ContactRequestSource,
  AcademyCourse,
  ServiceRecord,
} from '@/types';

interface ContactRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestType: ContactRequestType; // 'contact' | 'quote'
  sourceType: ContactRequestSource; // 'academy' | 'service' | 'general'
  course?: AcademyCourse | null;
  service?: ServiceRecord | null;
}

export const ContactRequestModal: React.FC<ContactRequestModalProps> = ({
  isOpen,
  onClose,
  requestType,
  sourceType,
  course,
  service,
}) => {
  const { user, profile } = useAuth();
  const { navigate, setReturnTo } = useNavigation();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [email, setEmail] = useState(user?.email || profile?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [budget, setBudget] = useState('');
  const [preferredDate, setPreferredDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Synchronize prefilled values
  useEffect(() => {
    if (profile?.full_name && !fullName) {
      setFullName(profile.full_name);
    }
    if (profile?.phone && !phone) {
      setPhone(profile.phone);
    }
    if ((user?.email || profile?.email) && !email) {
      setEmail(user?.email || profile?.email || '');
    }
  }, [profile, user, fullName, phone, email]);

  // Default subject based on context
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setErrorMessage(null);
      if (course) {
        setSubject(`Question sur la formation : ${course.title}`);
      } else if (service) {
        setSubject(
          requestType === 'quote'
            ? `Demande de devis — ${service.title}`
            : `Question sur le service — ${service.title}`
        );
      } else {
        setSubject(requestType === 'quote' ? 'Demande de devis' : 'Demande de contact');
      }
    }
  }, [isOpen, course, service, requestType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!user) {
      setReturnTo(window.location.pathname);
      navigate('login');
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage('Le nom complet est obligatoire.');
      return;
    }

    if (!message.trim()) {
      setErrorMessage(
        requestType === 'quote'
          ? 'Veuillez décrire votre besoin ou projet.'
          : 'Veuillez renseigner votre message.'
      );
      return;
    }

    if (requestType === 'quote' && !phone.trim()) {
      setErrorMessage('Le numéro de téléphone est obligatoire pour une demande de devis.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const res = await createContactRequest(
      {
        requestType,
        sourceType,
        serviceId: service?.id || null,
        courseId: course?.id || null,
        fullName,
        phone: phone || null,
        email: email || null,
        subject: subject || null,
        message,
        budget: requestType === 'quote' ? budget || null : null,
        preferredDate: requestType === 'quote' ? preferredDate || null : null,
      },
      user.id
    );

    setSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "Une erreur est survenue lors de l'envoi de la demande.");
    } else {
      setIsSuccess(true);
    }
  };

  const isQuote = requestType === 'quote';

  const titleText = isQuote
    ? 'Demande de devis'
    : 'Contacter l\'équipe DB-Connect';

  const subtitleText = course
    ? `Formation : ${course.title}`
    : service
    ? `Prestation : ${service.title}`
    : 'Nous vous répondrons dans les meilleurs délais.';

  return (
    <div className="admin-modal-backdrop" onClick={() => !submitting && onClose()}>
      <div
        className="admin-modal-box contact-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="admin-modal-header">
          <div>
            <h3 className="modal-title">{titleText}</h3>
            <span className="modal-sub">{subtitleText}</span>
          </div>
          <button
            type="button"
            className="btn-close-modal"
            disabled={submitting}
            onClick={onClose}
            aria-label="Fermer"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {errorMessage && (
          <div className="auth-alert alert-error" role="alert" style={{ margin: '1rem 1.5rem 0' }}>
            {errorMessage}
          </div>
        )}

        {isSuccess ? (
          <div className="contact-modal-success-box">
            <div className="success-icon-wrap">
              <CheckCircleIcon size={36} className="text-emerald-400" />
            </div>
            <h4 className="success-title">
              {isQuote
                ? 'Votre demande de devis a bien été transmise.'
                : 'Votre demande a bien été envoyée.'}
            </h4>
            <p className="success-desc">
              {isQuote
                ? 'Notre équipe étudie votre besoin et reviendra vers vous avec une proposition adaptée.'
                : 'Notre équipe pourra revenir vers vous pour répondre à vos questions.'}
            </p>
            <div className="success-actions-row">
              <button
                type="button"
                className="btn-admin-cta primary"
                onClick={() => {
                  onClose();
                  navigate('requests');
                }}
              >
                Voir mes demandes
              </button>
              <button
                type="button"
                className="btn-admin-cta secondary"
                onClick={onClose}
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="admin-modal-form">
            <div className="form-grid-2col">
              <div className="form-group">
                <label className="form-label" htmlFor="req-fullname">
                  Nom complet *
                </label>
                <input
                  id="req-fullname"
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ex : Marie Dupont"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="req-phone">
                  Téléphone {isQuote ? '*' : '(optionnel)'}
                </label>
                <input
                  id="req-phone"
                  type="tel"
                  required={isQuote}
                  className="form-input"
                  placeholder="Ex : +242 06 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="form-grid-2col">
              <div className="form-group">
                <label className="form-label" htmlFor="req-email">
                  Adresse email
                </label>
                <input
                  id="req-email"
                  type="email"
                  className="form-input"
                  placeholder="nom@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="req-subject">
                  Sujet
                </label>
                <input
                  id="req-subject"
                  type="text"
                  className="form-input"
                  placeholder="Objet de la demande..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Special fields for quote requests */}
            {isQuote && (
              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label" htmlFor="req-budget">
                    Budget indicatif (optionnel)
                  </label>
                  <input
                    id="req-budget"
                    type="text"
                    className="form-input font-mono"
                    placeholder="Ex : 50 000 FCFA ou À discuter"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    disabled={submitting}
                  />
                  <span className="form-hint">Texte libre indicatif</span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="req-date">
                    Date souhaitée (optionnel)
                  </label>
                  <input
                    id="req-date"
                    type="date"
                    className="form-input font-mono"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="req-message">
                {isQuote ? 'Décrivez votre besoin *' : 'Votre message *'}
              </label>
              <textarea
                id="req-message"
                rows={4}
                required
                className="form-input"
                placeholder={
                  isQuote
                    ? 'Détails du projet, objectifs, délais, contraintes techniques...'
                    : 'Précisez votre question ou votre demande d\'informations...'
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="btn-admin-cta secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-admin-cta primary"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="btn-loading-content">
                    <span className="spinner" /> Envoi en cours...
                  </span>
                ) : isQuote ? (
                  'Transmettre ma demande de devis'
                ) : (
                  'Envoyer le message'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
