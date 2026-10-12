import React, { useState, useEffect } from 'react';
import { formatProductPrice, getStockStatus } from '../utils';
import { getMarketplaceImageUrl } from '../utils/imageStorage';
import { MarketplaceIcon, ArrowRightIcon } from '@/components/icons';
import type { MarketplaceProduct } from '@/types';

interface ProductCardProps {
  product: MarketplaceProduct;
  onView: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onView }) => {
  const categoryName = product.marketplace_categories?.name || product.category?.name;
  const stock = getStockStatus(product.stock_quantity);
  const formattedPrice = formatProductPrice(product.price, product.currency || 'XAF');

  // Resolved Signed URL for private Storage image or direct URL
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(Boolean(product.image_url));

  useEffect(() => {
    let isCancelled = false;

    if (product.image_url) {
      setImageLoading(true);
      getMarketplaceImageUrl(product.image_url)
        .then((url) => {
          if (!isCancelled) {
            setResolvedImageUrl(url);
            setImageLoading(false);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setResolvedImageUrl(null);
            setImageLoading(false);
          }
        });
    } else {
      setResolvedImageUrl(null);
      setImageLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [product.image_url]);

  return (
    <div
      className="product-card"
      onClick={() => onView(product.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onView(product.id);
        }
      }}
    >
      {/* Product Image / Private Signed URL or Fallback */}
      <div className="product-card-image-box">
        {imageLoading ? (
          <div className="product-card-fallback loading">
            <div className="spinner"></div>
          </div>
        ) : resolvedImageUrl ? (
          <img
            src={resolvedImageUrl}
            alt={product.name}
            className="product-card-img"
            loading="lazy"
            onError={() => setResolvedImageUrl(null)}
          />
        ) : (
          <div className="product-card-fallback">
            <MarketplaceIcon size={36} />
          </div>
        )}

        {categoryName && (
          <span className="product-category-chip">{categoryName}</span>
        )}

        <span className={`product-stock-chip stock-${stock.statusClass}`}>
          {stock.label}
        </span>
      </div>

      {/* Content */}
      <div className="product-card-content">
        <h3 className="product-card-title">{product.name}</h3>

        {product.short_description && (
          <p className="product-card-short-desc">{product.short_description}</p>
        )}

        <div className="product-card-price-row">
          <span className="product-card-price">{formattedPrice}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="product-card-footer">
        <button
          type="button"
          className="btn-product-action"
          onClick={(e) => {
            e.stopPropagation();
            onView(product.id);
          }}
        >
          <span>Voir le produit</span>
          <ArrowRightIcon size={14} />
        </button>
      </div>
    </div>
  );
};
