import { supabase } from '@/lib/supabase';
import type { MarketplaceOrder, OrderStatus, PaymentMethod } from '@/types';

export interface CreateOrderParams {
  fullName: string;
  phone: string;
  email?: string;
  deliveryAddress: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  items: Array<{ product_id: string; quantity: number }>;
}

export interface CreateOrderResult {
  orderId?: string;
  error?: string;
}

/**
 * Creates an order strictly and exclusively via the secure Supabase RPC:
 * public.create_marketplace_order(
 *   p_full_name,
 *   p_phone,
 *   p_email,
 *   p_delivery_address,
 *   p_notes,
 *   p_payment_method,
 *   p_items
 * )
 *
 * NOTE: The frontend NEVER sends payment_status, payment_reference, paid_at, price,
 * unit_price, line_total, subtotal, status, user_id or order_number.
 * PostgreSQL calculates everything from public.marketplace_products and handles stock decrement atomically.
 */
export async function createMarketplaceOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  if (!supabase) {
    return { error: 'Client de base de données non initialisé.' };
  }

  // Format p_items strictly as requested: [{ product_id, quantity }]
  const formattedItems = params.items.map((it) => ({
    product_id: it.product_id,
    quantity: Math.max(1, Math.floor(it.quantity)),
  }));

  try {
    const { data, error } = await supabase.rpc('create_marketplace_order', {
      p_full_name: params.fullName.trim(),
      p_phone: params.phone.trim(),
      p_email: params.email ? params.email.trim() : null,
      p_delivery_address: params.deliveryAddress.trim(),
      p_notes: params.notes ? params.notes.trim() : null,
      p_payment_method: params.paymentMethod,
      p_items: formattedItems,
    });

    if (error) {
      console.warn('[DB-Connect Marketplace RPC Error]:', error.message);

      const msg = error.message.toLowerCase();
      if (msg.includes('stock') || msg.includes('insuffisant') || msg.includes('quantité')) {
        return {
          error: "Stock insuffisant : l'un des articles demandés n'a plus assez d'exemplaires disponibles. Veuillez mettre à jour votre panier.",
        };
      }
      if (msg.includes('indisponible') || msg.includes('published') || msg.includes('statut')) {
        return {
          error: "Un des produits du panier n'est plus commercialisé. Veuillez retirer cet article de votre panier.",
        };
      }
      if (msg.includes('auth') || msg.includes('jwt') || msg.includes('session')) {
        return {
          error: 'Votre session a expiré. Veuillez vous reconnecter pour passer la commande.',
        };
      }
      if (msg.includes('panier vide') || msg.includes('items')) {
        return {
          error: 'Votre panier est vide.',
        };
      }

      return {
        error: error.message || 'Impossible de finaliser la commande. Veuillez vérifier vos coordonnées et réessayer.',
      };
    }

    if (!data) {
      return { error: 'Aucun identifiant de commande retourné.' };
    }

    return { orderId: String(data) };
  } catch (err: unknown) {
    console.warn('[DB-Connect Marketplace] Order placement exception:', err);
    return {
      error: 'Une erreur réseau est survenue lors de la validation. Veuillez réessayer.',
    };
  }
}

/**
 * Fetch the authenticated user's orders (governed by RLS).
 */
