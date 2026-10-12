import React from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { MessageIcon } from '@/components/icons';
import type { AdminGlobalStats } from '@/types';

interface RequestsSummaryTabProps {
  stats: AdminGlobalStats;
}

export const RequestsSummaryTab: React.FC<RequestsSummaryTabProps> = ({ stats }) => {
  const { navigate } = useNavigation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div className="admin-quick-actions-bar">
        <div className="quick-actions-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ color: '#c084fc', display: 'inline-flex' }}>
              <MessageIcon size={22} />
            </span>
            <h2 className="overview-headline">Messages & Devis</h2>
          </div>
          <p className="overview-subline">
            Gestion centralisée des prises de contact, demandes d'information et devis personnalisés.
          </p>
        </div>
        <div className="quick-actions-buttons">
          <button
            type="button"
            className="btn-admin-cta primary"
            onClick={() => navigate('requests_admin')}
          >
            Ouvrir Messages & Devis &rarr;
          </button>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="stat-label">Total Demandes</span>
          <span className="stat-value">{stats.requests.totalRequests}</span>
          <span className="stat-detail">Tous messages et devis</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-label">Nouvelles</span>
          <span className="stat-value text-accent">{stats.requests.newRequests}</span>
          <span className="stat-detail">À qualifier en priorité</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-label">En Cours</span>
          <span className="stat-value text-warning">{stats.requests.inReviewRequests}</span>
          <span className="stat-detail">En cours d'étude par l'équipe</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-label">Devis Envoyés</span>
          <span className="stat-value text-success">{stats.requests.quotedRequests}</span>
          <span className="stat-detail">Offres chiffrées transmises</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-label">Clôturées</span>
          <span className="stat-value">{stats.requests.closedRequests}</span>
          <span className="stat-detail">Acceptées ou finalisées</span>
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
          Gestion & Réponses aux Prospects
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          L'espace Messages & Devis (`/admin/requests`) permet aux équipes et administrateurs autorisés de visualiser le détail complet de chaque requête (provenance Académie, Services ou Générale), de rédiger une réponse officielle et de faire évoluer le statut.
        </p>
        <div>
          <button
            type="button"
            className="btn-admin-cta secondary"
            onClick={() => navigate('requests_admin')}
          >
            Accéder à l'interface Messages & Devis
          </button>
        </div>
      </div>
    </div>
  );
};
