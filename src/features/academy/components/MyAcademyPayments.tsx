import React from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { AcademyIcon } from '@/components/icons';
import type { AcademyPaymentRequest, AcademyPaymentStatus } from '@/types';

interface MyAcademyPaymentsProps {
  requests: AcademyPaymentRequest[];
  loading: boolean;
  onRefresh: () => void;
}

const STATUS_LABELS: Record<AcademyPaymentStatus, string> = {
  pending: 'En attente de validation',
  approved: 'Paiement validé',
  rejected: 'Paiement refusé',
  cancelled: 'Demande annulée',
};

const STATUS_STYLES: Record<AcademyPaymentStatus, { bg: string; border: string; text: string }> = {
  pending: {
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)',
    text: '#fbbf24',
  },
  approved: {
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)',
    text: '#34d399',
  },
  rejected: {
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.3)',
    text: '#f87171',
  },
  cancelled: {
    bg: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.25)',
    text: '#94a3b8',
  },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  airtel_money: 'Airtel Money',
  mtn_money: 'MTN Mobile Money',
  bank_transfer: 'Virement bancaire',
  cash: 'Espèces / Agence',
};

export const MyAcademyPayments: React.FC<MyAcademyPaymentsProps> = ({
  requests,
  loading,
  onRefresh,
}) => {
  const { navigate } = useNavigation();

  if (loading) {
    return (
      <div className="academy-loading-box">
        <div className="spinner large" />
        <p className="loading-label">Chargement de vos paiements...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="academy-empty-state">
        <div className="empty-icon-wrap">
          <AcademyIcon size={44} />
        </div>
        <h3 className="empty-title">Aucun historique de paiement</h3>
        <p className="empty-desc">
          Vous n'avez soumis aucune demande de paiement pour le moment. Lorsque vous vous inscrivez à une formation payante, votre preuve de règlement apparaîtra ici.
        </p>
        <button
          type="button"
          className="btn-back-catalog"
          onClick={() => navigate('academy')}
        >
          Découvrir les formations
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
            Mes Paiements de Formations
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
            Suivi des validations de vos transactions et règlements
          </p>
        </div>

        <button
          type="button"
          className="btn-admin-cta secondary"
          onClick={onRefresh}
          style={{ fontSize: '0.8rem' }}
        >
          Actualiser
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {requests.map((req) => {
          const statusStyle = STATUS_STYLES[req.status] || STATUS_STYLES.pending;
          const course = req.academy_courses;
          const formattedDate = new Date(req.created_at).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          const methodLabel = PAYMENT_METHOD_LABELS[req.payment_method] || req.payment_method;

          return (
            <div
              key={req.id}
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {/* Header row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0, flex: 1 }}>
                  {course?.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      style={{
                        width: '64px',
                        height: '48px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '64px',
                        height: '48px',
                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-accent)',
                      }}
                    >
                      <AcademyIcon size={24} />
                    </div>
                  )}

                  <div style={{ minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: 'var(--color-text-main)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {course?.title || 'Formation'}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                      Demande soumise le {formattedDate}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <span
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    backgroundColor: statusStyle.bg,
                    border: `1px solid ${statusStyle.border}`,
                    color: statusStyle.text,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {STATUS_LABELS[req.status]}
                </span>
              </div>

              {/* Transaction details row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem',
                  padding: '0.85rem',
                  backgroundColor: 'rgba(11, 15, 25, 0.4)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  fontSize: '0.825rem',
                }}
              >
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Montant réglé</div>
                  <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>
                    {req.amount.toLocaleString('fr-FR')} {req.currency}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Mode de règlement</div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                    {methodLabel}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Référence / Reçu</div>
                  <div style={{ fontWeight: 600, color: 'var(--color-accent)' }}>
                    {req.payment_reference}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Téléphone de paiement</div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                    {req.participant_phone}
                  </div>
                </div>
              </div>

              {/* Status Message & Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  paddingTop: '0.25rem',
                }}
              >
                {req.status === 'pending' && (
                  <div style={{ fontSize: '0.85rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>⏳</span>
                    <span>Votre paiement est en cours de vérification par notre équipe.</span>
                  </div>
                )}

                {req.status === 'approved' && (
                  <div style={{ fontSize: '0.85rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>✓</span>
                    <span>Paiement validé. Votre inscription est confirmée !</span>
                  </div>
                )}

                {req.status === 'rejected' && (
                  <div style={{ fontSize: '0.85rem', color: '#f87171' }}>
                    <strong>Motif du refus :</strong>{' '}
                    {req.admin_note || 'Vérification de la référence infructueuse. Veuillez contacter le support.'}
                  </div>
                )}

                {req.status === 'cancelled' && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    Demande annulée.
                  </div>
                )}

                {/* Action button */}
                <div>
                  {req.status === 'approved' && (
                    <button
                      type="button"
                      className="btn-admin-cta primary"
                      onClick={() => navigate('academy_player', { courseId: req.course_id })}
                      style={{ fontSize: '0.825rem', padding: '0.5rem 1rem' }}
                    >
                      Accéder à la formation &rarr;
                    </button>
                  )}

                  {req.status === 'pending' && (
                    <button
                      type="button"
                      className="btn-table-action"
                      onClick={() => navigate('academy_course', { courseId: req.course_id })}
                      style={{ fontSize: '0.8rem' }}
                    >
                      Voir la formation
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
