import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { CartItem, MarketplaceProduct } from '@/types';

export const CART_STORAGE_KEY = 'dbconnect_marketplace_cart';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addToCart: (product: MarketplaceProduct, quantity?: number) => { success: boolean; message?: string };
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * Validates and restores cart items from localStorage safely.
 */
function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Rigorous item validation
    const validItems: CartItem[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item.product_id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.quantity === 'number' &&
        item.quantity > 0
      ) {
        validItems.push({
          product_id: item.product_id,
          name: item.name,
          price: typeof item.price === 'number' ? item.price : null,
          currency: item.currency || 'XAF',
          quantity: Math.max(1, Math.floor(item.quantity)),
          image_url: item.image_url || null,
          stock_quantity: typeof item.stock_quantity === 'number' ? item.stock_quantity : 0,
        });
      }
    }
    return validItems;
  } catch (err) {
    console.warn('[DB-Connect Cart] Failed to parse cart from storage:', err);
    return [];
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => loadCartFromStorage());

  // Synchronize cart with localStorage upon modification
  useEffect(() => {
    try {
      if (items.length === 0) {
        localStorage.removeItem(CART_STORAGE_KEY);
      } else {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      }
    } catch (err) {
      console.warn('[DB-Connect Cart] Failed to persist cart to storage:', err);
    }
  }, [items]);

  // Total quantity count across all lines
  const itemCount = useMemo(() => {
    return items.reduce((acc, it) => acc + it.quantity, 0);
  }, [items]);

  // Informative estimated subtotal for UI only
  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => {
      const price = it.price ?? 0;
      return acc + price * it.quantity;
    }, 0);
  }, [items]);

  const getItemQuantity = useCallback((productId: string): number => {
    const found = items.find((i) => i.product_id === productId);
    return found ? found.quantity : 0;
  }, [items]);

  const addToCart = useCallback((product: MarketplaceProduct, addQty = 1): { success: boolean; message?: string } => {
    const maxStock = product.stock_quantity ?? 0;

    if (maxStock <= 0) {
      return { success: false, message: 'Ce produit est en rupture de stock.' };
    }

    let result: { success: boolean; message?: string } = { success: true };

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((it) => it.product_id === product.id);

      if (existingIndex > -1) {
        const currentQty = prevItems[existingIndex].quantity;
        const newQty = currentQty + addQty;

        if (newQty > maxStock) {
          result = {
            success: false,
            message: `Stock insuffisant : vous avez déjà ${currentQty} exemplaire(s) dans votre panier (max ${maxStock}).`,
          };
          return prevItems;
        }

        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          stock_quantity: maxStock,
        };
        return updated;
      } else {
        if (addQty > maxStock) {
          result = {
            success: false,
            message: `Stock insuffisant : seulement ${maxStock} unité(s) disponible(s).`,
          };
          return prevItems;
        }

        const newItem: CartItem = {
          product_id: product.id,
          name: product.name,
          price: product.price ?? null,
          currency: product.currency || 'XAF',
          quantity: Math.min(addQty, maxStock),
          image_url: product.image_url,
          stock_quantity: maxStock,
        };
        return [...prevItems, newItem];
      }
    });

    return result;
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prevItems) => {
      if (quantity <= 0) {
        return prevItems.filter((i) => i.product_id !== productId);
      }

      return prevItems.map((item) => {
        if (item.product_id === productId) {
          const clamped = Math.min(quantity, item.stock_quantity);
          return {
            ...item,
            quantity: clamped,
          };
        }
        return item;
      });
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
