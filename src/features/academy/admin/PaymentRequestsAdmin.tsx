import React, { useState, useMemo } from 'react';
import { UserAvatar } from '@/components/UserAvatar';
import { SearchIcon, CloseIcon, CheckCircleIcon } from '@/components/icons';
import {
  approveAcademyPaymentRequest,
  rejectAcademyPaymentRequest,
} from '../academyPaymentService';
import type { AcademyPaymentRequest, AcademyPaymentStatus } from '@/types';

interface PaymentRequestsAdminProps {
  requests: AcademyPaymentRequest[];
  loading: boolean;
  onRefresh: () => void;
}

type FilterStatus = 'all' | AcademyPaymentStatus;

const STATUS_LABELS: Record<AcademyPaymentStatus, string> = {
  pending: 'En attente',
  approved: 'Validé',
  rejected: 'Refusé',
  cancelled: 'Annulé',
};

const STATUS_STYLES: Record<AcademyPaymentStatus, { bg: string; border: string; text: string }> = {
  pending: {
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.35)',
    text: '#fbbf24',
  },
  approved: {
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.35)',
    text: '#34d399',
  },
  rejected: {
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.35)',
    text: '#f87171',
  },
  cancelled: {
    bg: 'rgba(148, 163, 184, 0.15)',
    border: 'rgba(148, 163, 184, 0.3)',
    text: '#94a3b8',
  },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  airtel_money: 'Airtel Money',
  mtn_money: 'MTN Mobile Money',
  bank_transfer: 'Virement bancaire',
  cash: 'Espèces / Agence',
};

