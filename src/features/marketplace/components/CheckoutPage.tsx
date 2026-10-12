import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { useCart } from '../context/CartContext';
import { useNavigation } from '@/hooks/useNavigation';
import { createMarketplaceOrder } from '../services/marketplaceOrdersService';
import { formatProductPrice } from '../utils';
import { CartIcon } from '@/components/icons';
import type { PaymentMethod } from '@/types';

interface PaymentOption {
  value: PaymentMethod;
  title: string;
  description: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    value: 'cash_on_delivery',
    title: 'Paiement à la livraison',
    description: 'Vous paierez au moment de la réception de votre commande.',
  },
  {
    value: 'mobile_money',
    title: 'Mobile Money',
    description: 'Votre commande sera enregistrée puis mise en attente de paiement.',
  },
  {
    value: 'manual_transfer',
    title: 'Transfert manuel',
    description: 'Votre commande sera enregistrée puis validée après confirmation du transfert.',
  },
];

export const CheckoutPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { items, itemCount, subtotal, clearCart } = useCart();
  const { navigate } = useNavigation();

  // Form Fields prefilled intelligently from user profile where available
  const [fullName, setFullName] = useState<string>(profile?.full_name || '');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>(user?.email || profile?.email || '');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync profile details if loaded after initial mount
  useEffect(() => {
    if (profile?.full_name && !fullName) {
      setFullName(profile.full_name);
    }
    if ((user?.email || profile?.email) && !email) {
      setEmail(user?.email || profile?.email || '');
    }
  }, [profile, user, fullName, email]);

  // If cart is empty, redirect back to cart
  if (items.length === 0) {
    return (
      <div className="cart-page-container">
        <div className="empty-catalog-state">
          <div className="empty-icon-circle">
            <CartIcon size={38} />
          </div>
          <h3 className="empty-title">Votre panier est vide</h3>
          <p className="empty-subtitle">
            Vous ne pouvez pas accéder à la validation sans avoir sélectionné au moins un article.
          </p>
          <button
            type="button"
            className="btn-admin-cta primary"
            onClick={() => navigate('marketplace')}
          >
            Retourner au catalogue
          </button>
        </div>
      </div>
    );
  }

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;

    if (!fullName.trim()) {
      setErrorMessage('Le nom complet est obligatoire.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Le numéro de téléphone de contact est obligatoire.');
      return;
    }
    if (!deliveryAddress.trim()) {
      setErrorMessage("L'adresse de livraison est obligatoire.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    // Strict payload: only product_id and quantity (never unit_price or subtotal)
    const orderItemsPayload = items.map((it) => ({
      product_id: it.product_id,
      quantity: it.quantity,
    }));

    try {
      const result = await createMarketplaceOrder({
        fullName,
        phone,
        email,
        deliveryAddress,
        notes,
        paymentMethod,
        items: orderItemsPayload,
      });

      if (result.error || !result.orderId) {
        // Do NOT clear cart upon failure
        setErrorMessage(result.error || 'Erreur lors de la validation de la commande.');
        setSubmitting(false);
        return;
      }

      // Success: clear cart and navigate to order confirmation view
      clearCart();
      navigate('marketplace_order_detail', { orderId: result.orderId });
    } catch (err: unknown) {
      console.warn('[DB-Connect Checkout] Submit error:', err);
      setErrorMessage('Une erreur de connexion est survenue. Votre panier a été conservé intact.');
      setSubmitting(false);
    }
  };

  const formattedEstimatedSubtotal = formatProductPrice(subtotal, 'XAF');

  return (
    <div className="checkout-page-container">
      {/* Header bar */}
      <div className="cart-header-row">
        <div>
          <button
            type="button"
            className="btn-back-breadcrumb"
            onClick={() => navigate('marketplace_cart')}
          >
            &larr; Revenir au panier
          </button>
          <h1 className="cart-title">Validation de votre commande</h1>
          <p className="cart-subtitle">
            Renseignez vos coordonnées de livraison et choisissez votre mode de paiement
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="auth-alert alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="checkout-layout-grid">
        {/* Left: Customer Information & Delivery Form */}
        <div className="checkout-form-card">
          <h2 className="section-card-title">1. Informations de livraison</h2>

          <form onSubmit={handleOrderSubmit} className="checkout-form">
            <div className="form-row-duo">
              <div className="form-group">
                <label className="form-label" htmlFor="order-fullname">
                  Nom et prénom du destinataire *
                </label>
                <input
                  id="order-fullname"
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ex : Guy Makaya"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="order-phone">
                  Numéro de téléphone (joignable) *
                </label>
                <input
                  id="order-phone"
                  type="tel"
                  required
                  className="form-input font-mono"
                  placeholder="Ex : +242 06 000 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="order-email">
                Adresse email
              </label>
              <input
                id="order-email"
                type="email"
                className="form-input"
                placeholder="Ex : contact@exemple.cg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="order-address">
                Adresse complète de livraison *
              </label>
              <textarea
                id="order-address"
                required
                rows={3}
                className="form-input"
                placeholder="Ville, quartier, avenue ou repère précis de livraison..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="order-notes">
                Notes ou instructions particulières (Optionnel)
              </label>
              <textarea
                id="order-notes"
                rows={2}
                className="form-input"
                placeholder="Disponibilité horaire, étage, indications pour le livreur..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Payment Method Selection */}
            <div className="form-group">
              <label className="form-label">
                2. Mode de paiement *
              </label>
              <div className="payment-methods-selector-grid">
                {PAYMENT_OPTIONS.map((opt) => {
                  const isSelected = paymentMethod === opt.value;
                  return (
                    <div
                      key={opt.value}
                      className={`payment-method-card ${isSelected ? 'selected' : ''} ${submitting ? 'disabled' : ''}`}
                      onClick={() => {
                        if (!submitting) {
                          setPaymentMethod(opt.value);
                        }
                      }}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          if (!submitting) setPaymentMethod(opt.value);
                        }
                      }}
                    >
                      <div className="payment-card-top">
                        <div className="payment-radio-circle">
                          {isSelected && <div className="payment-radio-dot" />}
                        </div>
                        <span className="payment-method-title">{opt.title}</span>
                      </div>
                      <p className="payment-method-desc">{opt.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="checkout-submit-bar">
              <button
                type="submit"
                className="btn-admin-cta primary btn-large-order"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="btn-loading-content">
                    <span className="spinner"></span> Validation de votre commande en cours...
                  </span>
                ) : (
                  'Passer la commande'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Quick Order Recap */}
        <div className="checkout-summary-card">
          <h3 className="summary-title">Contenu de la commande ({itemCount})</h3>

          <div className="checkout-lines-list">
            {items.map((it) => (
              <div key={it.product_id} className="checkout-item-line">
                <div className="checkout-line-info">
                  <span className="checkout-line-name">{it.name}</span>
                  <span className="checkout-line-qty">Quantité : {it.quantity}</span>
                </div>
                <span className="checkout-line-price">
                  {formatProductPrice(
                    it.price !== null ? it.price * it.quantity : null,
                    it.currency
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="checkout-summary-total">
            <span className="total-label">Total indicatif :</span>
            <span className="total-amount font-mono">{formattedEstimatedSubtotal}</span>
          </div>

          <p className="security-notice-text">
            Le montant définitif et les stocks sont vérifiés de manière sécurisée par notre serveur au moment de l'enregistrement.
          </p>
        </div>
      </div>
    </div>
  );
};
