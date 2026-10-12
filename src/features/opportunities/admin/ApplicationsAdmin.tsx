import React, { useState, useMemo } from 'react';
import type { OpportunityApplication, ApplicationStatus, Opportunity } from '@/types';
import {
  formatApplicationStatus,
  getApplicationStatusBadgeClass,
  formatDateTime,
} from '../opportunitiesService';
import { AdminApplicationDetailModal } from './AdminApplicationDetailModal';
import {
  SearchIcon,
  PackageIcon,
  BuildingIcon,
  CheckCircleIcon,
} from '@/components/icons';

interface ApplicationsAdminProps {
  applications: OpportunityApplication[];
  opportunities: Opportunity[];
  onRefresh: () => Promise<void>;
}

export const ApplicationsAdmin: React.FC<ApplicationsAdminProps> = ({
  applications,
  opportunities,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all');
  const [opportunityFilter, setOpportunityFilter] = useState<string>('all');

  const [selectedApplication, setSelectedApplication] = useState<OpportunityApplication | null>(null);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Status filter
      if (statusFilter !== 'all' && app.status !== statusFilter) {
        return false;
      }

      // Opportunity filter
      if (opportunityFilter !== 'all' && app.opportunity_id !== opportunityFilter) {
        return false;
      }

      // Search text (candidate name, email, phone, opportunity title, organization)
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const candName = app.full_name.toLowerCase();
      const candEmail = app.email?.toLowerCase() || '';
      const oppTitle = app.opportunities?.title?.toLowerCase() || '';
      const orgName = app.opportunities?.organization_name?.toLowerCase() || '';

      return (
        candName.includes(q) ||
        candEmail.includes(q) ||
        oppTitle.includes(q) ||
        orgName.includes(q)
      );
    });
  }, [applications, statusFilter, opportunityFilter, searchQuery]);

  return (
    <div className="admin-section-container">
      {/* Top toolbar */}
      <div className="admin-table-toolbar">
        <div>
          <h2 className="toolbar-section-title">Gestion des Candidatures</h2>
          <p className="toolbar-section-sub">
            Examinez les profils reçus et pilotez l'avancement des sélections
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          {applications.length} candidature{applications.length > 1 ? 's' : ''} au total
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="admin-filter-bar">
        <div className="admin-search-wrapper">
          <SearchIcon className="search-icon" size={17} />
          <input
            type="search"
            className="header-search-input"
            placeholder="Rechercher candidat, email ou opportunité..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="admin-select-filters">
          <select
            className="form-input select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ApplicationStatus)}
          >
            <option value="all">Tous les statuts</option>
            <option value="submitted">Envoyée</option>
            <option value="reviewing">En cours d'étude</option>
            <option value="shortlisted">Présélectionnée</option>
            <option value="accepted">Acceptée</option>
            <option value="rejected">Refusée</option>
            <option value="withdrawn">Retirée</option>
          </select>

          <select
            className="form-input select-filter"
            value={opportunityFilter}
            onChange={(e) => setOpportunityFilter(e.target.value)}
          >
            <option value="all">Toutes les offres</option>
            {opportunities.map((opp) => (
              <option key={opp.id} value={opp.id}>
                {opp.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications Table */}
      {filteredApplications.length === 0 ? (
        <div className="empty-catalog-state">
          <div className="empty-icon-circle">
            <PackageIcon size={38} />
          </div>
          <h3 className="empty-title">Aucune candidature trouvée</h3>
          <p className="empty-subtitle">
            {searchQuery || statusFilter !== 'all' || opportunityFilter !== 'all'
              ? 'Aucun dossier ne correspond aux critères de filtre sélectionnés.'
              : 'Les candidatures reçues apparaîtront dans cette table dès qu’un utilisateur aura postulé.'}
          </p>
          {(searchQuery || statusFilter !== 'all' || opportunityFilter !== 'all') && (
            <button
              type="button"
              className="btn-admin-cta"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setOpportunityFilter('all');
              }}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-courses-table">
            <thead>
              <tr>
                <th>Candidat</th>
                <th>Opportunité & Organisation</th>
                <th>Date d'envoi</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((app) => {
                const opp = app.opportunities;

                return (
                  <tr key={app.id}>
                    <td>
                      <div className="font-semibold text-slate-100">{app.full_name}</div>
                      <div className="text-xs text-slate-400">
                        {app.email || app.phone || 'Aucun contact direct'}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-200">
                        {opp?.title || 'Opportunité non spécifiée'}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <BuildingIcon size={12} />
                        <span>{opp?.organization_name || 'Organisation'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-slate-300 font-mono">
                        {formatDateTime(app.created_at)}
                      </span>
                    </td>
                    <td>
                      <span className={`app-status-badge ${getApplicationStatusBadgeClass(app.status)}`}>
                        {formatApplicationStatus(app.status)}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn-table-action"
                        onClick={() => setSelectedApplication(app)}
                        title="Consulter et faire évoluer le dossier"
                      >
                        Gérer &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin Application Detail / Status Evolution Modal */}
      {selectedApplication && (
        <AdminApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onStatusUpdated={async () => {
            await onRefresh();
            // Re-find refreshed application
            const refreshed = applications.find((a) => a.id === selectedApplication.id);
            if (refreshed) {
              setSelectedApplication(refreshed);
            }
          }}
        />
      )}
    </div>
  );
};
