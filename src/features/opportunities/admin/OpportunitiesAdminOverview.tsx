import React from 'react';
import type { Opportunity, OpportunityCategory, OpportunityApplication } from '@/types';
import {
  OpportunitiesIcon,
  CategoryIcon,
  PackageIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
} from '@/components/icons';

interface OpportunitiesAdminOverviewProps {
  opportunities: Opportunity[];
  categories: OpportunityCategory[];
  applications: OpportunityApplication[];
  onNavigateTab: (tab: 'opportunities' | 'categories' | 'applications') => void;
  onOpenCreateOpportunity: () => void;
}

export const OpportunitiesAdminOverview: React.FC<OpportunitiesAdminOverviewProps> = ({
  opportunities,
  categories,
  applications,
  onNavigateTab,
  onOpenCreateOpportunity,
}) => {
  // Real database stats
  const totalOpportunities = opportunities.length;
  const publishedCount = opportunities.filter((o) => o.status === 'published').length;
  const draftCount = opportunities.filter((o) => o.status === 'draft').length;
  const archivedCount = opportunities.filter((o) => o.status === 'archived').length;
  const totalCategories = categories.length;

  const totalApplications = applications.length;
  const inReviewApplications = applications.filter(
    (a) => a.status === 'reviewing' || a.status === 'shortlisted'
  ).length;
  const submittedCount = applications.filter((a) => a.status === 'submitted').length;
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length;

  return (
    <div className="admin-overview-container">
      {/* Quick Action Top Bar */}
      <div className="overview-hero-bar">
        <div>
          <h2 className="overview-hero-title">Tableau de bord — Opportunités</h2>
          <p className="overview-hero-sub">
            Indicateurs consolidés sur les offres publiées, les candidatures reçues et la gestion éditoriale.
          </p>
        </div>
        <div className="overview-actions-row">
          <button
            type="button"
            className="btn-admin-cta primary"
            onClick={onOpenCreateOpportunity}
          >
            <PlusIcon size={16} />
            <span>Nouvelle opportunité</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="overview-stats-grid">
        {/* Total Opportunities Card */}
        <div
          className="stat-card clickable"
          onClick={() => onNavigateTab('opportunities')}
          role="button"
          tabIndex={0}
        >
          <div className="stat-card-header">
            <span className="stat-label">Total Opportunités</span>
            <div className="stat-icon-wrapper accent">
              <OpportunitiesIcon size={20} />
            </div>
          </div>
          <div className="stat-value font-mono">{totalOpportunities}</div>
          <div className="stat-footer-tags">
            <span className="mini-tag green">{publishedCount} publiées</span>
            <span className="mini-tag amber">{draftCount} brouillons</span>
            <span className="mini-tag slate">{archivedCount} archivées</span>
          </div>
        </div>

        {/* Categories Card */}
        <div
          className="stat-card clickable"
          onClick={() => onNavigateTab('categories')}
          role="button"
          tabIndex={0}
        >
          <div className="stat-card-header">
            <span className="stat-label">Catégories actives</span>
            <div className="stat-icon-wrapper purple">
              <CategoryIcon size={20} />
            </div>
          </div>
          <div className="stat-value font-mono">{totalCategories}</div>
          <p className="stat-subtext">Thématiques de recrutement & partenariats</p>
        </div>

        {/* Applications Received Card */}
        <div
          className="stat-card clickable"
          onClick={() => onNavigateTab('applications')}
          role="button"
          tabIndex={0}
        >
          <div className="stat-card-header">
            <span className="stat-label">Candidatures reçues</span>
            <div className="stat-icon-wrapper cyan">
              <PackageIcon size={20} />
            </div>
          </div>
          <div className="stat-value font-mono">{totalApplications}</div>
          <div className="stat-footer-tags">
            <span className="mini-tag blue">{submittedCount} nouvelles</span>
            <span className="mini-tag green">{acceptedCount} acceptées</span>
          </div>
        </div>

        {/* In Review Card */}
        <div
          className="stat-card clickable"
          onClick={() => onNavigateTab('applications')}
          role="button"
          tabIndex={0}
        >
          <div className="stat-card-header">
            <span className="stat-label">En cours d'étude</span>
            <div className="stat-icon-wrapper amber">
              <ClockIcon size={20} />
            </div>
          </div>
          <div className="stat-value font-mono">{inReviewApplications}</div>
          <p className="stat-subtext">Candidatures à l'étude ou présélectionnées</p>
        </div>
      </div>

      {/* Recent Opportunities & Applications Preview Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Opportunities */}
        <div className="admin-content-card">
          <div className="admin-card-header flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <OpportunitiesIcon size={18} className="text-cyan-400" />
              <span>Dernières opportunités créées</span>
            </h3>
            <button
              type="button"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              onClick={() => onNavigateTab('opportunities')}
            >
              Gérer tout &rarr;
            </button>
          </div>

          {opportunities.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Aucune opportunité créée pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {opportunities.slice(0, 4).map((opp) => (
                <div
                  key={opp.id}
                  className="p-3 bg-slate-900/60 rounded border border-slate-800 flex items-center justify-between"
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-sm font-semibold text-slate-200 truncate">{opp.title}</div>
                    <div className="text-xs text-slate-400">{opp.organization_name}</div>
                  </div>
                  <span className={`status-badge status-${opp.status} text-[10px]`}>
                    {opp.status === 'published' ? 'Publiée' : opp.status === 'draft' ? 'Brouillon' : 'Archivée'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="admin-content-card">
          <div className="admin-card-header flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <PackageIcon size={18} className="text-emerald-400" />
              <span>Dernières candidatures reçues</span>
            </h3>
            <button
              type="button"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              onClick={() => onNavigateTab('applications')}
            >
              Voir tout &rarr;
            </button>
          </div>

          {applications.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Aucune candidature reçue pour l'instant.</p>
          ) : (
            <div className="space-y-2">
              {applications.slice(0, 4).map((app) => (
                <div
                  key={app.id}
                  className="p-3 bg-slate-900/60 rounded border border-slate-800 flex items-center justify-between"
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-sm font-semibold text-slate-200 truncate">{app.full_name}</div>
                    <div className="text-xs text-slate-400 truncate">
                      {app.opportunities?.title || 'Opportunité'}
                    </div>
                  </div>
                  <span className="text-xs text-slate-300 font-mono">
                    {app.status === 'submitted'
                      ? 'Envoyée'
                      : app.status === 'reviewing'
                      ? 'En étude'
                      : app.status === 'shortlisted'
                      ? 'Sélection'
                      : app.status === 'accepted'
                      ? 'Acceptée'
                      : app.status === 'rejected'
                      ? 'Refusée'
                      : 'Retirée'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
