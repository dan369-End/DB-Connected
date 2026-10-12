import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth, RoleGuard } from '@/features/auth';
import { useNavigation } from '@/hooks/useNavigation';
import { MarketplaceAdminOverview } from './admin/MarketplaceAdminOverview';
import { MarketplaceCategoryManager } from './admin/MarketplaceCategoryManager';
import { ProductManager } from './admin/ProductManager';
import { MarketplaceOrdersAdmin } from './admin/MarketplaceOrdersAdmin';
import { fetchAdminOrders } from './services/marketplaceOrdersService';
import type { MarketplaceCategory, MarketplaceProduct, MarketplaceOrder } from '@/types';

type AdminTab = 'overview' | 'products' | 'categories' | 'orders';

export const MarketplaceAdminPage: React.FC = () => {
  const { hasAnyRole } = useAuth();
  const { navigate } = useNavigation();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Authority check: marketplace_admin or super_admin
  const isAuthorized = hasAnyRole(['marketplace_admin', 'super_admin']);

  const fetchAllData = useCallback(async () => {
    if (!supabase || !isAuthorized) return;
    setLoading(true);

    try {
      // 1. Categories
      const { data: catData } = await supabase
        .from('marketplace_categories')
        .select('*')
        .order('name', { ascending: true });

      setCategories((catData as MarketplaceCategory[]) || []);

      // 2. All Products (including draft & archived for admins)
      const { data: prodData } = await supabase
        .from('marketplace_products')
        .select(`
          *,
          marketplace_categories ( id, name )
        `)
        .order('created_at', { ascending: false });

      setProducts((prodData as MarketplaceProduct[]) || []);

      // 3. Orders for Admin
      const ordersRes = await fetchAdminOrders();
      setOrders(ordersRes.orders);
    } catch (err) {
      console.warn('[DB-Connect Marketplace Admin] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (isAuthorized) {
      fetchAllData();
    }
  }, [isAuthorized, fetchAllData]);

  // Real calculated statistics
  const stats = {
    totalProducts: products.length,
    publishedProducts: products.filter((p) => p.status === 'published').length,
    draftProducts: products.filter((p) => p.status === 'draft').length,
    archivedProducts: products.filter((p) => p.status === 'archived').length,
    totalCategories: categories.length,
  };

  return (
    <RoleGuard
      allowedRoles={['marketplace_admin', 'super_admin']}
      fallback={
        <div className="module-page-container">
          <div className="academy-error-box">
            <h3 className="empty-title">Accès non autorisé</h3>
            <p>
              Cette section est strictement réservée aux administrateurs du Marketplace (<code>marketplace_admin</code> ou <code>super_admin</code>).
            </p>
            <button
              type="button"
              className="btn-back-catalog"
              onClick={() => navigate('marketplace')}
            >
              Retour au Marketplace
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
                onClick={() => navigate('marketplace')}
              >
                &larr; Marketplace
              </button>
              <span className="crumb-sep">/</span>
              <span className="crumb-current">Back-office</span>
            </div>
            <h1 className="admin-main-title">Administration Marketplace</h1>
            <p className="admin-subline">
              Gestion centralisée des produits, des tarifs en FCFA, des stocks et du suivi logistique des commandes
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="admin-subnav-tabs">
          <button
            type="button"
            className={`admin-nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Vue d'ensemble
          </button>
          <button
            type="button"
            className={`admin-nav-tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Produits ({products.length})
          </button>
          <button
            type="button"
            className={`admin-nav-tab ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Catégories ({categories.length})
          </button>
          <button
            type="button"
            className={`admin-nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Commandes ({orders.length})
          </button>
        </div>

        {/* Active Content View */}
        <div className="admin-view-content">
          {activeTab === 'overview' && (
            <MarketplaceAdminOverview
              stats={stats}
              loading={loading}
              onNewProduct={() => setActiveTab('products')}
              onNewCategory={() => setActiveTab('categories')}
            />
          )}

          {activeTab === 'products' && (
            <ProductManager
              products={products}
              categories={categories}
              loading={loading}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === 'categories' && (
            <MarketplaceCategoryManager
              categories={categories}
              loading={loading}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === 'orders' && (
            <MarketplaceOrdersAdmin
              orders={orders}
              loading={loading}
              onRefresh={fetchAllData}
            />
          )}
        </div>
      </div>
    </RoleGuard>
  );
};
