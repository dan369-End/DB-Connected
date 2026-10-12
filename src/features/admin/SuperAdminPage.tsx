import React, { useState, useEffect, useCallback } from 'react';
import { RoleGuard } from '@/features/auth';
import { useNavigation } from '@/hooks/useNavigation';
import {
  listUsers,
  getGlobalAdminStats,
} from './adminService';
import { OverviewTab } from './components/OverviewTab';
import { UsersTab } from './components/UsersTab';
import { AcademySummaryTab } from './components/AcademySummaryTab';
import { MarketplaceSummaryTab } from './components/MarketplaceSummaryTab';
import { ServicesSummaryTab } from './components/ServicesSummaryTab';
import { OpportunitiesSummaryTab } from './components/OpportunitiesSummaryTab';
import { RequestsSummaryTab } from './components/RequestsSummaryTab';
import type { AdminUserRecord, AdminGlobalStats } from '@/types';

type AdminTab =
  | 'overview'
  | 'users'
  | 'academy'
  | 'marketplace'
  | 'services'
  | 'opportunities'
  | 'requests';

export const SuperAdminPage: React.FC = () => {
  const { navigate } = useNavigation();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [stats, setStats] = useState<AdminGlobalStats>({
    users: { total: 0, superAdmins: 0, moduleAdmins: 0, standardUsers: 0 },
    academy: { totalCourses: 0, publishedCourses: 0, draftCourses: 0, totalEnrollments: 0 },
    marketplace: { totalProducts: 0, publishedProducts: 0, pendingOrders: 0, deliveredOrders: 0, totalOrders: 0 },
    services: { totalServices: 0, publishedServices: 0, pendingRequests: 0, totalRequests: 0 },
    opportunities: { totalOpportunities: 0, publishedOpportunities: 0, totalApplications: 0 },
    requests: { totalRequests: 0, newRequests: 0, inReviewRequests: 0, quotedRequests: 0, closedRequests: 0 },
  });

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  const fetchUsersData = useCallback(async () => {
    setLoadingUsers(true);
    setUsersError(null);
    const res = await listUsers();
    if (res.error) {
      setUsersError(res.error);
    } else {
      setUsers(res.users);
    }
    setLoadingUsers(false);
  }, []);

  const fetchStatsData = useCallback(async () => {
    setLoadingStats(true);
    const res = await getGlobalAdminStats();
    if (!res.error) {
      setStats(res.stats);
    }
    setLoadingStats(false);
  }, []);

  const loadAll = useCallback(() => {
    fetchUsersData();
    fetchStatsData();
  }, [fetchUsersData, fetchStatsData]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const tabs: Array<{ id: AdminTab; label: string; count?: number }> = [
    { id: 'overview', label: "Vue d'ensemble" },
    { id: 'users', label: 'Utilisateurs', count: users.length },
    { id: 'academy', label: 'Académie' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'services', label: 'Services' },
    { id: 'opportunities', label: 'Opportunités' },
    { id: 'requests', label: 'Messages & Devis' },
  ];

  return (
    <RoleGuard
      allowedRoles={['super_admin']}
      fallback={
        <div className="module-page-container">
          <div
            className="academy-error-box"
            style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}
          >
            <h3 className="empty-title">Accès réservé au Super Administrateur</h3>
            <p style={{ marginTop: '0.75rem', color: 'var(--color-text-muted)' }}>
              Cette interface globale est strictement réservée au rôle <code>super_admin</code> de DB-Connect. Votre compte ne dispose pas de ces privilèges de gouvernance.
            </p>
            <button
              type="button"
              className="btn-back-catalog"
              style={{ marginTop: '1.5rem' }}
              onClick={() => navigate('home')}
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      }
    >
      <div className="admin-page-container">
        {/* Top Header */}
        <div className="admin-header-strip">
          <div className="admin-title-group">
            <div className="admin-breadcrumb-line">
              <button
                type="button"
                className="btn-back-breadcrumb"
                onClick={() => navigate('home')}
              >
                &larr; Accueil
              </button>
              <span className="crumb-sep">/</span>
              <span className="crumb-current">Administration Globale</span>
            </div>
            <h1 className="admin-main-title">Administration Globale</h1>
            <p className="admin-subline">
              Supervision centralisée de DB-Connect, gouvernance transverse et gestion des accès RBAC
            </p>
          </div>
        </div>

        {/* Subnav Tabs */}
        <div className="admin-subnav-tabs" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`admin-nav-tab ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{ whiteSpace: 'nowrap' }}
              >
                {tab.label}
                {tab.count !== undefined && !loadingUsers && (
                  <span
                    style={{
                      marginLeft: '0.45rem',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      backgroundColor: isActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                      color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div style={{ marginTop: '0.5rem' }}>
          {activeTab === 'overview' && (
            <OverviewTab
              stats={stats}
              loading={loadingStats}
              onNavigateTab={(tab) => setActiveTab(tab as AdminTab)}
            />
          )}

          {activeTab === 'users' && (
            <UsersTab
              users={users}
              loading={loadingUsers}
              error={usersError}
              onRefresh={() => {
                fetchUsersData();
                fetchStatsData();
              }}
            />
          )}

          {activeTab === 'academy' && <AcademySummaryTab stats={stats} />}

          {activeTab === 'marketplace' && <MarketplaceSummaryTab stats={stats} />}

          {activeTab === 'services' && <ServicesSummaryTab stats={stats} />}

          {activeTab === 'opportunities' && <OpportunitiesSummaryTab stats={stats} />}

          {activeTab === 'requests' && <RequestsSummaryTab stats={stats} />}
        </div>
      </div>
    </RoleGuard>
  );
};
