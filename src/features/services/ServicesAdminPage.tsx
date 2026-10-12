import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth';
import { useNavigation } from '@/hooks/useNavigation';
import {
  fetchAdminServices,
  fetchServiceCategories,
  fetchAdminServiceRequests,
} from './servicesService';
import { ServicesAdminOverview } from './admin/ServicesAdminOverview';
import { ServicesManager } from './admin/ServicesManager';
import { ServicesCategoryManager } from './admin/ServicesCategoryManager';
import { ServiceRequestsAdmin } from './admin/ServiceRequestsAdmin';
import {
  DashboardIcon,
  ServicesIcon,
  CategoryIcon,
  PackageIcon,
} from '@/components/icons';
import type { ServiceRecord, ServiceCategory, ServiceRequestRecord } from '@/types';

type AdminTab = 'overview' | 'services' | 'categories' | 'requests';

export const ServicesAdminPage: React.FC = () => {
  const { hasAnyRole } = useAuth();
  const { navigate } = useNavigation();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [requests, setRequests] = useState<ServiceRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Strict check: only services_admin or super_admin
  const isAuthorized = hasAnyRole(['services_admin', 'super_admin']);

  const loadAllData = useCallback(async () => {
    if (!isAuthorized) return;
    setLoading(true);

    try {
      const [srvRes, catRes, reqRes] = await Promise.all([
        fetchAdminServices(),
        fetchServiceCategories(),
        fetchAdminServiceRequests(),
      ]);

      setServices(srvRes.services);
      setCategories(catRes.categories);
      setRequests(reqRes.requests);
    } catch (err: unknown) {
      console.warn('[DB-Connect Services Admin] Load error:', err);
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
          Cet espace d'administration est strictement réservé aux gestionnaires de services et administrateurs DB-Connect.
        </p>
        <button
          type="button"
          className="btn-admin-cta primary"
          onClick={() => navigate('services')}
        >
          Retourner au catalogue des services
        </button>
      </div>
    );
  }

  const pendingRequestsCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="admin-page-container">
      {/* Admin Top Header Banner */}
      <div className="admin-top-header">
        <div className="admin-title-group">
          <button
            type="button"
            className="btn-back-breadcrumb"
            onClick={() => navigate('services')}
          >
            &larr; Retour au catalogue public
          </button>
          <div className="admin-chip">
            <span className="chip-dot" />
            <span>Gestion des Prestations</span>
          </div>
          <h1 className="admin-main-title">Administration Services</h1>
          <p className="admin-main-sub">
            Gérez les offres de prestations, les catégories professionnelles et le suivi des demandes clients
          </p>
        </div>
      </div>

      {/* Internal Admin Navigation Tabs */}
      <div className="admin-nav-tabs-wrapper">
        <div className="admin-nav-tabs">
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
            className={`admin-tab-btn ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <ServicesIcon size={16} />
            <span>Services ({services.length})</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <CategoryIcon size={16} />
            <span>Catégories ({categories.length})</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <PackageIcon size={16} />
            <span>Demandes ({requests.length})</span>
            {pendingRequestsCount > 0 && (
              <span className="tab-counter-badge">{pendingRequestsCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Active Tab View */}
      <div className="admin-tab-content">
        {loading ? (
          <div className="academy-loading-box">
            <div className="spinner large" />
            <p>Chargement des données administratives...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <ServicesAdminOverview
                services={services}
                categories={categories}
                requests={requests}
                onNavigateTab={(t) => setActiveTab(t)}
              />
            )}

            {activeTab === 'services' && (
              <ServicesManager
                services={services}
                categories={categories}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'categories' && (
              <ServicesCategoryManager
                categories={categories}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'requests' && (
              <ServiceRequestsAdmin
                requests={requests}
                onRefresh={loadAllData}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
