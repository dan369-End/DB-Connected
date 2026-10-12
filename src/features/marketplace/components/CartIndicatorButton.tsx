import React from 'react';
import { useCart } from '../context/CartContext';
import { useNavigation } from '@/hooks/useNavigation';
import { CartIcon } from '@/components/icons';

export const CartIndicatorButton: React.FC = () => {
  const { itemCount } = useCart();
  const { navigate } = useNavigation();

  return (
    <button
      type="button"
      className="btn-cart-indicator"
      onClick={() => navigate('marketplace_cart')}
      title="Voir mon panier"
      aria-label={`Panier (${itemCount} articles)`}
    >
      <CartIcon size={18} />
      <span className="cart-indicator-label">Panier</span>
      {itemCount > 0 && (
        <span className="cart-badge-count">{itemCount}</span>
      )}
    </button>
  );
};
