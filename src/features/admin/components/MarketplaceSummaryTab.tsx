import React from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { MarketplaceIcon } from '@/components/icons';
import type { AdminGlobalStats } from '@/types';

interface MarketplaceSummaryTabProps {
  stats: AdminGlobalStats;
}

export const MarketplaceSummaryTab: React.FC<MarketplaceSummaryTabProps> = ({ stats }) => {
  const { navigate } = useNavigation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div className="admin-quick-actions-bar">
        <div className="quick-actions-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ color: '#34d399', display: 'inline-flex' }}>
              <MarketplaceIcon size={22} />
            </span>
            <h2 className="overview-headline">Module Marketplace</h2>
          </div>
          <p className="overview-subline">
            Supervision du catalogue e-commerce, gestion des stocks et suivi des flux de commandes.
          </p>
        </div>
        <div className="quick-actions-buttons">
          <button
            type="button"
            className="btn-admin-cta primary"
            onClick={() => navigate('marketplace_admin')}
          >
            Ouvrir Administration Marketplace &rarr;
          </button>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="stat-label">Total Produits</span>
          <span className="stat-value">{stats.marketplace.totalProducts}</span>
          <span className="stat-detail">Références au catalogue</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-label">Produits Publiés</span>
          <span className="stat-value text-success">{stats.marketplace.publishedProducts}</span>
          <span className="stat-detail">Disponibles à l'achat</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-label">Commandes Totales</span>
          <span className="stat-value text-accent">{stats.marketplace.totalOrders}</span>
          <span className="stat-detail">Historique des commandes</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-label">Commandes en attente</span>
          <span className="stat-value text-warning">{stats.marketplace.pendingOrders}</span>
          <span className="stat-detail">Nécessitent une validation</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-label">Commandes Livrées</span>
          <span className="stat-value text-success">{stats.marketplace.deliveredOrders}</span>
          <span className="stat-detail">Expéditions finalisées</span>
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
          Gestion Opérationnelle Marketplace
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          Le back-office Marketplace centralise la création des fiches articles, la gestion des catégories, le suivi des stocks physiques et l'avancement progressif des statuts de commandes (En attente, Confirmée, En préparation, Prête, Expédiée, Livrée).
        </p>
        <div>
          <button
            type="button"
            className="btn-admin-cta secondary"
            onClick={() => navigate('marketplace_admin')}
          >
            Accéder à l'espace complet Marketplace
          </button>
        </div>
      </div>
    </div>
  );
};
