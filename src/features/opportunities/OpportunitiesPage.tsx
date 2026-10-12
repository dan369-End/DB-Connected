import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/features/auth';
import { useNavigation } from '@/hooks/useNavigation';
import {
  fetchPublishedOpportunities,
  fetchOpportunityCategories,
} from './opportunitiesService';
import { OpportunityCard } from './components/OpportunityCard';
import {
  OpportunitiesIcon,
  SearchIcon,
  DashboardIcon,
  PackageIcon,
  LocationIcon,
} from '@/components/icons';
import type { Opportunity, OpportunityCategory } from '@/types';

export const OpportunitiesPage: React.FC = () => {
  const { hasAnyRole } = useAuth();
  const { navigate } = useNavigation();

  const [categories, setCategories] = useState<OpportunityCategory[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Administrative check: editor or super_admin
  const canAccessAdmin = hasAnyRole(['editor', 'super_admin']);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [catsRes, oppsRes] = await Promise.all([
        fetchOpportunityCategories(),
        fetchPublishedOpportunities(),
      ]);

      if (catsRes.error) {
        console.warn('[DB-Connect Opportunities] Category note:', catsRes.error);
      }
      setCategories(catsRes.categories);

      if (oppsRes.error) {
        setErrorMessage('Impossible de charger les opportunités pour le moment.');
      } else {
        setOpportunities(oppsRes.opportunities);
      }
    } catch {
      setErrorMessage('Une erreur inattendue est survenue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract distinct locations from loaded opportunities
  const availableLocations = useMemo(() => {
    const locSet = new Set<string>();
    opportunities.forEach((o) => {
      if (o.location && o.location.trim().length > 0) {
        locSet.add(o.location.trim());
      }
    });
    return Array.from(locSet).sort();
  }, [opportunities]);

  // Client-side filtering: category, location, and search text
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((o) => {
      // Category match
      const matchesCategory =
        selectedCategoryId === 'all' ||
        String(o.category_id) === String(selectedCategoryId) ||
        (o.opportunity_categories?.id != null &&
          String(o.opportunity_categories.id) === String(selectedCategoryId));

      // Location match
      const matchesLocation =
        selectedLocation === 'all' ||
        (o.location && o.location.toLowerCase() === selectedLocation.toLowerCase());

      // Search match (title, organization, description, location)
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.title.toLowerCase().includes(q) ||
        o.organization_name.toLowerCase().includes(q) ||
        (o.short_description && o.short_description.toLowerCase().includes(q)) ||
        (o.description && o.description.toLowerCase().includes(q)) ||
        (o.location && o.location.toLowerCase().includes(q));

      return matchesCategory && matchesLocation && matchesSearch;
    });
  }, [opportunities, selectedCategoryId, selectedLocation, searchQuery]);

  const handleViewOpportunity = (opportunityId: string) => {
    navigate('opportunities_detail', { opportunityId });
  };

  return (
    <div className="marketplace-page-container">
      {/* Top Banner Header */}
      <div className="marketplace-header-banner">
        <div className="marketplace-title-group">
          <div className="marketplace-chip">
            <span className="chip-dot" />
            <span>Emploi, Missions & Partenariats</span>
          </div>
          <h1 className="marketplace-title">Opportunités</h1>
          <p className="marketplace-tagline">
            Découvrez les opportunités disponibles sur DB-Connect
          </p>
        </div>

        {/* User Navigation Cluster: "Mes candidatures" + discrete "Administration Opportunités" */}
        <div className="marketplace-actions-cluster">
          <button
            type="button"
            className="btn-orders-shortcut"
            onClick={() => navigate('opportunities_applications')}
            title="Consulter l'historique de mes candidatures"
          >
            <PackageIcon size={16} />
            <span>Mes candidatures</span>
          </button>

          {canAccessAdmin && (
            <button
              type="button"
              className="btn-admin-access"
              onClick={() => navigate('opportunities_admin')}
              title="Accès back-office de gestion des opportunités"
            >
              <DashboardIcon size={16} />
              <span>Administration Opportunités</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="marketplace-toolbar">
        <div className="marketplace-search-box">
          <SearchIcon className="search-icon" size={18} />
          <input
            type="search"
            className="header-search-input"
            placeholder="Rechercher par titre, organisation ou mot-clé..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Location Dropdown Filter if locations exist */}
        {availableLocations.length > 0 && (
          <div className="location-filter-wrapper">
            <LocationIcon size={15} className="location-filter-icon" />
            <select
              className="form-input location-select"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="all">Toutes les localisations</option>
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Categories Pills */}
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
              key={String(cat.id)}
              type="button"
              className={`category-pill ${selectedCategoryId === String(cat.id) ? 'active' : ''}`}
              onClick={() => setSelectedCategoryId(String(cat.id))}
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
          <p>Chargement des opportunités disponibles...</p>
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="empty-catalog-state">
          <div className="empty-icon-circle">
            <OpportunitiesIcon size={38} />
          </div>
          <h3 className="empty-title">Aucune opportunité trouvée</h3>
          <p className="empty-subtitle">
            {searchQuery || selectedCategoryId !== 'all' || selectedLocation !== 'all'
              ? 'Aucune offre ne correspond à vos critères de recherche actuels.'
              : 'De nouvelles opportunités seront publiées prochainement sur DB-Connect.'}
          </p>
          {(searchQuery || selectedCategoryId !== 'all' || selectedLocation !== 'all') && (
            <button
              type="button"
              className="btn-admin-cta"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategoryId('all');
                setSelectedLocation('all');
              }}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="opportunities-grid">
          {filteredOpportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              onView={handleViewOpportunity}
            />
          ))}
        </div>
      )}
    </div>
  );
};
