import type { ServiceRequestStatus, ServiceStatus } from '@/types';

/**
 * Formats a starting price for services:
 * If price_from is null/undefined => "Sur devis"
 * If price_from is a number => "À partir de 25 000 FCFA"
 */
export function formatServicePrice(priceFrom?: number | null, currency = 'XAF'): string {
  if (priceFrom === null || priceFrom === undefined) {
    return 'Sur devis';
  }

  const formattedNumber = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(priceFrom);

  const curr = (currency || 'XAF').toUpperCase();
  const symbol = (curr === 'XAF' || curr === 'FCFA') ? 'FCFA' : curr;

  return `À partir de ${formattedNumber} ${symbol}`;
}

/**
 * Returns human-readable label and CSS classes for ServiceRequestStatus
 */
export function getServiceRequestStatusConfig(status?: string | null): {
  label: string;
  className: string;
} {
  switch (status) {
    case 'pending':
      return { label: 'En attente', className: 'badge-service-pending' };
    case 'contacted':
      return { label: 'Contacté', className: 'badge-service-contacted' };
    case 'in_progress':
      return { label: 'En cours', className: 'badge-service-progress' };
    case 'completed':
      return { label: 'Terminée', className: 'badge-service-completed' };
    case 'cancelled':
      return { label: 'Annulée', className: 'badge-service-cancelled' };
    default:
      return { label: 'En attente', className: 'badge-service-pending' };
  }
}

/**
 * Returns human-readable label and CSS classes for ServiceStatus
 */
export function getServiceStatusConfig(status?: string | null): {
  label: string;
  className: string;
} {
  switch (status) {
    case 'published':
      return { label: 'Publié', className: 'badge-status-published' };
    case 'draft':
      return { label: 'Brouillon', className: 'badge-status-draft' };
    case 'archived':
      return { label: 'Archivé', className: 'badge-status-archived' };
    default:
      return { label: 'Brouillon', className: 'badge-status-draft' };
  }
}

/**
 * Converts a text title into a URL-friendly slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
