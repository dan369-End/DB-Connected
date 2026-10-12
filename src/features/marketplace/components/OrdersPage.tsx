import React, { useState, useEffect, useMemo } from 'react';
import { fetchUserOrders } from '../services/marketplaceOrdersService';
import { useNavigation } from '@/hooks/useNavigation';
import {
  formatProductPrice,
  getPaymentMethodLabel,
  getPaymentStatusConfig,
} from '../utils';
import { OrderStatusBadge } from './OrderStatusBadge';
import {
  PackageIcon,
  ArrowRightIcon,
  SearchIcon,
  CloseIcon,
  CalendarIcon,
} from '@/components/icons';
import type { MarketplaceOrder } from '@/types';

type FilterType = 'all' | 'pending' | 'in_progress' | 'delivered' | 'cancelled';

export const OrdersPage: React.FC = () => {
  const { navigate } = useNavigation();
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter & Search states
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setErrorMessage(null);

    fetchUserOrders().then((res) => {
      if (!isCancelled) {
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          setOrders(res.orders);
        }
        setLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Quick summary counts calculated strictly from real user orders
  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const inProgressCount = orders.filter((o) =>
    ['confirmed', 'preparing', 'ready', 'shipped'].includes(o.status)
  ).length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Status group filter
      let matchesStatus = true;
      if (typeFilter === 'pending') {
        matchesStatus = order.status === 'pending';
      } else if (typeFilter === 'in_progress') {
        matchesStatus = ['confirmed', 'preparing', 'ready', 'shipped'].includes(order.status);
      } else if (typeFilter === 'delivered') {
        matchesStatus = order.status === 'delivered';
      } else if (typeFilter === 'cancelled') {
        matchesStatus = order.status === 'cancelled';
      }

      if (!matchesStatus) return false;

      // 2. Search query filter by order number
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const num = (order.order_number || '').toLowerCase();
        return num.includes(q);
      }

      return true;
    });
  }, [orders, typeFilter, searchQuery]);

  return (
    <div className="orders-client-shell">
      {/* 1. Header Section */}
      <div className="orders-client-header">
        <button
          type="button"
          className="btn-back-breadcrumb"
          onClick={() => navigate('marketplace')}
          title="Retourner au catalogue Marketplace"
        >
          &larr; Retour au Marketplace
        </button>
        <h1 className="orders-client-title">Mes commandes</h1>
        <p className="orders-client-subtitle">
          Suivez vos commandes et consultez leur état en un coup d'œil.
        </p>
      </div>

      {errorMessage && (
        <div className="auth-alert alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="academy-loading-box">
          <div className="spinner large" />
          <p>Chargement de vos commandes...</p>
        </div>
      ) : orders.length === 0 ? (
        /* 10. Empty state when user has never placed an order */
        <div className="orders-empty-card">
          <div className="orders-empty-icon-wrap">
            <PackageIcon size={34} />
          </div>
          <h3 className="orders-empty-title">Vous n'avez pas encore de commande</h3>
          <p className="orders-empty-desc">
            Découvrez les produits disponibles sur le Marketplace.
          </p>
          <button
            type="button"
            className="btn-admin-cta primary"
            onClick={() => navigate('marketplace')}
          >
            Découvrir le Marketplace
          </button>
        </div>
      ) : (
        <>
          {/* 2. Quick Summary Strip (interactive filter triggers) */}
          <section className="orders-summary-grid" aria-label="Résumé des commandes">
            <button
              type="button"
              className={`orders-summary-card ${typeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTypeFilter('all')}
            >
              <span className="summary-card-label">Toutes</span>
              <span className="summary-card-count">{totalCount}</span>
            </button>

            <button
              type="button"
              className={`orders-summary-card ${typeFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setTypeFilter('pending')}
            >
              <span className="summary-card-label">En attente</span>
              <span className="summary-card-count count-pending">{pendingCount}</span>
            </button>

            <button
              type="button"
              className={`orders-summary-card ${typeFilter === 'in_progress' ? 'active' : ''}`}
              onClick={() => setTypeFilter('in_progress')}
            >
              <span className="summary-card-label">En cours</span>
              <span className="summary-card-count count-inprogress">{inProgressCount}</span>
            </button>

            <button
              type="button"
              className={`orders-summary-card ${typeFilter === 'delivered' ? 'active' : ''}`}
              onClick={() => setTypeFilter('delivered')}
            >
              <span className="summary-card-label">Livrées</span>
              <span className="summary-card-count count-delivered">{deliveredCount}</span>
            </button>
          </section>

          {/* 3 & 11. Filters Toolbar & Search */}
          <div className="orders-toolbar">
            <div className="orders-filter-chips" role="tablist" aria-label="Filtres de statut">
              <button
                type="button"
                role="tab"
                aria-selected={typeFilter === 'all'}
                className={`orders-filter-chip ${typeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                <span>Toutes</span>
                <span className="orders-chip-badge">{totalCount}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={typeFilter === 'pending'}
                className={`orders-filter-chip ${typeFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setTypeFilter('pending')}
              >
                <span>En attente</span>
                {pendingCount > 0 && <span className="orders-chip-badge">{pendingCount}</span>}
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={typeFilter === 'in_progress'}
                className={`orders-filter-chip ${typeFilter === 'in_progress' ? 'active' : ''}`}
                onClick={() => setTypeFilter('in_progress')}
              >
                <span>En cours</span>
                {inProgressCount > 0 && <span className="orders-chip-badge">{inProgressCount}</span>}
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={typeFilter === 'delivered'}
                className={`orders-filter-chip ${typeFilter === 'delivered' ? 'active' : ''}`}
                onClick={() => setTypeFilter('delivered')}
              >
                <span>Livrées</span>
                {deliveredCount > 0 && <span className="orders-chip-badge">{deliveredCount}</span>}
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={typeFilter === 'cancelled'}
                className={`orders-filter-chip ${typeFilter === 'cancelled' ? 'active' : ''}`}
                onClick={() => setTypeFilter('cancelled')}
              >
                <span>Annulées</span>
                {cancelledCount > 0 && <span className="orders-chip-badge">{cancelledCount}</span>}
              </button>
            </div>

            {/* Optional Order Search */}
            <div className="orders-search-box">
              <span className="orders-search-icon" aria-hidden="true">
                <SearchIcon size={16} />
              </span>
              <input
                type="text"
                className="orders-search-input"
                placeholder="Rechercher une commande..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Rechercher par numéro de commande"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="orders-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Effacer la recherche"
                >
                  <CloseIcon size={14} />
                </button>
              )}
            </div>
          </div>

          {/* 4 & 5. Orders Cards List */}
          {filteredOrders.length === 0 ? (
            <div className="orders-empty-card">
              <h3 className="orders-empty-title">Aucune commande trouvée</h3>
              <p className="orders-empty-desc">
                Aucune commande ne correspond au filtre ou à la recherche courante.
              </p>
              <button
                type="button"
                className="btn-admin-cta secondary"
                onClick={() => {
                  setTypeFilter('all');
                  setSearchQuery('');
                }}
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="orders-cards-list">
              {filteredOrders.map((order) => {
                const formattedDate = new Date(order.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                });

                const formattedSubtotal = formatProductPrice(
                  order.subtotal,
                  order.currency || 'XAF'
                );

                const itemsList = order.marketplace_order_items || order.items || [];
                const totalItemsCount = itemsList.length > 0
                  ? itemsList.reduce((acc, it) => acc + (it.quantity || 1), 0)
                  : 0;

                const paymentMethodLabel = getPaymentMethodLabel(order.payment_method);
                const paymentStatusKey = (order.payment_status || 'unpaid') as string;
                const paymentStatusConfig = getPaymentStatusConfig(paymentStatusKey);

                return (
                  <article key={order.id} className="order-card-item">
                    {/* Top Row: Order Number, Date & Status */}
                    <div className="order-card-top-row">
                      <div className="order-card-id-group">
                        <div className="order-card-number-line">
                          <span className="order-card-number">
                            Commande #{order.order_number}
                          </span>
                          {totalItemsCount > 0 && (
                            <span className="order-card-items-count-badge">
                              {totalItemsCount} article{totalItemsCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <div className="order-card-date">
                          <CalendarIcon size={14} />
                          <span>{formattedDate}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="order-card-status-wrapper">
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </div>

                    <div className="order-card-divider" aria-hidden="true" />

                    {/* Body Row: Price, Payment info & Detail Action */}
                    <div className="order-card-body-row">
                      {/* Price Column */}
                      <div className="order-card-price-col">
                        <span className="order-card-price-label">Montant</span>
                        <span className="order-card-price-val">{formattedSubtotal}</span>
                      </div>

                      {/* Payment Information Column */}
                      <div className="order-card-payment-col">
                        <div className="order-payment-item">
                          <span className="item-label">Paiement :</span>
                          <span className="item-value">{paymentMethodLabel}</span>
                        </div>
                        <div className="order-payment-item">
                          <span className="item-label">Paiement :</span>
                          <span className={`payment-status-tag tag-${paymentStatusKey}`}>
                            {paymentStatusConfig.label}
                          </span>
                        </div>
                      </div>

                      {/* Action Button: Voir le détail */}
                      <div className="order-card-action-col">
                        <button
                          type="button"
                          className="btn-order-view-detail"
                          onClick={() =>
                            navigate('marketplace_order_detail', { orderId: order.id })
                          }
                        >
                          <span>Voir le détail</span>
                          <ArrowRightIcon size={14} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
