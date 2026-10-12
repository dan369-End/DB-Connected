import React from 'react';

interface MarketplaceStats {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  archivedProducts: number;
  totalCategories: number;
}

interface MarketplaceAdminOverviewProps {
  stats: MarketplaceStats;
  loading: boolean;
  onNewProduct: () => void;
  onNewCategory: () => void;
}

export const MarketplaceAdminOverview: React.FC<MarketplaceAdminOverviewProps> = ({
  stats,
  loading,
  onNewProduct,
  onNewCategory,
}) => {
  return (
    <div className="admin-overview-section">
      {/* Quick Action Bar */}
      <div className="admin-quick-actions-bar">
        <div className="quick-actions-info">
          <h2 className="overview-headline">Tableau de bord Marketplace</h2>
          <p className="overview-subline">
            Statistiques réelles des stocks, catalogues et accès rapide à la gestion des offres
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
            onClick={onNewProduct}
          >
            + Nouveau produit
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="stat-label">Total Produits</span>
          <span className="stat-value">{loading ? '...' : stats.totalProducts}</span>
          <span className="stat-detail">Toutes références créées</span>
        </div>

        <div className="admin-stat-card stat-published">
          <span className="stat-label">Produits Publiés</span>
          <span className="stat-value text-success">{loading ? '...' : stats.publishedProducts}</span>
          <span className="stat-detail">Visibles dans le catalogue</span>
        </div>

        <div className="admin-stat-card stat-draft">
          <span className="stat-label">En Brouillon</span>
          <span className="stat-value text-warning">{loading ? '...' : stats.draftProducts}</span>
          <span className="stat-detail">Fiches en préparation</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-label">Archivés</span>
          <span className="stat-value text-muted">{loading ? '...' : stats.archivedProducts}</span>
          <span className="stat-detail">Retirés de la vente</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-label">Catégories</span>
          <span className="stat-value text-accent">{loading ? '...' : stats.totalCategories}</span>
          <span className="stat-detail">Rayons du marketplace</span>
        </div>
      </div>
    </div>
  );
};
