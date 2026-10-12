import React from 'react';
import type { ContactRequestStatus, ContactRequestType, ContactRequestSource } from '@/types';

interface RequestStatusBadgeProps {
  status: ContactRequestStatus | string;
  className?: string;
}

export const STATUS_LABELS: Record<string, string> = {
  new: 'Nouvelle',
  in_review: 'En cours d\'étude',
  quoted: 'Devis envoyé',
  accepted: 'Acceptée',
  rejected: 'Refusée',
  closed: 'Clôturée',
};

export const TYPE_LABELS: Record<string, string> = {
  contact: 'Contact',
  quote: 'Devis',
};

export const SOURCE_LABELS: Record<string, string> = {
  academy: 'Académie',
  service: 'Service',
  general: 'Général',
};

export const RequestStatusBadge: React.FC<RequestStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const label = STATUS_LABELS[status] || status;

  return (
    <span className={`request-status-badge status-${status} ${className}`}>
      <span className="status-dot" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};

export const RequestTypeBadge: React.FC<{
  type: ContactRequestType | string;
  className?: string;
}> = ({ type, className = '' }) => {
  const label = TYPE_LABELS[type] || (type === 'quote' ? 'Devis' : 'Contact');
  const isQuote = type === 'quote';

  return (
    <span className={`request-badge-type ${isQuote ? 'type-quote' : 'type-contact'} ${className}`}>
      {label}
    </span>
  );
};

export const RequestSourceBadge: React.FC<{
  source: ContactRequestSource | string;
  className?: string;
}> = ({ source, className = '' }) => {
  const label = SOURCE_LABELS[source] || source;

  return (
    <span className={`request-badge-source source-${source} ${className}`}>
      {label}
    </span>
  );
};
