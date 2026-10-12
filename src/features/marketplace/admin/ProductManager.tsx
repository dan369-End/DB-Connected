import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { ProductForm } from './ProductForm';
import { formatProductPrice, getStockStatus } from '../utils';
import { getMarketplaceImageUrl, deleteMarketplaceStorageImage } from '../utils/imageStorage';
import { SearchIcon, MarketplaceIcon } from '@/components/icons';
import type { MarketplaceProduct, MarketplaceCategory, ProductStatus } from '@/types';

interface ProductManagerProps {
  products: MarketplaceProduct[];
  categories: MarketplaceCategory[];
  loading: boolean;
  onRefresh: () => void;
}

// Micro-component for table thumbnail with signed URL resolution
const TableProductThumbnail: React.FC<{ imagePath?: string | null; name: string }> = ({
  imagePath,
  name,
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    if (imagePath) {
      getMarketplaceImageUrl(imagePath).then((url) => {
        if (!isCancelled) setResolvedUrl(url);
      });
    } else {
      setResolvedUrl(null);
    }
    return () => {
      isCancelled = true;
    };
  }, [imagePath]);

  if (resolvedUrl) {
    return (
      <img
        src={resolvedUrl}
        alt={name}
        className="table-course-thumb"
        onError={() => setResolvedUrl(null)}
      />
    );
  }

  return (
    <div className="table-course-thumb placeholder">
      <MarketplaceIcon size={18} />
    </div>
  );
};

