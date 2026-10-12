import React, { useState, useEffect } from 'react';
import { fetchServiceById } from '../servicesService';
import { useNavigation } from '@/hooks/useNavigation';
import { formatServicePrice } from '../utils';
import { getServiceImageUrl } from '../utils/servicesStorage';
import { ServiceRequestModal } from './ServiceRequestModal';
import { ContactRequestModal } from '@/features/requests';
import { ServicesIcon } from '@/components/icons';
import type { ServiceRecord, ContactRequestType } from '@/types';

interface ServiceDetailProps {
  serviceId: string;
}

export const ServiceDetail: React.FC<ServiceDetailProps> = ({ serviceId }) => {
  const { navigate } = useNavigation();
  const [service, setService] = useState<ServiceRecord | null>(null);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactModalType, setContactModalType] = useState<ContactRequestType>('quote');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setErrorMessage(null);

    fetchServiceById(serviceId).then((res) => {
      if (!isCancelled) {
        if (res.error || !res.service) {
          setErrorMessage(res.error || 'Service introuvable.');
        } else {
          setService(res.service);

          // Resolve signed URL for image
          if (res.service.image_url) {
            getServiceImageUrl(res.service.image_url).then((url) => {
              if (!isCancelled) setResolvedImageUrl(url);
            });
          } else {
            setResolvedImageUrl(null);
          }
        }
        setLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [serviceId]);

  if (loading) {
    return (
      <div className="academy-loading-box">
        <div className="spinner large"></div>
        <p>Chargement du service...</p>
      </div>
    );
  }

  if (errorMessage || !service) {
    return (
      <div className="academy-error-box">
        <p>{errorMessage || 'Ce service n\'est pas disponible actuellement.'}</p>
        <button
          type="button"
          className="btn-back-catalog"
          onClick={() => navigate('services')}
        >
          Retourner aux services
        </button>
      </div>
    );
  }

  const categoryName = service.services_categories?.name || service.category?.name;
  const formattedPrice = formatServicePrice(service.price_from, service.currency || 'XAF');
  const hasValidImage = Boolean(resolvedImageUrl && !imageError);

  return (
    <div className="product-detail-page-container">
      {/* Top Breadcrumb */}
      <div className="product-detail-nav">
        <button
          type="button"
          className="btn-back-breadcrumb"
          onClick={() => navigate('services')}
        >
          &larr; Retour aux services
        </button>
      </div>

      <div className="product-detail-layout">
        {/* Left: Service Image presentation */}
        <div className="product-detail-media-card">
          <div className="detail-image-box">
            {hasValidImage ? (
              <img
                src={resolvedImageUrl!}
                alt={service.title}
                className="detail-main-img"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="product-card-fallback large-fallback">
                <ServicesIcon size={70} />
              </div>
            )}
          </div>
        </div>

        {/* Right: Service Meta, Price & Action */}
        <div className="product-detail-info-card">
          <div className="product-header-group">
            {categoryName && (
              <span className="product-detail-category-badge">{categoryName}</span>
            )}
            <h1 className="product-detail-title">{service.title}</h1>
          </div>

          <div className="product-price-section">
            <span className="price-tag-label">Tarif indicatif :</span>
            <div className="price-tag-main font-mono">{formattedPrice}</div>
          </div>

          {service.short_description && (
            <p className="product-detail-short-desc">
              {service.short_description}
            </p>
          )}

          {/* Action Buttons: Demander un devis & Contacter l'équipe */}
          <div className="product-cart-action-box" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-admin-cta primary btn-large-cart"
              onClick={() => {
                setContactModalType('quote');
                setIsContactModalOpen(true);
              }}
            >
              Demander un devis
            </button>
            <button
              type="button"
              className="btn-admin-cta secondary"
              style={{ width: '100%', padding: '0.75rem 1.25rem', textAlign: 'center', justifyContent: 'center' }}
              onClick={() => {
                setContactModalType('contact');
                setIsContactModalOpen(true);
              }}
            >
              Contacter l'équipe
            </button>
          </div>

          {/* Full description strictly from database */}
          {service.description && (
            <div className="product-description-block">
              <h2 className="description-heading">Description de la prestation</h2>
              <div className="description-text-content">
                {service.description.split('\n').map((paragraph, index) => (
                  paragraph.trim() ? <p key={index}>{paragraph}</p> : null
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legacy Request Modal */}
      {isRequestModalOpen && (
        <ServiceRequestModal
          service={service}
          onClose={() => setIsRequestModalOpen(false)}
          onSuccess={() => {
            setIsRequestModalOpen(false);
            navigate('services_requests');
          }}
        />
      )}

      {/* Centralized Contact / Quote Request Modal */}
      {isContactModalOpen && (
        <ContactRequestModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          requestType={contactModalType}
          sourceType="service"
          service={service}
        />
      )}
    </div>
  );
};
