import React, { useState, useEffect } from 'react';
import { formatServicePrice } from '../utils';
import { getServiceImageUrl } from '../utils/servicesStorage';
import { ServicesIcon, ArrowRightIcon } from '@/components/icons';
import type { ServiceRecord } from '@/types';

interface ServiceCardProps {
  service: ServiceRecord;
  onView: (serviceId: string) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onView }) => {
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const categoryName = service.services_categories?.name || service.category?.name;
  const formattedPrice = formatServicePrice(service.price_from, service.currency || 'XAF');

  useEffect(() => {
    let isCancelled = false;
    setImageError(false);

    if (service.image_url) {
      getServiceImageUrl(service.image_url).then((url) => {
        if (!isCancelled) {
          setResolvedImageUrl(url);
        }
      });
    } else {
      setResolvedImageUrl(null);
    }

    return () => {
      isCancelled = true;
    };
  }, [service.image_url]);

  const hasValidImage = Boolean(resolvedImageUrl && !imageError);

  return (
    <div
      className="product-card service-card"
      onClick={() => onView(service.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onView(service.id);
        }
      }}
    >
      {/* Service Image / Placeholder */}
      <div className="product-card-image-box">
        {hasValidImage ? (
          <img
            src={resolvedImageUrl!}
            alt={service.title}
            className="product-card-img"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="product-card-fallback">
            <ServicesIcon size={46} />
          </div>
        )}

        {categoryName && (
          <span className="product-category-chip">{categoryName}</span>
        )}
      </div>

      {/* Service Details */}
      <div className="product-card-body">
        <h3 className="product-card-title" title={service.title}>
          {service.title}
        </h3>

        {service.short_description && (
          <p className="product-card-desc" title={service.short_description}>
            {service.short_description}
          </p>
        )}

        <div className="product-card-footer">
          <div className="product-price-box">
            <span className="product-price-amount font-mono">
              {formattedPrice}
            </span>
          </div>

          <button
            type="button"
            className="btn-product-action"
            onClick={(e) => {
              e.stopPropagation();
              onView(service.id);
            }}
            aria-label={`Voir le service ${service.title}`}
          >
            <span>Voir le service</span>
            <ArrowRightIcon size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
