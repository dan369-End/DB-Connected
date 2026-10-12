import React from 'react';
import { PackageIcon, ServicesIcon, CategoryIcon } from '@/components/icons';
import type { ServiceRecord, ServiceCategory, ServiceRequestRecord } from '@/types';

interface ServicesAdminOverviewProps {
  services: ServiceRecord[];
  categories: ServiceCategory[];
  requests: ServiceRequestRecord[];
  onNavigateTab: (tab: 'services' | 'categories' | 'requests') => void;
}

export const ServicesAdminOverview: React.FC<ServicesAdminOverviewProps> = ({
  services,
  categories,
  requests,
  onNavigateTab,
}) => {
  // Compute strictly from database records
  const totalServices = services.length;
  const publishedServices = services.filter((s) => s.status === 'published').length;
  const draftServices = services.filter((s) => s.status === 'draft').length;
  const archivedServices = services.filter((s) => s.status === 'archived').length;
  const totalCategories = categories.length;
  const pendingRequests = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="admin-overview-container">
      <div className="admin-stats-grid">
        <div
          className="admin-stat-card cursor-pointer"
          onClick={() => onNavigateTab('services')}
          role="button"
          tabIndex={0}
        >
          <div className="stat-card-header">
            <span className="stat-card-label">Prestations totales</span>
            <div className="stat-card-icon-box">
              <ServicesIcon size={18} />
            </div>
          </div>
          <div className="stat-card-value font-mono">{totalServices}</div>
          <div className="stat-card-sub text-muted">
            {publishedServices} publiées &bull; {draftServices} brouillons
          </div>
        </div>

        <div
          className="admin-stat-card cursor-pointer"
          onClick={() => onNavigateTab('services')}
          role="button"
          tabIndex={0}
        >
          <div className="stat-card-header">
            <span className="stat-card-label">Services publiés</span>
            <div className="stat-card-icon-box accent">
              <ServicesIcon size={18} />
            </div>
          </div>
          <div className="stat-card-value font-mono text-accent">
            {publishedServices}
          </div>
          <div className="stat-card-sub text-muted">
            Visibles au grand public
          </div>
        </div>

        <div
          className="admin-stat-card cursor-pointer"
          onClick={() => onNavigateTab('services')}
          role="button"
          tabIndex={0}
        >
          <div className="stat-card-header">
            <span className="stat-card-label">Services brouillons</span>
            <div className="stat-card-icon-box">
              <ServicesIcon size={18} />
            </div>
          </div>
          <div className="stat-card-value font-mono">{draftServices}</div>
          <div className="stat-card-sub text-muted">
            {archivedServices} archivés
          </div>
        </div>

        <div
          className="admin-stat-card cursor-pointer"
          onClick={() => onNavigateTab('categories')}
          role="button"
          tabIndex={0}
        >
          <div className="stat-card-header">
            <span className="stat-card-label">Catégories actives</span>
            <div className="stat-card-icon-box">
              <CategoryIcon size={18} />
            </div>
          </div>
          <div className="stat-card-value font-mono">{totalCategories}</div>
          <div className="stat-card-sub text-muted">
            Taxonomie de structuration
          </div>
        </div>

        <div
          className="admin-stat-card cursor-pointer"
          onClick={() => onNavigateTab('requests')}
          role="button"
          tabIndex={0}
        >
          <div className="stat-card-header">
            <span className="stat-card-label">Demandes en attente</span>
            <div className="stat-card-icon-box alert">
              <PackageIcon size={18} />
            </div>
          </div>
          <div className="stat-card-value font-mono text-warning">
            {pendingRequests}
          </div>
          <div className="stat-card-sub text-muted">
            Sur un total de {requests.length} demandes
          </div>
        </div>
      </div>
    </div>
  );
};
