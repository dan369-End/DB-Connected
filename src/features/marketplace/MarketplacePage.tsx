import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { useNavigation } from '@/hooks/useNavigation';
import { ProductCard } from './components/ProductCard';
import { CartIndicatorButton } from './components/CartIndicatorButton';
import { SearchIcon, MarketplaceIcon, PackageIcon } from '@/components/icons';
import type { MarketplaceProduct, MarketplaceCategory } from '@/types';

export const MarketplacePage: React.FC = () => {
  const { hasAnyRole } = useAuth();
  const { navigate } = useNavigation();

  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Authority check for discrete admin access link
  const canAccessAdmin = hasAnyRole(['marketplace_admin', 'super_admin']);

  const fetchMarketplaceData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Fetch categories
      const { data: catData, error: catError } = await supabase
        .from('marketplace_categories')
        .select('*')
        .order('name', { ascending: true });

      if (catError) {
        console.warn('[DB-Connect Marketplace] Error loading categories:', catError.message);
      } else {
        setCategories((catData as MarketplaceCategory[]) || []);
      }

      // 2. Fetch products accessible by current user (RLS will filter to published unless admin)
      const { data: prodData, error: prodError } = await supabase
        .from('marketplace_products')
        .select(`
          *,
          marketplace_categories ( id, name )
        `)
        .order('created_at', { ascending: false });

      if (prodError) {
        console.warn('[DB-Connect Marketplace] Error loading products:', prodError.message);
        setErrorMessage("Impossible de charger le catalogue de produits pour le moment.");
      } else {
        setProducts((prodData as MarketplaceProduct[]) || []);
      }
    } catch (err) {
      console.warn('[DB-Connect Marketplace] Unexpected fetch error:', err);
      setErrorMessage("Une erreur de communication est survenue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketplaceData();
  }, [fetchMarketplaceData]);

  // Client-side search and category filtering
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesCategory =
        selectedCategoryId === 'all' ||
        prod.category_id === selectedCategoryId ||
        prod.marketplace_categories?.id === selectedCategoryId;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        (prod.short_description && prod.short_description.toLowerCase().includes(q)) ||
        (prod.description && prod.description.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);

  const handleViewProduct = (productId: string) => {
    navigate('marketplace_product', { productId });
  };

  return (
    <div className="marketplace-page-container">
      {/* Top Banner */}
      <div className="marketplace-header-banner">
        <div className="marketplace-title-group">
          <div className="marketplace-chip">
            <span className="chip-dot" />
            <span>Solutions & Équipements Numériques</span>
          </div>
          <h1 className="marketplace-title">Marketplace</h1>
          <p className="marketplace-tagline">
            « Découvrez les produits disponibles sur DB-Connect »
          </p>
        </div>

        {/* User Navigation Cluster: Cart button + Orders + Admin button */}
        <div className="marketplace-actions-cluster">
          <button
            type="button"
            className="btn-my-orders-link"
            onClick={() => navigate('marketplace_orders')}
            title="Consulter mes commandes"
          >
            <PackageIcon size={17} />
            <span>Mes commandes</span>
          </button>

          <CartIndicatorButton />

          {/* Discrete Admin Link if user is marketplace_admin or super_admin */}
          {canAccessAdmin && (
            <button
              type="button"
              className="btn-admin-access marketplace-admin-btn"
              onClick={() => navigate('marketplace_admin')}
              title="Accès réservé aux administrateurs du marketplace"
            >
              Administration Marketplace &rarr;
            </button>
          )}
        </div>
      </div>

      {/* Toolbar: Search and Categories */}
      <div className="marketplace-toolbar">
        <div className="marketplace-search-box">
          <SearchIcon className="search-icon" size={17} />
          <input
            type="search"
            className="marketplace-search-input"
            placeholder="Rechercher un produit par nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Rechercher un produit"
          />
        </div>

        <div className="marketplace-categories-scroll">
          <button
            type="button"
            className={`cat-pill ${selectedCategoryId === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategoryId('all')}
          >
            Toutes les catégories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`cat-pill ${selectedCategoryId === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategoryId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Loading, Error or Product Grid */}
      {loading ? (
        <div className="academy-loading-box">
          <div className="spinner large"></div>
          <p>Chargement des produits du Marketplace...</p>
        </div>
      ) : errorMessage ? (
        <div className="academy-error-box">
          <p>{errorMessage}</p>
          <button
            type="button"
            className="btn-retry-action"
            onClick={fetchMarketplaceData}
          >
            Réessayer
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-catalog-state">
          <div className="empty-icon-circle">
            <MarketplaceIcon size={38} />
          </div>
          <h3 className="empty-title">Aucun produit disponible pour le moment.</h3>
          <p className="empty-subtitle">
            {searchQuery || selectedCategoryId !== 'all'
              ? 'Aucun produit ne correspond à vos filtres de recherche.'
              : 'Les premiers produits et solutions DB-Connect seront référencés sous peu.'}
          </p>
          {(searchQuery || selectedCategoryId !== 'all') && (
            <button
              type="button"
              className="btn-reset-filters"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategoryId('all');
              }}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onView={handleViewProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
};
