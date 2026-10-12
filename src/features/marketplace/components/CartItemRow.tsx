import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { formatProductPrice } from '../utils';
import { getMarketplaceImageUrl } from '../utils/imageStorage';
import { TrashIcon, MarketplaceIcon } from '@/components/icons';
import type { CartItem } from '@/types';

interface CartItemRowProps {
  item: CartItem;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    if (item.image_url) {
      getMarketplaceImageUrl(item.image_url).then((url) => {
        if (!isCancelled) setResolvedImageUrl(url);
      });
    } else {
      setResolvedImageUrl(null);
    }
    return () => {
      isCancelled = true;
    };
  }, [item.image_url]);

  const unitPriceFormatted = formatProductPrice(item.price, item.currency);
  const lineTotal = (item.price ?? 0) * item.quantity;
  const lineTotalFormatted = formatProductPrice(lineTotal, item.currency);

  const canIncrement = item.quantity < item.stock_quantity;

  return (
    <div className="cart-item-row">
      {/* Product Image Thumbnail */}
      <div className="cart-item-image-box">
        {resolvedImageUrl ? (
          <img
            src={resolvedImageUrl}
            alt={item.name}
            className="cart-item-img"
          />
        ) : (
          <div className="cart-item-fallback">
            <MarketplaceIcon size={22} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="cart-item-info">
        <h4 className="cart-item-name">{item.name}</h4>
        <span className="cart-item-unit-price">
          Prix unitaire indicatif : {unitPriceFormatted}
        </span>
        <span className="cart-item-stock-notice">
          Disponible en stock : {item.stock_quantity}
        </span>
      </div>

      {/* Quantity Selector */}
      <div className="cart-item-qty-control">
        <button
          type="button"
          className="btn-qty-step"
          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
          aria-label="Diminuer la quantité"
        >
          -
        </button>
        <span className="qty-number-display">{item.quantity}</span>
        <button
          type="button"
          className="btn-qty-step"
          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
          disabled={!canIncrement}
          aria-label="Augmenter la quantité"
          title={!canIncrement ? 'Stock maximal atteint' : undefined}
        >
          +
        </button>
      </div>

      {/* Total line price */}
      <div className="cart-item-line-total">
        <span className="line-total-amount">{lineTotalFormatted}</span>
      </div>

      {/* Remove button */}
      <div className="cart-item-remove-action">
        <button
          type="button"
          className="btn-remove-cart-item"
          onClick={() => removeFromCart(item.product_id)}
          title="Supprimer du panier"
          aria-label={`Supprimer ${item.name} du panier`}
        >
          <TrashIcon size={16} />
        </button>
      </div>
    </div>
  );
};
