import React from 'react';
import type { Opportunity } from '@/types';
import { CloseIcon, TrashIcon } from '@/components/icons';

interface DeleteOpportunityModalProps {
  opportunity: Opportunity;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export const DeleteOpportunityModal: React.FC<DeleteOpportunityModalProps> = ({
  opportunity,
  isDeleting,
  onConfirm,
  onClose,
}) => {
  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container delete-confirmation-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="delete-warning-icon-wrapper">
              <TrashIcon size={20} className="text-rose-400" />
            </div>
            <div>
              <h2 className="modal-title">Supprimer cette opportunité ?</h2>
              <p className="modal-subtitle text-rose-400/90 font-medium">
                Cette action est irréversible.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Fermer"
            disabled={isDeleting}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="delete-modal-body py-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Êtes-vous sûr de vouloir supprimer définitivement l'opportunité :
          </p>
          <div className="mt-2.5 p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="font-semibold text-slate-100 text-sm">{opportunity.title}</div>
            <div className="text-xs text-slate-400 mt-0.5">{opportunity.organization_name}</div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Toutes les candidatures rattachées à cette offre seront également supprimées ou désassociées.
          </p>
        </div>

        <div className="modal-footer-actions">
          <button
            type="button"
            className="btn-admin-cta"
            onClick={onClose}
            disabled={isDeleting}
          >
            Annuler
          </button>
          <button
            type="button"
            className="btn-admin-cta delete"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? (
              <span className="btn-loading-content">
                <span className="spinner" /> Suppression en cours...
              </span>
            ) : (
              'Supprimer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
