import React from 'react';
import { useCart } from '../context/CartContext';
import { useNavigation } from '@/hooks/useNavigation';
import { CartItemRow } from './CartItemRow';
import { formatProductPrice } from '../utils';
import { CartIcon, ArrowRightIcon } from '@/components/icons';

export const CartPage: React.FC = () => {
  const { items, itemCount, subtotal, clearCart } = useCart();
  const { navigate } = useNavigation();

  const formattedSubtotal = formatProductPrice(subtotal, 'XAF');

  return (
    <div className="cart-page-container">
      {/* Breadcrumb & Heading */}
      <div className="cart-top-bar">
        <button
          type="button"
          className="btn-back-breadcrumb"
          onClick={() => navigate('marketplace')}
        >
          &larr; Continuer mes achats
        </button>
        <div className="cart-header-title-row">
          <div>
            <h1 className="cart-main-title">Mon Panier Marketplace</h1>
            <p className="cart-subline">
              {itemCount} {itemCount > 1 ? 'articles sélectionnés' : 'article sélectionné'}
            </p>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              className="btn-clear-cart"
              onClick={clearCart}
            >
              Vider le panier
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-catalog-state">
          <div className="empty-icon-circle">
            <CartIcon size={38} />
          </div>
          <h3 className="empty-title">Votre panier est vide</h3>
          <p className="empty-subtitle">
            Parcourez notre catalogue et ajoutez des équipements ou solutions DB-Connect à votre commande.
          </p>
          <button
            type="button"
            className="btn-admin-cta primary"
            onClick={() => navigate('marketplace')}
          >
            Découvrir les produits
          </button>
        </div>
      ) : (
        <div className="cart-content-layout">
          {/* Items list */}
          <div className="cart-items-card">
            <div className="cart-items-list">
              {items.map((it) => (
                <CartItemRow key={it.product_id} item={it} />
              ))}
            </div>
          </div>

          {/* Order Summary & Checkout CTA */}
          <div className="cart-summary-card">
            <h3 className="summary-title">Récapitulatif estimé</h3>

            <div className="summary-lines-group">
              <div className="summary-row">
                <span className="summary-label">Nombre d'articles</span>
                <span className="summary-value font-mono">{itemCount}</span>
              </div>
              <div className="summary-row total-highlight">
                <span className="summary-label">Sous-total indicatif</span>
                <span className="summary-amount">{formattedSubtotal}</span>
              </div>
            </div>

            {/* Informative notice regarding server authority on final pricing */}
            <div className="summary-server-notice">
              <span className="notice-icon">&#9432;</span>
              <p>
                <strong>Montant vérifié lors de la commande :</strong> Les prix unitaires et la disponibilité en stock sont strictement recalculés et garantis par le serveur lors de la validation.
              </p>
            </div>

            <button
              type="button"
              className="btn-proceed-checkout"
              onClick={() => navigate('marketplace_checkout')}
            >
              <span>Passer la commande</span>
              <ArrowRightIcon size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
