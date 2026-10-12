import React from 'react';
import { AcademyIcon } from '@/components/icons';

interface OverviewStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  archivedCourses: number;
  totalCategories: number;
  totalEnrollments: number;
  pendingPayments?: number;
  approvedPayments?: number;
}

interface AcademyAdminOverviewProps {
  stats: OverviewStats;
  loading: boolean;
  onNewCourse: () => void;
  onNewCategory: () => void;
  onNavigatePayments?: () => void;
}

export const AcademyAdminOverview: React.FC<AcademyAdminOverviewProps> = ({
  stats,
  loading,
  onNewCourse,
  onNewCategory,
  onNavigatePayments,
}) => {
  return (
    <div className="admin-overview-section">
      {/* Quick Action Bar */}
      <div className="admin-quick-actions-bar">
        <div className="quick-actions-info">
          <h2 className="overview-headline">Tableau de bord Pédagogique</h2>
          <p className="overview-subline">
            Statistiques en temps réel et accès rapide à la création de contenus
          </p>
        </div>
        <div className="quick-actions-buttons">
          <button
            type="button"
            className="btn-admin-cta secondary"
            onClick={onNewCategory}
          >
            + Nouvelle catégorie
          </button>
          <button
            type="button"
            className="btn-admin-cta primary"
            onClick={onNewCourse}
          >
            + Nouvelle formation
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="stat-label">Total Formations</span>
          <span className="stat-value">{loading ? '...' : stats.totalCourses}</span>
          <span className="stat-detail">Toutes formations créées</span>
        </div>

        <div className="admin-stat-card stat-published">
          <span className="stat-label">Formations Publiées</span>
          <span className="stat-value text-success">{loading ? '...' : stats.publishedCourses}</span>
          <span className="stat-detail">Accessibles aux apprenants</span>
        </div>

        <div className="admin-stat-card stat-draft">
          <span className="stat-label">En Brouillon</span>
          <span className="stat-value text-warning">{loading ? '...' : stats.draftCourses}</span>
          <span className="stat-detail">En cours de rédaction</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-label">Catégories</span>
          <span className="stat-value">{loading ? '...' : stats.totalCategories}</span>
          <span className="stat-detail">Pôles d'apprentissage</span>
        </div>

        <div className="admin-stat-card stat-enrollments">
          <span className="stat-label">Inscriptions Apprenants</span>
          <span className="stat-value text-accent">{loading ? '...' : stats.totalEnrollments}</span>
          <span className="stat-detail">Inscriptions totales confirmées</span>
        </div>

        <div
          className={`admin-stat-card ${onNavigatePayments ? 'cursor-pointer' : ''}`}
          onClick={onNavigatePayments}
          style={{
            cursor: onNavigatePayments ? 'pointer' : 'default',
            borderColor: (stats.pendingPayments || 0) > 0 ? 'rgba(245, 158, 11, 0.4)' : undefined,
            backgroundColor: (stats.pendingPayments || 0) > 0 ? 'rgba(245, 158, 11, 0.05)' : undefined,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Paiements en attente</span>
            {(stats.pendingPayments || 0) > 0 && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.45rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                }}
              >
                À traiter
              </span>
            )}
          </div>
          <span className="stat-value text-warning">
            {loading ? '...' : (stats.pendingPayments ?? 0)}
          </span>
          <span className="stat-detail">
            {onNavigatePayments ? 'Cliquer pour examiner les règlements →' : 'En attente de validation'}
          </span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-label">Paiements Validés</span>
          <span className="stat-value text-success">
            {loading ? '...' : (stats.approvedPayments ?? 0)}
          </span>
          <span className="stat-detail">Règlements encaissés</span>
        </div>
      </div>
    </div>
  );
};
