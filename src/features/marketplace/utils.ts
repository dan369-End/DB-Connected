import { OrderStatus, PaymentMethod, PaymentStatus } from '@/types';

/**
 * Formats a numeric price and currency string according to DB-Connect rules.
 * Specifically converts 'XAF' or default central/west African currency into "25 000 FCFA".
 */
export function formatProductPrice(price?: number | null, currency = 'XAF'): string {
  if (price === null || price === undefined) {
    return 'Prix sur demande';
  }

  // Format with French space thousand separators
  const formattedNumber = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(price);

  const curr = (currency || 'XAF').toUpperCase();
  if (curr === 'XAF' || curr === 'FCFA') {
    return `${formattedNumber} FCFA`;
  }

  return `${formattedNumber} ${curr}`;
}

/**
 * Calculates stock availability presentation without inventing numbers.
 */
export function getStockStatus(quantity?: number | null): {
  label: string;
  statusClass: 'in-stock' | 'limited-stock' | 'out-of-stock';
} {
  const stock = quantity ?? 0;
  if (stock <= 0) {
    return { label: 'Rupture de stock', statusClass: 'out-of-stock' };
  }
  if (stock <= 5) {
    return { label: 'Stock limité', statusClass: 'limited-stock' };
  }
  return { label: 'En stock', statusClass: 'in-stock' };
}

/**
 * Returns user-facing label and styling class for OrderStatus
 */
export function getOrderStatusConfig(status?: string | null): {
  label: string;
  className: string;
  stepIndex: number;
} {
  switch (status) {
    case 'pending':
      return { label: 'En attente', className: 'status-order-pending', stepIndex: 0 };
    case 'confirmed':
      return { label: 'Confirmée', className: 'status-order-confirmed', stepIndex: 1 };
    case 'preparing':
      return { label: 'En préparation', className: 'status-order-preparing', stepIndex: 2 };
    case 'ready':
      return { label: 'Prête', className: 'status-order-ready', stepIndex: 3 };
    case 'shipped':
      return { label: 'En livraison', className: 'status-order-shipped', stepIndex: 4 };
    case 'delivered':
      return { label: 'Livrée', className: 'status-order-delivered', stepIndex: 5 };
    case 'cancelled':
      return { label: 'Annulée', className: 'status-order-cancelled', stepIndex: -1 };
    default:
      return { label: 'En attente', className: 'status-order-pending', stepIndex: 0 };
  }
}

export const ORDER_TIMELINE_STEPS = [
  { key: 'pending', label: 'Commande reçue' },
  { key: 'confirmed', label: 'Confirmée' },
  { key: 'preparing', label: 'Préparation' },
  { key: 'ready', label: 'Prête' },
  { key: 'shipped', label: 'En livraison' },
  { key: 'delivered', label: 'Livrée' },
];

/**
 * Returns user-facing label for payment method.
 * Handles legacy orders defaulting to cash_on_delivery.
 */
export function getPaymentMethodLabel(method?: string | null): string {
  switch (method) {
    case 'cash_on_delivery':
      return 'Paiement à la livraison';
    case 'mobile_money':
      return 'Mobile Money';
    case 'manual_transfer':
      return 'Transfert manuel';
    default:
      return 'Paiement à la livraison';
  }
}

/**
 * Returns user-facing label and CSS badge styling for payment status.
 * Handles legacy orders defaulting to unpaid.
 */
export function getPaymentStatusConfig(status?: string | null): {
  label: string;
  className: string;
} {
  switch (status) {
    case 'unpaid':
      return { label: 'Non payé', className: 'badge-payment-unpaid' };
    case 'pending':
      return { label: 'En attente', className: 'badge-payment-pending' };
    case 'paid':
      return { label: 'Payé', className: 'badge-payment-paid' };
    case 'failed':
      return { label: 'Échoué', className: 'badge-payment-failed' };
    case 'refunded':
      return { label: 'Remboursé', className: 'badge-payment-refunded' };
    default:
      return { label: 'Non payé', className: 'badge-payment-unpaid' };
  }
}