export async function fetchUserOrders(): Promise<{ orders: MarketplaceOrder[]; error?: string }> {
  if (!supabase) return { orders: [] };

  try {
    const { data, error } = await supabase
      .from('marketplace_orders')
      .select(`
        *,
        marketplace_order_items (
          id,
          product_id,
          product_name,
          unit_price,
          quantity,
          line_total
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[DB-Connect Marketplace] Error fetching orders:', error.message);
      return { orders: [], error: 'Impossible de récupérer vos commandes pour le moment.' };
    }

    return { orders: (data as MarketplaceOrder[]) || [] };
  } catch (err) {
    return { orders: [], error: 'Erreur inattendue lors de la récupération des commandes.' };
  }
}

/**
 * Fetch a single order with historical line items.
 */
export async function fetchOrderDetail(orderId: string): Promise<{ order: MarketplaceOrder | null; error?: string }> {
  if (!supabase) return { order: null };

  try {
    const { data, error } = await supabase
      .from('marketplace_orders')
      .select(`
        *,
        marketplace_order_items (
          id,
          product_id,
          product_name,
          unit_price,
          quantity,
          line_total
        )
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (error) {
      console.warn('[DB-Connect Marketplace] Error fetching order detail:', error.message);
      return { order: null, error: 'Impossible de charger la commande.' };
    }

    return { order: (data as MarketplaceOrder) || null };
  } catch (err) {
    return { order: null, error: 'Erreur inattendue.' };
  }
}

/**
 * Fetch all orders for back-office admin (governed by RLS for marketplace_admin/super_admin).
 */
export async function fetchAdminOrders(): Promise<{ orders: MarketplaceOrder[]; error?: string }> {
  if (!supabase) return { orders: [] };

  try {
    const { data, error } = await supabase
      .from('marketplace_orders')
      .select(`
        *,
        marketplace_order_items (
          id,
          product_id,
          product_name,
          unit_price,
          quantity,
          line_total
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[DB-Connect Marketplace Admin] Orders fetch error:', error.message);
      return { orders: [], error: 'Impossible de récupérer les commandes.' };
    }

    return { orders: (data as MarketplaceOrder[]) || [] };
  } catch (err) {
    return { orders: [], error: 'Erreur inattendue lors du chargement des commandes.' };
  }
}

/**
 * Update an order's progressive status (admin only: marketplace_admin / super_admin).
 * Used ONLY for forward progression (pending -> confirmed -> preparing -> ready -> shipped -> delivered).
 * NEVER used for cancellation!
 */
export async function updateOrderStatus(orderId: string, newStatus: Exclude<OrderStatus, 'cancelled'>): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Client indisponible' };

  try {
    const { error } = await supabase
      .from('marketplace_orders')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      console.warn('[DB-Connect Marketplace Admin] Status update error:', error.message);
      return { success: false, error: 'Impossible de modifier le statut de la commande.' };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Erreur inattendue lors de la mise à jour.' };
  }
}

/**
 * Cancels a marketplace order exclusively via the secure PostgreSQL RPC:
 * public.cancel_marketplace_order(p_order_id)
 *
 * This database function:
 * 1. Verifies marketplace_admin / super_admin permissions
 * 2. Locks the order record
 * 3. Rejects if already cancelled or already delivered
 * 4. Atomically restores the stock in marketplace_products from marketplace_order_items
 * 5. Updates status to 'cancelled'
 *
 * The frontend NEVER restores stock manually.
 */
export async function cancelMarketplaceOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Client de base de données non initialisé.' };
  }

  try {
    const { error } = await supabase.rpc('cancel_marketplace_order', {
      p_order_id: orderId,
    });

    if (error) {
      console.warn('[DB-Connect Marketplace Admin] Cancel order RPC error:', error.message);

      const msg = error.message.toLowerCase();
      if (msg.includes('déjà annulée') || msg.includes('already cancelled') || msg.includes('deja annulee')) {
        return { success: false, error: 'Cette commande a déjà été annulée.' };
      }
      if (msg.includes('livrée') || msg.includes('delivered') || msg.includes('livree')) {
        return { success: false, error: 'Une commande déjà livrée ne peut pas être annulée.' };
      }
      if (msg.includes('accès refusé') || msg.includes('permission') || msg.includes('unauthorized') || msg.includes('acces refuse') || msg.includes('role')) {
        return { success: false, error: "Vous n'avez pas l'autorisation d'annuler cette commande." };
      }
      if (msg.includes('introuvable') || msg.includes('not found')) {
        return { success: false, error: 'Cette commande n\'existe plus.' };
      }

      return {
        success: false,
        error: error.message || 'Impossible d\'annuler la commande pour le moment.',
      };
    }

    return { success: true };
  } catch (err: unknown) {
    console.warn('[DB-Connect Marketplace Admin] Cancel order exception:', err);
    return {
      success: false,
      error: 'Une erreur de communication est survenue lors de l\'annulation.',
    };
  }
}
