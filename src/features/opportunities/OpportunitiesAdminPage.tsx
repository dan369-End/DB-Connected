import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth';
import { useNavigation } from '@/hooks/useNavigation';
import {
  fetchAdminOpportunities,
  fetchOpportunityCategories,
  fetchAdminApplications,
} from './opportunitiesService';
import { OpportunitiesAdminOverview } from './admin/OpportunitiesAdminOverview';
import { OpportunitiesManager } from './admin/OpportunitiesManager';
import { OpportunityCategoryManager } from './admin/OpportunityCategoryManager';
import { ApplicationsAdmin } from './admin/ApplicationsAdmin';
import { OpportunityFormModal } from './admin/OpportunityFormModal';
import {
  DashboardIcon,
  OpportunitiesIcon,
  CategoryIcon,
  PackageIcon,
} from '@/components/icons';
import type { Opportunity, OpportunityCategory, OpportunityApplication } from '@/types';

type AdminTab = 'overview' | 'opportunities' | 'categories' | 'applications';

export const OpportunitiesAdminPage: React.FC = () => {
  const { hasAnyRole } = useAuth();
  const { navigate } = useNavigation();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [categories, setCategories] = useState<OpportunityCategory[]>([]);
  const [applications, setApplications] = useState<OpportunityApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Direct modal trigger for creating opportunity from overview
  const [isDirectCreateOpen, setIsDirectCreateOpen] = useState(false);

  // Security gate: strictly editor or super_admin
  const isAuthorized = hasAnyRole(['editor', 'super_admin']);

  const loadAllData = useCallback(async () => {
    if (!isAuthorized) return;
    setLoading(true);

    try {
      const [oppRes, catRes, appRes] = await Promise.all([
        fetchAdminOpportunities(),
        fetchOpportunityCategories(),
        fetchAdminApplications(),
      ]);

      setOpportunities(oppRes.opportunities);
      setCategories(catRes.categories);
      setApplications(appRes.applications);
    } catch (err: unknown) {
      console.warn('[DB-Connect Opportunities Admin] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthorized]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  if (!isAuthorized) {
    return (
      <div className="admin-unauthorized-card">
        <h2 className="unauthorized-title">Accès Restreint</h2>
        <p className="unauthorized-desc">
          Cet espace d'administration est strictement réservé aux éditeurs et administrateurs DB-Connect.
        </p>
        <button
          type="button"
          className="btn-admin-cta primary"
          onClick={() => navigate('opportunities')}
        >
          Retourner au catalogue des opportunités
        </button>
      </div>
    );
  }

  const inReviewApplicationsCount = applications.filter(
    (a) => a.status === 'reviewing' || a.status === 'shortlisted'
  ).length;

  return (
    <div className="admin-page-container">
      {/* Admin Top Header Banner */}
      <div className="admin-top-header">
        <div className="admin-title-group">
          <button
            type="button"
            className="btn-back-breadcrumb"
            onClick={() => navigate('opportunities')}
          >
            &larr; Retour au catalogue public
          </button>
          <div className="admin-chip">
            <span className="chip-dot" />
            <span>Gestion des Recrutements & Partenariats</span>
          </div>
          <h1 className="admin-main-title">Administration Opportunités</h1>
          <p className="admin-main-sub">
            Gérez les offres d’emploi, les missions freelance, les catégories thématiques et le suivi des candidatures
          </p>
        </div>
      </div>

      {/* Admin Tabs Navigation */}
      <div className="admin-tabs-nav">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <DashboardIcon size={16} />
          <span>Vue d'ensemble</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'opportunities' ? 'active' : ''}`}
          onClick={() => setActiveTab('opportunities')}
        >
          <OpportunitiesIcon size={16} />
          <span>Opportunités</span>
          <span className="tab-badge">{opportunities.length}</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <CategoryIcon size={16} />
          <span>Catégories</span>
          <span className="tab-badge">{categories.length}</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          <PackageIcon size={16} />
          <span>Candidatures</span>
          <span className="tab-badge alert">{inReviewApplicationsCount || applications.length}</span>
        </button>
      </div>

      {/* Main Tab Content */}
      {loading ? (
        <div className="academy-loading-box">
          <div className="spinner large" />
          <p>Chargement des données administratives...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <OpportunitiesAdminOverview
              opportunities={opportunities}
              categories={categories}
              applications={applications}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenCreateOpportunity={() => setIsDirectCreateOpen(true)}
            />
          )}

          {activeTab === 'opportunities' && (
            <OpportunitiesManager
              opportunities={opportunities}
              categories={categories}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'categories' && (
            <OpportunityCategoryManager
              categories={categories}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'applications' && (
            <ApplicationsAdmin
              applications={applications}
              opportunities={opportunities}
              onRefresh={loadAllData}
            />
          )}
        </>
      )}

      {/* Direct Create Opportunity Modal from Overview */}
      {isDirectCreateOpen && (
        <OpportunityFormModal
          opportunity={null}
          categories={categories}
          onClose={() => setIsDirectCreateOpen(false)}
          onSuccess={async () => {
            setIsDirectCreateOpen(false);
            await loadAllData();
            setActiveTab('opportunities');
          }}
        />
      )}
    </div>
  );
};
