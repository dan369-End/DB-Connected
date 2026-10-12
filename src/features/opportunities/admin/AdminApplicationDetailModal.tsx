import React, { useState } from 'react';
import type { OpportunityApplication, ApplicationStatus } from '@/types';
import {
  updateApplicationStatus,
  formatApplicationStatus,
  getApplicationStatusBadgeClass,
  formatDateTime,
  formatDeadline,
} from '../opportunitiesService';
import {
  CloseIcon,
  BuildingIcon,
  LocationIcon,
  CalendarIcon,
  CheckCircleIcon,
} from '@/components/icons';

interface AdminApplicationDetailModalProps {
  application: OpportunityApplication;
  onClose: () => void;
  onStatusUpdated: () => Promise<void>;
}

export const AdminApplicationDetailModal: React.FC<AdminApplicationDetailModalProps> = ({
  application,
  onClose,
  onStatusUpdated,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const opp = application.opportunities;
  const currentStatus = application.status;

  const handleSetStatus = async (newStatus: ApplicationStatus) => {
    setIsUpdating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await updateApplicationStatus(application.id, newStatus);
      if (!res.success) {
        setErrorMessage(res.error || 'Impossible de mettre à jour le statut.');
      } else {
        setSuccessMessage(`Statut passé à « ${formatApplicationStatus(newStatus)} »`);
        await onStatusUpdated();
      }
    } catch {
      setErrorMessage('Une erreur imprévue est survenue.');
    } finally {
      setIsUpdating(false);
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
            <div className="flex items-center gap-2 mb-1">
              <span className={`app-status-badge ${getApplicationStatusBadgeClass(currentStatus)}`}>
                {formatApplicationStatus(currentStatus)}
              </span>
            </div>
            <h2 className="modal-title">Candidature de {application.full_name}</h2>
            <p className="modal-subtitle">
              Reçue le {formatDateTime(application.created_at)}
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Fermer"
            disabled={isUpdating}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Opportunity Card */}
        {opp && (
          <div className="application-modal-target">
            <div className="modal-target-title">{opp.title}</div>
            <div className="modal-target-meta">
              <span className="target-meta-item">
                <BuildingIcon size={14} />
                <span>{opp.organization_name}</span>
              </span>
              {opp.location && (
                <span className="target-meta-item">
                  <LocationIcon size={14} />
                  <span>{opp.location}</span>
                </span>
              )}
              {opp.deadline && (
                <span className="target-meta-item">
                  <CalendarIcon size={14} />
                  <span>Limite : {formatDeadline(opp.deadline)}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="auth-alert alert-success mt-3" role="status">
            <CheckCircleIcon size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="auth-alert alert-error mt-3" role="alert">
            {errorMessage}
          </div>
        )}

        {/* Candidate Info */}
        <div className="application-details-content">
          <div className="detail-meta-group">
            <h4 className="meta-section-title">Coordonnées du candidat</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                <span className="text-xs text-slate-400 block mb-0.5">Nom complet</span>
                <span className="text-slate-100 font-semibold">{application.full_name}</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                <span className="text-xs text-slate-400 block mb-0.5">Email</span>
                <span className="text-slate-100 font-medium">
                  {application.email ? (
                    <a href={`mailto:${application.email}`} className="text-cyan-400 hover:underline">
                      {application.email}
                    </a>
                  ) : (
                    'Non renseigné'
                  )}
                </span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded border border-slate-800 md:col-span-2">
                <span className="text-xs text-slate-400 block mb-0.5">Téléphone</span>
                <span className="text-slate-100 font-medium">
                  {application.phone ? (
                    <a href={`tel:${application.phone}`} className="text-cyan-400 hover:underline">
                      {application.phone}
                    </a>
                  ) : (
                    'Non renseigné'
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="detail-meta-group mt-4">
            <h4 className="meta-section-title">Message de motivation</h4>
            <div className="p-4 bg-slate-900/60 rounded border border-slate-800 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {application.cover_message ? (
                application.cover_message
              ) : (
                <span className="italic text-slate-500">Aucun message de motivation rédigé.</span>
              )}
            </div>
          </div>

          {/* Admin Status Evolution Controls */}
          <div className="detail-meta-group mt-5 pt-4 border-t border-slate-800">
            <h4 className="meta-section-title">Évolution du statut de la candidature</h4>

            {currentStatus === 'withdrawn' ? (
              <div className="p-3 bg-slate-900/80 rounded border border-slate-800 text-xs text-slate-400">
                Cette candidature a été retirée par le candidat. Aucune progression normale n'est proposée.
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {/* submitted -> reviewing */}
                {currentStatus === 'submitted' && (
                  <button
                    type="button"
                    className="btn-status-flow primary"
                    disabled={isUpdating}
                    onClick={() => handleSetStatus('reviewing')}
                  >
                    Passer en cours d'étude &rarr;
                  </button>
                )}

                {/* reviewing -> shortlisted */}
                {currentStatus === 'reviewing' && (
                  <button
                    type="button"
                    className="btn-status-flow purple"
                    disabled={isUpdating}
                    onClick={() => handleSetStatus('shortlisted')}
                  >
                    Présélectionner &rarr;
                  </button>
                )}

                {/* shortlisted -> accepted */}
                {currentStatus === 'shortlisted' && (
                  <button
                    type="button"
                    className="btn-status-flow success"
                    disabled={isUpdating}
                    onClick={() => handleSetStatus('accepted')}
                  >
                    Accepter la candidature &rarr;
                  </button>
                )}

                {/* Reject option if not accepted or rejected */}
                {currentStatus !== 'accepted' && currentStatus !== 'rejected' && (
                  <button
                    type="button"
                    className="btn-status-flow danger ml-auto"
                    disabled={isUpdating}
                    onClick={() => handleSetStatus('rejected')}
                  >
                    Refuser la candidature
                  </button>
                )}

                {/* Accepted confirmation tag */}
                {currentStatus === 'accepted' && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircleIcon size={15} />
                    <span>Candidature acceptée et validée</span>
                  </span>
                )}

                {/* Rejected state tag */}
                {currentStatus === 'rejected' && (
                  <span className="text-xs text-rose-400 font-semibold">
                    Candidature refusée
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer-actions">
          <button
            type="button"
            className="btn-admin-cta primary ml-auto"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