export const ProductManager: React.FC<ProductManagerProps> = ({
  products,
  categories,
  loading,
  onRefresh,
}) => {
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Deleting / Status action loading
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtered list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesCat =
        categoryFilter === 'all' ||
        p.category_id === categoryFilter ||
        p.marketplace_categories?.id === categoryFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.short_description && p.short_description.toLowerCase().includes(q)) ||
        (p.slug && p.slug.toLowerCase().includes(q));

      return matchesStatus && matchesCat && matchesSearch;
    });
  }, [products, statusFilter, categoryFilter, searchQuery]);

  // Status updates: publish / draft / archive
  const handleUpdateStatus = async (productId: string, newStatus: ProductStatus) => {
    if (!supabase) return;
    setActionLoadingId(productId);
    setActionMessage(null);
    setErrorMessage(null);

    try {
      const { error } = await supabase
        .from('marketplace_products')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (error) {
        setErrorMessage('Impossible de mettre à jour le statut du produit.');
      } else {
        setActionMessage(
          newStatus === 'published'
            ? 'Produit publié avec succès sur le Marketplace.'
            : newStatus === 'archived'
            ? 'Produit archivé.'
            : 'Produit remis en brouillon.'
        );
        onRefresh();
      }
    } catch (err) {
      console.warn('[DB-Connect Marketplace] Update status error:', err);
      setErrorMessage('Une erreur inattendue est survenue.');
    } finally {
      setActionLoadingId(null);
    }
  };

  /**
   * Delete product:
   * Try to delete associated storage image first to avoid orphan files
   */
  const handleDeleteProduct = async (product: MarketplaceProduct) => {
    if (!supabase) return;
    const ok = window.confirm(
      `Confirmez-vous la suppression définitive du produit « ${product.name} » ?`
    );
    if (!ok) return;

    setActionLoadingId(product.id);
    setErrorMessage(null);

    try {
      // 1. If product has a storage image, remove it from bucket
      if (product.image_url) {
        await deleteMarketplaceStorageImage(product.image_url);
      }

      // 2. Delete product from database
      const { error } = await supabase
        .from('marketplace_products')
        .delete()
        .eq('id', product.id);

      if (error) {
        setErrorMessage('Impossible de supprimer le produit.');
      } else {
        setActionMessage('Produit supprimé avec succès.');
        onRefresh();
      }
    } catch (err) {
      console.warn('[DB-Connect Marketplace] Delete product error:', err);
      setErrorMessage('Erreur lors de la suppression.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (mode === 'create') {
    return (
      <ProductForm
        categories={categories}
        onSaveSuccess={() => {
          onRefresh();
          setMode('list');
        }}
        onCancel={() => setMode('list')}
      />
    );
  }

  if (mode === 'edit' && selectedProduct) {
    return (
      <ProductForm
        product={selectedProduct}
        categories={categories}
        onSaveSuccess={() => {
          onRefresh();
          setMode('list');
          setSelectedProduct(null);
        }}
        onCancel={() => {
          setMode('list');
          setSelectedProduct(null);
        }}
      />
    );
  }

  return (
    <div className="admin-courses-view">
      {/* Toolbar */}
      <div className="admin-table-toolbar">
        <div>
          <h2 className="toolbar-section-title">Catalogue des Produits</h2>
          <p className="toolbar-section-sub">
            Gérez les stocks, les tarifs en FCFA et les statuts de publication
          </p>
        </div>
        <button
          type="button"
          className="btn-admin-cta primary"
          onClick={() => {
            setSelectedProduct(null);
            setMode('create');
          }}
        >
          + Nouveau produit
        </button>
      </div>

      {actionMessage && (
        <div className="auth-alert alert-success" role="status">
          {actionMessage}
        </div>
      )}

      {errorMessage && (
        <div className="auth-alert alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Filter and search bar */}
      <div className="admin-filter-bar">
        <div className="admin-search-wrapper">
          <SearchIcon className="search-icon" size={17} />
          <input
            type="search"
            className="header-search-input"
            placeholder="Rechercher par nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="admin-select-filters">
          <select
            className="form-input select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ProductStatus)}
          >
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
            <option value="archived">Archivé</option>
          </select>

          <select
            className="form-input select-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="academy-loading-box">
          <div className="spinner large"></div>
          <p>Chargement des produits...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-catalog-state">
          <div className="empty-icon-circle">
            <MarketplaceIcon size={38} />
          </div>
          <h3 className="empty-title">Aucun produit trouvé</h3>
          <p className="empty-subtitle">
            {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Aucun produit ne correspond aux filtres sélectionnés.'
              : 'Aucun produit créé dans le marketplace.'}
          </p>
          <button
            type="button"
            className="btn-admin-cta primary"
            onClick={() => {
              setSelectedProduct(null);
              setMode('create');
            }}
          >
            Créer un produit
          </button>
        </div>
      ) : (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const categoryName = p.marketplace_categories?.name || p.category?.name || '—';
                const stock = getStockStatus(p.stock_quantity);
                const priceFormatted = formatProductPrice(p.price, p.currency || 'XAF');
                const isWorking = actionLoadingId === p.id;

                return (
                  <tr key={p.id}>
                    <td>
                      <div className="table-course-cell">
                        <TableProductThumbnail imagePath={p.image_url} name={p.name} />
                        <div className="table-course-info">
                          <span className="table-course-title">{p.name}</span>
                          {p.slug && <span className="table-course-slug">{p.slug}</span>}
                        </div>
                      </div>
                    </td>

                    <td className="text-muted">{categoryName}</td>

                    <td className="font-semibold text-main">{priceFormatted}</td>

                    <td>
                      <span className={`product-stock-chip stock-${stock.statusClass}`}>
                        {stock.label} ({p.stock_quantity ?? 0})
                      </span>
                    </td>

                    <td>
                      <span className={`status-badge status-${p.status || 'draft'}`}>
                        {p.status === 'published'
                          ? 'Publié'
                          : p.status === 'archived'
                          ? 'Archivé'
                          : 'Brouillon'}
                      </span>
                    </td>

                    <td className="text-right">
                      <div className="table-actions-group">
                        <button
                          type="button"
                          className="btn-table-action edit"
                          onClick={() => {
                            setSelectedProduct(p);
                            setMode('edit');
                          }}
                        >
                          Modifier
                        </button>

                        {/* Quick publish / draft button */}
                        {p.status === 'published' ? (
                          <button
                            type="button"
                            className="btn-table-action draft"
                            onClick={() => handleUpdateStatus(p.id, 'draft')}
                            disabled={isWorking}
                            title="Remettre en brouillon"
                          >
                            Brouillon
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-table-action publish"
                            onClick={() => handleUpdateStatus(p.id, 'published')}
                            disabled={isWorking}
                            title="Publier sur le catalogue"
                          >
                            Publier
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-table-action delete"
                          onClick={() => handleDeleteProduct(p)}
                          disabled={isWorking}
                        >
                          {isWorking ? '...' : 'Supprimer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