export const PaymentRequestsAdmin: React.FC<PaymentRequestsAdminProps> = ({
  requests,
  loading,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<AcademyPaymentRequest | null>(null);

  // Action modals states
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // Sort: pending first, then by date descending
  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [requests]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return sortedRequests.filter((r) => {
      if (filter !== 'all' && r.status !== filter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const courseTitle = (r.academy_courses?.title || '').toLowerCase();
        const learnerName = (r.user_profile?.full_name || '').toLowerCase();
        const phone = (r.participant_phone || '').toLowerCase();
        const ref = (r.payment_reference || '').toLowerCase();
        if (!courseTitle.includes(q) && !learnerName.includes(q) && !phone.includes(q) && !ref.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [sortedRequests, filter, searchQuery]);

  const handleOpenDetail = (req: AcademyPaymentRequest) => {
    setSelectedRequest(req);
    setAdminNote(req.admin_note || '');
    setActionSuccessMessage(null);
    setActionErrorMessage(null);
    setIsApproving(false);
    setIsRejecting(false);
  };

  const handleCloseDetail = () => {
    setSelectedRequest(null);
    setIsApproving(false);
    setIsRejecting(false);
    setAdminNote('');
  };

  const handleConfirmApproval = async () => {
    if (!selectedRequest) return;
    setSubmittingAction(true);
    setActionErrorMessage(null);

    const res = await approveAcademyPaymentRequest(selectedRequest.id, adminNote);
    if (!res.success) {
      setActionErrorMessage(res.error || 'Erreur lors de la validation du paiement.');
    } else {
      setActionSuccessMessage('Paiement validé et inscription activée.');
      setIsApproving(false);
      onRefresh();
      // Update selectedRequest status locally for immediate feedback
      setSelectedRequest((prev) => (prev ? { ...prev, status: 'approved', admin_note: adminNote } : null));
    }
    setSubmittingAction(false);
  };

  const handleConfirmRejection = async () => {
    if (!selectedRequest) return;
    setSubmittingAction(true);
    setActionErrorMessage(null);

    const res = await rejectAcademyPaymentRequest(selectedRequest.id, adminNote);
    if (!res.success) {
      setActionErrorMessage(res.error || 'Erreur lors du refus de la demande.');
    } else {
      setActionSuccessMessage('Demande de paiement refusée.');
      setIsRejecting(false);
      onRefresh();
      // Update selectedRequest status locally for immediate feedback
      setSelectedRequest((prev) => (prev ? { ...prev, status: 'rejected', admin_note: adminNote } : null));
    }
    setSubmittingAction(false);
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;
  const cancelledCount = requests.filter((r) => r.status === 'cancelled').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Action and Filter Bar */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
              Demandes de Paiement Formations
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Vérification des preuves de règlement et activation des inscriptions
            </p>
          </div>

          <button
            type="button"
            className="btn-admin-cta secondary"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? 'Actualisation...' : 'Actualiser'}
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '100%' }}>
          <span
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              display: 'inline-flex',
              pointerEvents: 'none',
            }}
          >
            <SearchIcon size={18} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par formation, apprenant, téléphone ou référence..."
            style={{
              width: '100%',
              padding: '0.65rem 2.5rem 0.65rem 2.75rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(11, 15, 25, 0.6)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-main)',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
              }}
              aria-label="Effacer"
            >
              <CloseIcon size={16} />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            Filtres :
          </span>

          <button
            type="button"
            onClick={() => setFilter('all')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.775rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: filter === 'all' ? 'var(--color-accent)' : 'var(--color-border)',
              backgroundColor: filter === 'all' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
              color: filter === 'all' ? 'var(--color-accent)' : 'var(--color-text-muted)',
            }}
          >
            Tous ({requests.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter('pending')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.775rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: filter === 'pending' ? '#fbbf24' : 'var(--color-border)',
              backgroundColor: filter === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: filter === 'pending' ? '#fbbf24' : 'var(--color-text-muted)',
            }}
          >
            En attente ({pendingCount})
          </button>

          <button
            type="button"
            onClick={() => setFilter('approved')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.775rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: filter === 'approved' ? '#34d399' : 'var(--color-border)',
              backgroundColor: filter === 'approved' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: filter === 'approved' ? '#34d399' : 'var(--color-text-muted)',
            }}
          >
            Validés ({approvedCount})
          </button>

          <button
            type="button"
            onClick={() => setFilter('rejected')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.775rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: filter === 'rejected' ? '#f87171' : 'var(--color-border)',
              backgroundColor: filter === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              color: filter === 'rejected' ? '#f87171' : 'var(--color-text-muted)',
            }}
          >
            Refusés ({rejectedCount})
          </button>

          <button
            type="button"
            onClick={() => setFilter('cancelled')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.775rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: filter === 'cancelled' ? '#94a3b8' : 'var(--color-border)',
              backgroundColor: filter === 'cancelled' ? 'rgba(148, 163, 184, 0.15)' : 'transparent',
              color: filter === 'cancelled' ? '#94a3b8' : 'var(--color-text-muted)',
            }}
          >
            Annulés ({cancelledCount})
          </button>
        </div>
      </div>

      {/* Table / List View */}
      {loading ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="spinner large" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Chargement des demandes de paiement...
          </p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
            Aucune demande de paiement trouvée
          </h4>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            {filter === 'pending'
              ? 'Aucun paiement en attente de validation.'
              : 'Aucune transaction ne correspond à vos filtres actuels.'}
          </p>
        </div>
      ) : (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Formation</th>
                <th style={{ width: '22%' }}>Apprenant</th>
                <th style={{ width: '16%' }}>Montant</th>
                <th style={{ width: '14%' }}>Règlement</th>
                <th style={{ width: '12%' }}>Statut</th>
                <th style={{ width: '14%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => {
                const statusStyle = STATUS_STYLES[req.status] || STATUS_STYLES.pending;
                const formattedDate = new Date(req.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const methodLabel = PAYMENT_METHOD_LABELS[req.payment_method] || req.payment_method;

                return (
                  <tr
                    key={req.id}
                    onClick={() => handleOpenDetail(req)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: req.status === 'pending' ? 'rgba(245, 158, 11, 0.03)' : undefined,
                    }}
                  >
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                        {req.academy_courses?.title || 'Formation sans titre'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {formattedDate}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <UserAvatar
                          avatarUrl={req.user_profile?.avatar_url}
                          fullName={req.user_profile?.full_name}
                          size={32}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                            {req.user_profile?.full_name || 'Apprenant'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {req.participant_phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>
                        {req.amount.toLocaleString('fr-FR')} {req.currency}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Réf: {req.payment_reference}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.825rem', color: 'var(--color-text-main)' }}>
                        {methodLabel}
                      </div>
                      {req.participant_whatsapp && req.participant_whatsapp !== req.participant_phone && (
                        <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>
                          WA: {req.participant_whatsapp}
                        </div>
                      )}
                    </td>

                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: statusStyle.bg,
                          border: `1px solid ${statusStyle.border}`,
                          color: statusStyle.text,
                        }}
                      >
                        {STATUS_LABELS[req.status] || req.status}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn-table-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(req);
                        }}
                        style={{
                          color: req.status === 'pending' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                          borderColor: req.status === 'pending' ? 'rgba(56, 189, 248, 0.3)' : undefined,
                        }}
                      >
                        {req.status === 'pending' ? 'Examiner' : 'Détails'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail & Action Modal */}
      {selectedRequest && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !submittingAction) {
              handleCloseDetail();
            }
          }}
        >
          <div
            className="modal-container"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                  Détail de la Demande de Paiement
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                  Transaction #{selectedRequest.id.slice(0, 8)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseDetail}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: '0.4rem',
                  display: 'flex',
                }}
                aria-label="Fermer"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Body */}
            <div
              style={{
                padding: '1.5rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              {/* Feedback messages */}
              {actionErrorMessage && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: '0.85rem',
                  }}
                >
                  {actionErrorMessage}
                </div>
              )}

              {actionSuccessMessage && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <CheckCircleIcon size={16} />
                  <span>{actionSuccessMessage}</span>
                </div>
              )}

              {/* Status Banner */}
              <div
                style={{
                  padding: '0.85rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: STATUS_STYLES[selectedRequest.status].bg,
                  border: `1px solid ${STATUS_STYLES[selectedRequest.status].border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: STATUS_STYLES[selectedRequest.status].text }}>
                  Statut : {STATUS_LABELS[selectedRequest.status]}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {new Date(selectedRequest.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {/* Course Info */}
              <div
                style={{
                  backgroundColor: 'rgba(11, 15, 25, 0.4)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                  Formation concernée
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                  {selectedRequest.academy_courses?.title || 'Formation sans titre'}
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-accent)', marginTop: '0.25rem' }}>
                  {selectedRequest.amount.toLocaleString('fr-FR')} {selectedRequest.currency}
                </div>
              </div>

              {/* Grid Info */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.85rem',
                  fontSize: '0.825rem',
                }}
              >
                <div style={{ backgroundColor: 'rgba(11, 15, 25, 0.3)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Apprenant</div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                    {selectedRequest.user_profile?.full_name || 'Non renseigné'}
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(11, 15, 25, 0.3)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Mode de règlement</div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                    {PAYMENT_METHOD_LABELS[selectedRequest.payment_method] || selectedRequest.payment_method}
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(11, 15, 25, 0.3)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Téléphone de paiement</div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                    {selectedRequest.participant_phone}
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(11, 15, 25, 0.3)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>WhatsApp</div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                    {selectedRequest.participant_whatsapp || selectedRequest.participant_phone}
                  </div>
                </div>
              </div>

              {/* Reference */}
              <div
                style={{
                  backgroundColor: 'rgba(11, 15, 25, 0.5)',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                  Référence de transaction / Reçu client
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-main)', letterSpacing: '0.02em' }}>
                  {selectedRequest.payment_reference}
                </div>
              </div>

              {/* Admin Note Input / Display */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  Note administrative (visible lors du refus ou de la validation) :
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Ex : Référence vérifiée sur le relevé Airtel Money du 07/10..."
                  disabled={selectedRequest.status !== 'pending' && !isApproving && !isRejecting}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(11, 15, 25, 0.6)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-main)',
                    fontSize: '0.85rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Confirmation sub-boxes */}
              {isApproving && (
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#34d399' }}>
                    Valider ce paiement ?
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                    L'apprenant sera inscrit à cette formation et aura immédiatement accès aux modules et leçons.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn-admin-cta secondary"
                      onClick={() => setIsApproving(false)}
                      disabled={submittingAction}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="btn-admin-cta primary"
                      onClick={handleConfirmApproval}
                      disabled={submittingAction}
                    >
                      {submittingAction ? 'Validation...' : 'Confirmer la validation'}
                    </button>
                  </div>
                </div>
              )}

              {isRejecting && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f87171' }}>
                    Refuser cette demande de paiement ?
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                    La demande passera au statut « Refusé ». Veuillez indiquer le motif dans la note administrative ci-dessus afin d'informer l'apprenant.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn-admin-cta secondary"
                      onClick={() => setIsRejecting(false)}
                      disabled={submittingAction}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmRejection}
                      disabled={submittingAction}
                      style={{
                        padding: '0.65rem 1.2rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        color: '#f87171',
                      }}
                    >
                      {submittingAction ? 'Refus...' : 'Confirmer le refus'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(11, 15, 25, 0.3)',
              }}
            >
              <button
                type="button"
                className="btn-admin-cta secondary"
                onClick={handleCloseDetail}
              >
                Fermer
              </button>

              {selectedRequest.status === 'pending' && !isApproving && !isRejecting && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRejecting(true);
                      setIsApproving(false);
                    }}
                    style={{
                      padding: '0.65rem 1.2rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#f87171',
                    }}
                  >
                    Refuser
                  </button>

                  <button
                    type="button"
                    className="btn-admin-cta primary"
                    onClick={() => {
                      setIsApproving(true);
                      setIsRejecting(false);
                    }}
                  >
                    Valider le paiement
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
