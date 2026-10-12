import React from 'react';
import { getOrderStatusConfig } from '../utils';

interface OrderStatusBadgeProps {
  status?: string | null;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const config = getOrderStatusConfig(status);

  return (
    <span className={`order-status-badge ${config.className}`}>
      {config.label}
    </span>
  );
};
