import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { createServiceRequest } from '../servicesService';
import { CloseIcon, PackageIcon } from '@/components/icons';
import type { ServiceRecord } from '@/types';

interface ServiceRequestModalProps {
  service: ServiceRecord;
  onClose: () => void;
  onSuccess: (requestId: string) => void;
}

export const ServiceRequestModal: React.FC<ServiceRequestModalProps> = ({
  service,
  onClose,
  onSuccess,
}) => {
  const { user, profile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [email, setEmail] = useState(user?.email || profile?.email || '');
  const [message, setMessage] = useState('');
  const [preferredDate, setPreferredDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.full_name && !fullName) setFullName(profile.full_name);
    if ((user?.email || profile?.email) && !email) setEmail(user?.email || profile?.email || '');
    if (profile?.phone && !phone) setPhone(profile.phone);
  }, [profile, user, fullName, email, phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!fullName.trim()) {
      setErrorMessage('Le nom complet est obligatoire.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Le numéro de téléphone est obligatoire.');
      return;
    }
    if (!message.trim()) {
      setErrorMessage('Veuillez décrire votre besoin ou projet.');
      return;
    }

    if (!user?.id) {
      setErrorMessage('Vous devez être authentifié pour soumettre une demande.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const res = await createServiceRequest({
      serviceId: service.id,
      userId: user.id,
      fullName,
      phone,
      email,
      message,
      preferredDate: preferredDate || null,
    });

    if (!res.success || !res.requestId) {
      setErrorMessage(res.error || 'Erreur lors de l\'envoi de la demande.');
      setSubmitting(false);
    } else {
      setSubmitting(false);
      onSuccess(res.requestId);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={() => !submitting && onClose()}>
      <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <h3 className="modal-title">Demande de prestation</h3>
            <span className="modal-sub">
              Service : <strong>{service.title}</strong>
            </span>
          </div>
          <button
            type="button"
            className="btn-close-modal"
            disabled={submitting}
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
              <label className="form-label" htmlFor="req-fullname">
                Nom complet *
              </label>
              <input
                id="req-fullname"
                type="text"
                required
                className="form-input"
                placeholder="Ex : Guy Makaya"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="req-phone">
                Numéro de téléphone joignable *
              </label>
              <input
                id="req-phone"
                type="tel"
                required
                className="form-input font-mono"
                placeholder="Ex : +242 06 000 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="req-email">
              Adresse email (Optionnel)
            </label>
            <input
              id="req-email"
              type="email"
              className="form-input"
              placeholder="Ex : contact@organisation.cg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="req-date">
              Date souhaitée pour l'intervention ou le cadrage (Optionnel)
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

          <div className="form-group">
            <label className="form-label" htmlFor="req-message">
              Description de votre besoin ou projet *
            </label>
            <textarea
              id="req-message"
              required
              rows={4}
              className="form-input"
              placeholder="Précisez votre contexte, vos objectifs et vos attentes vis-à-vis de cette prestation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="admin-modal-actions">
            <button
              type="button"
              className="btn-modal-cancel"
              disabled={submitting}
              onClick={onClose}
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
                  <span className="spinner"></span> Envoi en cours...
                </span>
              ) : (
                'Envoyer ma demande'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
