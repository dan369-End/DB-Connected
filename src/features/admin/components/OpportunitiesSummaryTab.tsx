import React from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { OpportunitiesIcon } from '@/components/icons';
import type { AdminGlobalStats } from '@/types';

interface OpportunitiesSummaryTabProps {
  stats: AdminGlobalStats;
}

export const OpportunitiesSummaryTab: React.FC<OpportunitiesSummaryTabProps> = ({ stats }) => {
  const { navigate } = useNavigation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div className="admin-quick-actions-bar">
        <div className="quick-actions-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ color: '#2dd4bf', display: 'inline-flex' }}>
              <OpportunitiesIcon size={22} />
            </span>
            <h2 className="overview-headline">Module Opportunités</h2>
          </div>
          <p className="overview-subline">
            Supervision des offres d'emploi, stages, missions et suivi des candidatures reçues.
          </p>
        </div>
        <div className="quick-actions-buttons">
          <button
            type="button"
            className="btn-admin-cta primary"
            onClick={() => navigate('opportunities_admin')}
          >
            Ouvrir Administration Opportunités &rarr;
          </button>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="stat-label">Total Opportunités</span>
          <span className="stat-value">{stats.opportunities.totalOpportunities}</span>
          <span className="stat-detail">Toutes annonces créées</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-label">Offres Publiées</span>
          <span className="stat-value text-success">{stats.opportunities.publishedOpportunities}</span>
          <span className="stat-detail">En ligne et postulables</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-label">Candidatures Totales</span>
          <span className="stat-value text-accent">{stats.opportunities.totalApplications}</span>
          <span className="stat-detail">Dossiers de candidats reçus</span>
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
          Recrutement & Gestion des Talents
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          L'administration des opportunités permet aux éditeurs et super admins de publier des offres ciblées, d'évaluer les profils postulants et de suivre le statut des dossiers (reçu, en examen, retenu, rejeté).
        </p>
        <div>
          <button
            type="button"
            className="btn-admin-cta secondary"
            onClick={() => navigate('opportunities_admin')}
          >
            Accéder à l'espace complet Opportunités
          </button>
        </div>
      </div>
    </div>
  );
};
