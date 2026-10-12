import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigation } from '@/hooks/useNavigation';
import { useCart } from '../context/CartContext';
import { formatProductPrice, getStockStatus } from '../utils';
import { getMarketplaceImageUrl } from '../utils/imageStorage';
import { CartIndicatorButton } from './CartIndicatorButton';
import { MarketplaceIcon, CartIcon } from '@/components/icons';
import type { MarketplaceProduct } from '@/types';

interface ProductDetailProps {
  productId: string;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ productId }) => {
  const { navigate } = useNavigation();
  const { addToCart, getItemQuantity } = useCart();
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cartFeedback, setCartFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select(`
          *,
          marketplace_categories ( id, name )
        `)
        .eq('id', productId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setErrorMessage("Ce produit n'est plus disponible ou est introuvable.");
      } else {
        const prod = data as MarketplaceProduct;
        setProduct(prod);

        // Resolve image URL (signed URL if private storage path, or direct if http)
        if (prod.image_url) {
          setImageLoading(true);
          getMarketplaceImageUrl(prod.image_url)
            .then((url) => {
              setResolvedImageUrl(url);
              setImageLoading(false);
            })
            .catch(() => {
              setResolvedImageUrl(null);
              setImageLoading(false);
            });
        }
      }
    } catch (err) {
      console.warn('[DB-Connect Marketplace] Error loading product:', err);
      setErrorMessage("Impossible de charger le produit pour le moment.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleAddToCart = () => {
    if (!product) return;
    const res = addToCart(product, 1);
    if (res.success) {
      setCartFeedback({
        message: 'Produit ajouté à votre panier avec succès.',
        type: 'success',
      });
      setTimeout(() => setCartFeedback(null), 3000);
    } else {
      setCartFeedback({
        message: res.message || 'Impossible d\'ajouter au panier.',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="academy-loading-box">
        <div className="spinner large"></div>
        <p>Chargement des détails du produit...</p>
      </div>
    );
  }

  if (errorMessage || !product) {
    return (
      <div className="academy-error-box">
        <p>{errorMessage || 'Produit introuvable.'}</p>
        <button
          type="button"
          className="btn-back-catalog"
          onClick={() => navigate('marketplace')}
        >
          Retour au Marketplace
        </button>
      </div>
    );
  }

  const categoryName = product.marketplace_categories?.name || product.category?.name;
  const stock = getStockStatus(product.stock_quantity);
  const formattedPrice = formatProductPrice(product.price, product.currency || 'XAF');
  const maxStock = product.stock_quantity ?? 0;
  const inCartQty = getItemQuantity(product.id);
  const isOutOfStock = maxStock <= 0;
  const isMaxInCart = inCartQty >= maxStock;

  return (
    <div className="product-detail-view">
      <div className="product-detail-top-nav">
        <button
          type="button"
          className="btn-back-breadcrumb"
          onClick={() => navigate('marketplace')}
        >
          &larr; Retour au catalogue Marketplace
        </button>

        <CartIndicatorButton />
      </div>

      <div className="product-detail-layout">
        {/* Left: Image Box */}
        <div className="product-detail-image-card">
          {imageLoading ? (
            <div className="product-detail-fallback-box">
              <div className="spinner large"></div>
              <span>Chargement de l'image...</span>
            </div>
          ) : resolvedImageUrl ? (
            <img
              src={resolvedImageUrl}
              alt={product.name}
              className="product-detail-main-img"
              onError={() => setResolvedImageUrl(null)}
            />
          ) : (
            <div className="product-detail-fallback-box">
              <MarketplaceIcon size={64} />
              <span>Aucune image fournie pour ce produit</span>
            </div>
          )}
        </div>

        {/* Right: Info & Commercial Zone */}
        <div className="product-detail-info-card">
          <div className="product-info-header">
            {categoryName && (
              <span className="product-detail-category-badge">{categoryName}</span>
            )}
            <h1 className="product-detail-title">{product.name}</h1>

            <div className="product-price-and-stock">
              <span className="product-detail-price">{formattedPrice}</span>
              <span className={`product-stock-chip stock-${stock.statusClass}`}>
                {stock.label}
              </span>
            </div>
          </div>

          {product.short_description && (
            <div className="product-detail-short-desc">
              <p>{product.short_description}</p>
            </div>
          )}

          {/* Cart Feedback Notification */}
          {cartFeedback && (
            <div
              className={`auth-alert ${cartFeedback.type === 'success' ? 'alert-success' : 'alert-error'}`}
              role="alert"
            >
              {cartFeedback.message}
            </div>
          )}

          {/* Action Zone: Add to Cart */}
          <div className="product-add-cart-zone">
            <button
              type="button"
              className="btn-add-to-cart-large"
              onClick={handleAddToCart}
              disabled={isOutOfStock || isMaxInCart}
            >
              <CartIcon size={20} />
              <span>
                {isOutOfStock
                  ? 'Rupture de stock'
                  : isMaxInCart
                  ? `Stock maximal atteint dans le panier (${inCartQty})`
                  : inCartQty > 0
                  ? `Ajouter un exemplaire (actuellement : ${inCartQty})`
                  : 'Ajouter au panier'}
              </span>
            </button>
          </div>

          {/* Full description */}
          {product.description && (
            <div className="product-detail-description-section">
              <h2 className="detail-sub-heading">Description détaillée</h2>
              <div className="product-full-text">
                {product.description.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
