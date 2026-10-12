import React from 'react';
import type { OpportunityApplication } from '@/types';
import {
  CloseIcon,
  BuildingIcon,
  LocationIcon,
  CalendarIcon,
  ClockIcon,
} from '@/components/icons';
import {
  formatApplicationStatus,
  getApplicationStatusBadgeClass,
  formatDateTime,
  formatDeadline,
} from '../opportunitiesService';

interface ApplicationDetailModalProps {
  application: OpportunityApplication;
  onClose: () => void;
  onWithdraw?: (id: string) => void;
  isWithdrawing?: boolean;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  application,
  onClose,
  onWithdraw,
  isWithdrawing = false,
}) => {
  const opportunity = application.opportunities;
  const canWithdraw = !['accepted', 'rejected', 'withdrawn'].includes(application.status);

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container application-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`app-status-badge ${getApplicationStatusBadgeClass(application.status)}`}>
                {formatApplicationStatus(application.status)}
              </span>
            </div>
            <h2 className="modal-title">Détail de ma candidature</h2>
            <p className="modal-subtitle">
              Transmise le {formatDateTime(application.created_at)}
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Fermer"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Opportunity Card inside modal */}
        {opportunity && (
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
              {opportunity.deadline && (
                <span className="target-meta-item">
                  <CalendarIcon size={14} />
                  <span>Date limite : {formatDeadline(opportunity.deadline)}</span>
                </span>
              )}
            </div>
          </div>
        )}

        <div className="application-details-content">
          <div className="detail-meta-group">
            <h4 className="meta-section-title">Coordonnées transmises</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                <span className="text-xs text-slate-400 block mb-0.5">Nom complet</span>
                <span className="text-slate-100 font-medium">{application.full_name}</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                <span className="text-xs text-slate-400 block mb-0.5">Email</span>
                <span className="text-slate-100 font-medium">{application.email || 'Non renseigné'}</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded border border-slate-800 md:col-span-2">
                <span className="text-xs text-slate-400 block mb-0.5">Téléphone</span>
                <span className="text-slate-100 font-medium">{application.phone || 'Non renseigné'}</span>
              </div>
            </div>
          </div>

          <div className="detail-meta-group mt-4">
            <h4 className="meta-section-title">Message de motivation</h4>
            <div className="p-4 bg-slate-900/60 rounded border border-slate-800 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {application.cover_message ? (
                application.cover_message
              ) : (
                <span className="italic text-slate-500">Aucun message d'accompagnement rédigé.</span>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer-actions">
          {canWithdraw && onWithdraw && (
            <button
              type="button"
              className="btn-admin-cta delete"
              disabled={isWithdrawing}
              onClick={() => onWithdraw(application.id)}
            >
              {isWithdrawing ? 'Retrait en cours...' : 'Retirer ma candidature'}
            </button>
          )}

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
