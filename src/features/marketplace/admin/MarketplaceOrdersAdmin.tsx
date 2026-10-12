import React, { useState, useMemo } from 'react';
import { updateOrderStatus, cancelMarketplaceOrder } from '../services/marketplaceOrdersService';
import { formatProductPrice, getPaymentMethodLabel, getPaymentStatusConfig } from '../utils';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { OrderTimeline } from '../components/OrderTimeline';
import { SearchIcon, PackageIcon } from '@/components/icons';
import type { MarketplaceOrder, OrderStatus } from '@/types';

interface MarketplaceOrdersAdminProps {
  orders: MarketplaceOrder[];
  loading: boolean;
  onRefresh: () => void;
}

export const MarketplaceOrdersAdmin: React.FC<MarketplaceOrdersAdminProps> = ({
  orders,
  loading,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [selectedOrder, setSelectedOrder] = useState<MarketplaceOrder | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cancellation state
  const [confirmingCancelOrder, setConfirmingCancelOrder] = useState<MarketplaceOrder | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Filter orders by query (order_number, full_name, phone) and status
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const matchesStatus = statusFilter === 'all' || ord.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        ord.order_number.toLowerCase().includes(q) ||
        ord.full_name.toLowerCase().includes(q) ||
        ord.phone.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  // Progressive status change (pending -> confirmed -> preparing -> ready -> shipped -> delivered)
  const handleStatusChange = async (orderId: string, newStatus: Exclude<OrderStatus, 'cancelled'>) => {
    setUpdatingId(orderId);
    setActionMessage(null);
    setErrorMessage(null);

    const res = await updateOrderStatus(orderId, newStatus);
    if (!res.success) {
      setErrorMessage(res.error || 'Erreur lors de la mise à jour du statut.');
    } else {
      setActionMessage('Statut de la commande mis à jour avec succès.');
      onRefresh();

      // If active modal is open for this order, update its status in modal state
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus,
        });
      }
    }

    setUpdatingId(null);
  };

  // Secure Cancellation via RPC public.cancel_marketplace_order(p_order_id)
  const handleExecuteCancelOrder = async () => {
    if (!confirmingCancelOrder || cancelling) return;

    const orderToCancel = confirmingCancelOrder;
    setCancelling(true);
    setErrorMessage(null);
    setActionMessage(null);

    const res = await cancelMarketplaceOrder(orderToCancel.id);

    if (!res.success) {
      setErrorMessage(res.error || 'Impossible d\'annuler la commande pour le moment.');
      setCancelling(false);
    } else {
      setActionMessage('Commande annulée et stock restauré.');
      setConfirmingCancelOrder(null);
      setCancelling(false);

      // Refresh data
      onRefresh();

      // Update selected order in open modal if applicable
      if (selectedOrder && selectedOrder.id === orderToCancel.id) {
        setSelectedOrder({
          ...selectedOrder,
          status: 'cancelled',
        });
      }
    }
  };

  return (
    <div className="admin-orders-view">
      <div className="admin-table-toolbar">
        <div>
          <h2 className="toolbar-section-title">Gestion des Commandes</h2>
          <p className="toolbar-section-sub">
            Suivi des ventes, traitement logistique et statut d'expédition
          </p>
        </div>
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
            placeholder="Rechercher par n° de commande, client ou tél..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="admin-select-filters">
          <select
            className="form-input select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | OrderStatus)}
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmée</option>
            <option value="preparing">En préparation</option>
            <option value="ready">Prête</option>
            <option value="shipped">En livraison</option>
            <option value="delivered">Livrée</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="academy-loading-box">
          <div className="spinner large"></div>
          <p>Chargement des commandes...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-catalog-state">
          <div className="empty-icon-circle">
            <PackageIcon size={38} />
          </div>
          <h3 className="empty-title">Aucune commande trouvée</h3>
          <p className="empty-subtitle">
            {searchQuery || statusFilter !== 'all'
              ? 'Aucune commande ne correspond aux filtres.'
              : 'Aucune commande enregistrée pour le moment.'}
          </p>
        </div>
      ) : (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>N° Commande</th>
                <th>Client</th>
                <th>Téléphone</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Paiement</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((ord) => {
                const formattedDate = new Date(ord.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const formattedSubtotal = formatProductPrice(ord.subtotal, ord.currency || 'XAF');
                const isWorking = updatingId === ord.id;
                const paymentConfig = getPaymentStatusConfig(ord.payment_status);

                return (
                  <tr key={ord.id}>
                    <td className="font-mono font-bold text-main">
                      #{ord.order_number}
                    </td>
                    <td className="font-semibold text-main">{ord.full_name}</td>
                    <td className="font-mono text-muted">{ord.phone}</td>
                    <td className="text-muted">{formattedDate}</td>
                    <td className="font-mono font-bold text-main">{formattedSubtotal}</td>
                    <td>
                      <OrderStatusBadge status={ord.status} />
                    </td>
                    <td>
                      <span className={paymentConfig.className}>
                        {paymentConfig.label}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="table-actions-group">
                        <button
                          type="button"
                          className="btn-table-action edit"
                          onClick={() => {
                            setSelectedOrder(ord);
                            setConfirmingCancelOrder(null);
                          }}
                        >
                          Détails
                        </button>

                        {/* Quick progression buttons */}
                        {ord.status === 'pending' && (
                          <button
                            type="button"
                            className="btn-table-action publish"
                            onClick={() => handleStatusChange(ord.id, 'confirmed')}
                            disabled={isWorking}
                            title="Confirmer la commande"
                          >
                            Confirmer
                          </button>
                        )}
                        {ord.status === 'confirmed' && (
                          <button
                            type="button"
                            className="btn-table-action content"
                            onClick={() => handleStatusChange(ord.id, 'preparing')}
                            disabled={isWorking}
                            title="Mettre en préparation"
                          >
                            Préparer
                          </button>
                        )}
                        {ord.status === 'preparing' && (
                          <button
                            type="button"
                            className="btn-table-action content"
                            onClick={() => handleStatusChange(ord.id, 'ready')}
                            disabled={isWorking}
                            title="Marquer comme prête"
                          >
                            Prête
                          </button>
                        )}
                        {ord.status === 'ready' && (
                          <button
                            type="button"
                            className="btn-table-action content"
                            onClick={() => handleStatusChange(ord.id, 'shipped')}
                            disabled={isWorking}
                            title="Mettre en livraison"
                          >
                            Expédier
                          </button>
                        )}
                        {ord.status === 'shipped' && (
                          <button
                            type="button"
                            className="btn-table-action publish"
                            onClick={() => handleStatusChange(ord.id, 'delivered')}
                            disabled={isWorking}
                            title="Marquer comme livrée"
                          >
                            Livrée
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin Order Detail Modal */}
      {selectedOrder && (
        <div
          className="admin-modal-backdrop"
          onClick={() => {
            if (!cancelling) {
              setSelectedOrder(null);
              setConfirmingCancelOrder(null);
            }
          }}
        >
          <div className="admin-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="modal-title">Commande #{selectedOrder.order_number}</h3>
                <span className="modal-sub">
                  Enregistrée le{' '}
                  {new Date(selectedOrder.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                disabled={cancelling}
                onClick={() => {
                  setSelectedOrder(null);
                  setConfirmingCancelOrder(null);
                }}
              >
                &times;
              </button>
            </div>

            {/* Stepper tracking in modal */}
            <div className="modal-timeline-box">
              <OrderTimeline status={selectedOrder.status} />
            </div>

            {/* Customer & Payment Information Grid */}
            <div className="modal-customer-info-grid">
              <div className="info-block-cell">
                <span className="cell-label">Client</span>
                <span className="cell-value">{selectedOrder.full_name}</span>
              </div>
              <div className="info-block-cell">
                <span className="cell-label">Téléphone</span>
                <span className="cell-value font-mono">{selectedOrder.phone}</span>
              </div>
              <div className="info-block-cell">
                <span className="cell-label">Email</span>
                <span className="cell-value font-mono">{selectedOrder.email || '—'}</span>
              </div>
              <div className="info-block-cell">
                <span className="cell-label">Mode de règlement</span>
                <span className="cell-value font-semibold">
                  {getPaymentMethodLabel(selectedOrder.payment_method)}
                </span>
              </div>
              <div className="info-block-cell">
                <span className="cell-label">Statut du règlement</span>
                <div style={{ marginTop: '0.2rem' }}>
                  <span className={getPaymentStatusConfig(selectedOrder.payment_status).className}>
                    {getPaymentStatusConfig(selectedOrder.payment_status).label}
                  </span>
                </div>
              </div>
              <div className="info-block-cell">
                <span className="cell-label">Référence règlement</span>
                <span className="cell-value font-mono text-muted">
                  {selectedOrder.payment_reference || 'Non renseignée'}
                </span>
              </div>
              {selectedOrder.paid_at && (
                <div className="info-block-cell">
                  <span className="cell-label">Date de paiement</span>
                  <span className="cell-value font-mono text-muted">
                    {new Date(selectedOrder.paid_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
              <div className="info-block-cell full-width">
                <span className="cell-label">Adresse de livraison</span>
                <span className="cell-value">{selectedOrder.delivery_address}</span>
              </div>
              {selectedOrder.notes && (
                <div className="info-block-cell full-width">
                  <span className="cell-label">Instructions client</span>
                  <span className="cell-value italic">{selectedOrder.notes}</span>
                </div>
              )}
            </div>

            {/* Historical Order Items */}
            <div className="modal-order-items">
              <h4 className="modal-items-heading">Articles commandés</h4>
              <div className="order-items-table-wrapper">
                <table className="order-items-table">
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th>Prix unit. hist.</th>
                      <th>Qté</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.marketplace_order_items || selectedOrder.items || []).map((it) => (
                      <tr key={it.id}>
                        <td className="item-name-bold">{it.product_name}</td>
                        <td className="font-mono text-muted">
                          {formatProductPrice(it.unit_price, selectedOrder.currency || 'XAF')}
                        </td>
                        <td className="font-mono">{it.quantity}</td>
                        <td className="text-right font-mono font-bold text-main">
                          {formatProductPrice(it.line_total, selectedOrder.currency || 'XAF')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="modal-order-total-bar">
                <span>Sous-total vérifié :</span>
                <strong className="font-mono">
                  {formatProductPrice(selectedOrder.subtotal, selectedOrder.currency || 'XAF')}
                </strong>
              </div>
            </div>

            {/* Cancellation Confirmation Box if active */}
            {confirmingCancelOrder && confirmingCancelOrder.id === selectedOrder.id && (
              <div className="cancel-confirmation-box" role="alert">
                <h4 className="cancel-confirm-title">Annuler cette commande ?</h4>
                <p className="cancel-confirm-desc">
                  Les produits de cette commande seront remis en stock automatiquement par le serveur. Cette opération est irréversible.
                </p>
                <div className="cancel-confirm-actions">
                  <button
                    type="button"
                    className="btn-cancel-dialog-dismiss"
                    disabled={cancelling}
                    onClick={() => setConfirmingCancelOrder(null)}
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    className="btn-confirm-cancel-order"
                    disabled={cancelling}
                    onClick={handleExecuteCancelOrder}
                  >
                    {cancelling ? (
                      <span className="btn-loading-content">
                        <span className="spinner"></span> Annulation...
                      </span>
                    ) : (
                      'Annuler la commande'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Status change actions bar */}
            <div className="modal-status-actions-bar">
              <span className="actions-bar-label">Modifier le statut :</span>
              <div className="status-buttons-cluster">
                {selectedOrder.status !== 'confirmed' && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <button
                    type="button"
                    className="btn-status-pill outline-success"
                    onClick={() => handleStatusChange(selectedOrder.id, 'confirmed')}
                    disabled={updatingId === selectedOrder.id || cancelling}
                  >
                    Confirmer
                  </button>
                )}
                {selectedOrder.status !== 'preparing' && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <button
                    type="button"
                    className="btn-status-pill outline-accent"
                    onClick={() => handleStatusChange(selectedOrder.id, 'preparing')}
                    disabled={updatingId === selectedOrder.id || cancelling}
                  >
                    En préparation
                  </button>
                )}
                {selectedOrder.status !== 'ready' && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <button
                    type="button"
                    className="btn-status-pill outline-accent"
                    onClick={() => handleStatusChange(selectedOrder.id, 'ready')}
                    disabled={updatingId === selectedOrder.id || cancelling}
                  >
                    Prête
                  </button>
                )}
                {selectedOrder.status !== 'shipped' && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <button
                    type="button"
                    className="btn-status-pill outline-accent"
                    onClick={() => handleStatusChange(selectedOrder.id, 'shipped')}
                    disabled={updatingId === selectedOrder.id || cancelling}
                  >
                    En livraison
                  </button>
                )}
                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <button
                    type="button"
                    className="btn-status-pill outline-success"
                    onClick={() => handleStatusChange(selectedOrder.id, 'delivered')}
                    disabled={updatingId === selectedOrder.id || cancelling}
                  >
                    Marquer livrée
                  </button>
                )}

                {/* Cancel button: strictly hidden if status === 'cancelled' OR status === 'delivered' */}
                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && !confirmingCancelOrder && (
                  <button
                    type="button"
                    className="btn-status-pill outline-danger"
                    onClick={() => setConfirmingCancelOrder(selectedOrder)}
                    disabled={updatingId === selectedOrder.id || cancelling}
                  >
                    Annuler la commande
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
