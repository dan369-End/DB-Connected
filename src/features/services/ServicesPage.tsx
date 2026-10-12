import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/features/auth';
import { useNavigation } from '@/hooks/useNavigation';
import { fetchPublishedServices, fetchServiceCategories } from './servicesService';
import { ServiceCard } from './components/ServiceCard';
import {
  ServicesIcon,
  SearchIcon,
  PackageIcon,
  DashboardIcon,
} from '@/components/icons';
import type { ServiceRecord, ServiceCategory } from '@/types';

export const ServicesPage: React.FC = () => {
  const { hasAnyRole } = useAuth();
  const { navigate } = useNavigation();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Authority check for discrete admin access link: services_admin or super_admin
  const canAccessAdmin = hasAnyRole(['services_admin', 'super_admin']);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Fetch categories
      const { categories: cats, error: catErr } = await fetchServiceCategories();
      if (catErr) {
        console.warn('[DB-Connect Services] Category note:', catErr);
      }
      setCategories(cats);

      // 2. Fetch published services
      const { services: servs, error: servErr } = await fetchPublishedServices();
      if (servErr) {
        setErrorMessage('Impossible de charger les prestations pour le moment.');
      } else {
        setServices(servs);
      }
    } catch (err: unknown) {
      setErrorMessage('Une erreur inattendue est survenue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side filtering: by category and text search
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesCategory =
        selectedCategoryId === 'all' ||
        s.category_id === selectedCategoryId ||
        s.services_categories?.id === selectedCategoryId;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        (s.short_description && s.short_description.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [services, selectedCategoryId, searchQuery]);

  const handleViewService = (serviceId: string) => {
    navigate('services_detail', { serviceId });
  };

  return (
    <div className="marketplace-page-container">
      {/* Top Banner */}
      <div className="marketplace-header-banner">
        <div className="marketplace-title-group">
          <div className="marketplace-chip">
            <span className="chip-dot" />
            <span>Prestations & Solutions Professionnelles</span>
          </div>
          <h1 className="marketplace-title">Services</h1>
          <p className="marketplace-tagline">
            Découvrez les services proposés sur DB-Connect
          </p>
        </div>

        {/* User Navigation Cluster: "Mes demandes" + discrete "Administration Services" */}
        <div className="marketplace-actions-cluster">
          <button
            type="button"
            className="btn-orders-shortcut"
            onClick={() => navigate('services_requests')}
            title="Consulter l'historique de mes demandes"
          >
            <PackageIcon size={16} />
            <span>Mes demandes</span>
          </button>

          {canAccessAdmin && (
            <button
              type="button"
              className="btn-admin-access"
              onClick={() => navigate('services_admin')}
              title="Accès back-office de gestion des prestations"
            >
              <DashboardIcon size={16} />
              <span>Administration Services</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="marketplace-toolbar">
        <div className="marketplace-search-box">
          <SearchIcon className="search-icon" size={18} />
          <input
            type="search"
            className="header-search-input"
            placeholder="Rechercher un service par titre ou mots-clés..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="marketplace-categories-scroll">
          <button
            type="button"
            className={`category-pill ${selectedCategoryId === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategoryId('all')}
          >
            Toutes les catégories
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-pill ${selectedCategoryId === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategoryId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {errorMessage && (
        <div className="auth-alert alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="academy-loading-box">
          <div className="spinner large" />
          <p>Chargement des services en cours...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="empty-catalog-state">
          <div className="empty-icon-circle">
            <ServicesIcon size={38} />
          </div>
          <h3 className="empty-title">Aucun service trouvé</h3>
          <p className="empty-subtitle">
            {searchQuery || selectedCategoryId !== 'all'
              ? 'Aucune prestation ne correspond à vos critères de recherche.'
              : 'Les prestations de services seront disponibles prochainement.'}
          </p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onView={handleViewService}
            />
          ))}
        </div>
      )}
    </div>
  );
};
