import React, { useState, useEffect } from 'react';
import { getOpportunityImageUrl } from '../utils/opportunityStorage';
import { OpportunitiesIcon } from '@/components/icons';

interface OpportunityImageProps {
  path?: string | null;
  alt: string;
  className?: string;
  fallbackIconSize?: number;
  thumbnail?: boolean;
}

export const OpportunityImage: React.FC<OpportunityImageProps> = ({
  path,
  alt,
  className = '',
  fallbackIconSize = 28,
  thumbnail = false,
}) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(path));
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    if (!path || !path.trim()) {
      setSignedUrl(null);
      setLoading(false);
      setHasError(false);
      return;
    }

    setLoading(true);
    setHasError(false);

    getOpportunityImageUrl(path)
      .then((url) => {
        if (isMounted) {
          if (url) {
            setSignedUrl(url);
          } else {
            setHasError(true);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [path]);

  if (loading) {
    return (
      <div className={`opportunity-img-placeholder loading ${thumbnail ? 'thumbnail' : ''} ${className}`}>
        <div className="opportunity-img-spinner" />
      </div>
    );
  }

  if (signedUrl && !hasError) {
    return (
      <img
        src={signedUrl}
        alt={alt}
        className={`opportunity-img ${thumbnail ? 'thumbnail' : ''} ${className}`}
        loading="lazy"
        onError={() => setHasError(true)}
      />
    );
  }

  // Fallback placeholder with stylized DB-Connect icon
  return (
    <div className={`opportunity-img-placeholder ${thumbnail ? 'thumbnail' : ''} ${className}`}>
      <OpportunitiesIcon size={fallbackIconSize} className="opportunity-img-fallback-icon" />
    </div>
  );
};
