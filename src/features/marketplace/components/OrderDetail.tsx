import React, { useState, useEffect } from 'react';
import { fetchOrderDetail } from '../services/marketplaceOrdersService';
import { useNavigation } from '@/hooks/useNavigation';
import { formatProductPrice, getPaymentMethodLabel, getPaymentStatusConfig } from '../utils';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderTimeline } from './OrderTimeline';
import { PackageIcon } from '@/components/icons';
import type { MarketplaceOrder } from '@/types';

interface OrderDetailProps {
  orderId: string;
}

export const OrderDetail: React.FC<OrderDetailProps> = ({ orderId }) => {
  const { navigate } = useNavigation();
  const [order, setOrder] = useState<MarketplaceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setErrorMessage(null);

    fetchOrderDetail(orderId).then((res) => {
      if (!isCancelled) {
        if (res.error || !res.order) {
          setErrorMessage(res.error || 'Commande introuvable.');
        } else {
          setOrder(res.order);
        }
        setLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="academy-loading-box">
        <div className="spinner large"></div>
        <p>Chargement des informations de votre commande...</p>
      </div>
    );
  }

  if (errorMessage || !order) {
    return (
      <div className="academy-error-box">
        <p>{errorMessage || 'Commande introuvable ou inaccessible.'}</p>
        <button
          type="button"
          className="btn-back-catalog"
          onClick={() => navigate('marketplace_orders')}
        >
          Retour à Mes commandes
        </button>
      </div>
    );
  }

  const items = order.marketplace_order_items || order.items || [];
  const formattedSubtotal = formatProductPrice(order.subtotal, order.currency || 'XAF');
  const formattedDate = new Date(order.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const paymentMethodKey = order.payment_method || 'cash_on_delivery';
  const paymentStatusKey = order.payment_status || 'unpaid';
  const paymentMethodLabel = getPaymentMethodLabel(paymentMethodKey);
  const paymentStatusConfig = getPaymentStatusConfig(paymentStatusKey);

  return (
    <div className="order-detail-page-container">
      {/* Top Breadcrumb & Success Notice */}
      <div className="order-detail-top">
        <button
          type="button"
          className="btn-back-breadcrumb"
          onClick={() => navigate('marketplace_orders')}
        >
          &larr; Retour à Mes commandes
        </button>

        <div className="order-confirmed-banner">
          <div className="confirmed-icon-circle">
            <PackageIcon size={26} />
          </div>
          <div className="confirmed-text-group">
            <span className="confirmed-badge-pill">Commande client</span>
            <h1 className="order-number-title">Commande #{order.order_number}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
              <span className="order-date-text">Enregistrée le {formattedDate}</span>
              <span style={{ color: 'rgba(148, 163, 184, 0.4)' }}>•</span>
              <span className="font-mono font-bold text-cyan-400" style={{ fontSize: '1rem' }}>
                {formattedSubtotal}
              </span>
            </div>
          </div>
          <div className="order-status-right">
            <OrderStatusBadge status={order.status} />
          </div>
        </div>
      </div>

      {/* Visual Timeline Tracking */}
      <div className="order-timeline-card">
        <h2 className="timeline-card-title">État d'avancement</h2>
        <OrderTimeline status={order.status} />
      </div>

      {/* Grid: Order Items & Delivery Coordinates */}
      <div className="order-content-grid">
        {/* Left: Historical Order Items */}
        <div className="order-items-card">
          <h3 className="section-card-title">Articles commandés ({items.length})</h3>

          <div className="order-items-table-wrapper">
            <table className="order-items-table">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Prix unitaire</th>
                  <th>Quantité</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td className="item-name-cell">
                      <span className="item-name-bold">{it.product_name}</span>
                    </td>
                    <td className="font-mono text-muted">
                      {formatProductPrice(it.unit_price, order.currency || 'XAF')}
                    </td>
                    <td className="font-mono">{it.quantity}</td>
                    <td className="text-right font-mono font-bold text-main">
                      {formatProductPrice(it.line_total, order.currency || 'XAF')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="order-subtotal-footer">
            <span className="subtotal-label">Sous-total final :</span>
            <span className="subtotal-value">{formattedSubtotal}</span>
          </div>
        </div>

        {/* Right: Payment, Customer & Delivery Details */}
        <div className="order-info-sidebar">
          {/* Payment Details Block */}
          <div className="info-block-card">
            <h3 className="section-card-title">Modalités de règlement</h3>
            <div className="info-line-row">
              <span className="info-label">Mode de paiement :</span>
              <span className="info-value font-semibold text-main">{paymentMethodLabel}</span>
            </div>
            <div className="info-line-row">
              <span className="info-label">Statut du paiement :</span>
              <span className={paymentStatusConfig.className}>
                {paymentStatusConfig.label}
              </span>
            </div>

            {/* Payment Method Specific Clean Information Card */}
            {paymentMethodKey === 'cash_on_delivery' && (
              <div className="order-payment-notice-card cash-on-delivery">
                <div className="payment-notice-header">
                  <h4 className="payment-notice-title">Paiement à la livraison</h4>
                </div>
                <p className="payment-notice-desc">
                  Le paiement sera effectué lors de la réception de la commande.
                </p>
              </div>
            )}

            {paymentMethodKey === 'mobile_money' && (
              <div className="order-payment-notice-card mobile-money">
                <div className="payment-notice-header">
                  <h4 className="payment-notice-title">Paiement Mobile Money en attente</h4>
                </div>
                <p className="payment-notice-desc">
                  Votre commande a été enregistrée. Le paiement Mobile Money sera traité dans une prochaine étape.
                </p>
              </div>
            )}

            {paymentMethodKey === 'manual_transfer' && (
              <div className="order-payment-notice-card manual-transfer">
                <div className="payment-notice-header">
                  <h4 className="payment-notice-title">Transfert en attente de confirmation</h4>
                </div>
                <p className="payment-notice-desc">
                  Votre commande a été enregistrée. Les instructions de transfert seront ajoutées prochainement.
                </p>
              </div>
            )}
          </div>

          <div className="info-block-card">
            <h3 className="section-card-title">Coordonnées du destinataire</h3>
            <div className="info-line-row">
              <span className="info-label">Client :</span>
              <span className="info-value">{order.full_name}</span>
            </div>
            <div className="info-line-row">
              <span className="info-label">Téléphone :</span>
              <span className="info-value font-mono">{order.phone}</span>
            </div>
            {order.email && (
              <div className="info-line-row">
                <span className="info-label">Email :</span>
                <span className="info-value font-mono">{order.email}</span>
              </div>
            )}
          </div>

          <div className="info-block-card">
            <h3 className="section-card-title">Adresse de livraison</h3>
            <p className="delivery-address-text">{order.delivery_address}</p>

            {order.notes && (
              <div className="order-notes-box">
                <span className="notes-label">Instructions particulières :</span>
                <p className="notes-text">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
