import React from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { ServicesIcon } from '@/components/icons';
import type { AdminGlobalStats } from '@/types';

interface ServicesSummaryTabProps {
  stats: AdminGlobalStats;
}

export const ServicesSummaryTab: React.FC<ServicesSummaryTabProps> = ({ stats }) => {
  const { navigate } = useNavigation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div className="admin-quick-actions-bar">
        <div className="quick-actions-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ color: '#fbbf24', display: 'inline-flex' }}>
              <ServicesIcon size={22} />
            </span>
            <h2 className="overview-headline">Module Services Professionnels</h2>
          </div>
          <p className="overview-subline">
            Gestion du catalogue des prestations d'ingénierie, d'audit et d'accompagnement numérique.
          </p>
        </div>
        <div className="quick-actions-buttons">
          <button
            type="button"
            className="btn-admin-cta primary"
            onClick={() => navigate('services_admin')}
          >
            Ouvrir Administration Services &rarr;
          </button>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="stat-label">Total Services</span>
          <span className="stat-value">{stats.services.totalServices}</span>
          <span className="stat-detail">Prestations créées</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-label">Services Publiés</span>
          <span className="stat-value text-accent">{stats.services.publishedServices}</span>
          <span className="stat-detail">Visibles au catalogue</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-label">Demandes Reçues</span>
          <span className="stat-value">{stats.services.totalRequests}</span>
          <span className="stat-detail">Flux de demandes directes</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-label">Demandes en attente</span>
          <span className="stat-value text-warning">{stats.services.pendingRequests}</span>
          <span className="stat-detail">En attente de traitement</span>
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
          Pilotage des Prestations & Équipes
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          L'espace d'administration Services permet de créer les offres techniques, configurer les modalités de tarification et répondre aux demandes de contact et devis des entreprises clientes.
        </p>
        <div>
          <button
            type="button"
            className="btn-admin-cta secondary"
            onClick={() => navigate('services_admin')}
          >
            Accéder à l'espace complet Services
          </button>
        </div>
      </div>
    </div>
  );
};
