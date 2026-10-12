import React, { useState, useEffect } from 'react';
import { getProfileAvatarSignedUrl } from '@/utils/avatarStorage';

interface UserAvatarProps {
  avatarUrl?: string | null;
  fullName?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  fullName,
  email,
  size = 40,
  className = '',
  onClick,
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setHasError(false);

    if (avatarUrl) {
      getProfileAvatarSignedUrl(avatarUrl).then((url) => {
        if (!isCancelled) {
          setResolvedUrl(url);
        }
      });
    } else {
      setResolvedUrl(null);
    }

    return () => {
      isCancelled = true;
    };
  }, [avatarUrl]);

  const initial = (fullName?.trim().charAt(0) || email?.trim().charAt(0) || 'U').toUpperCase();

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: Math.max(12, Math.floor(size * 0.42)),
  };

  if (resolvedUrl && !hasError) {
    return (
      <div
        className={`user-avatar-container ${className}`}
        style={containerStyle}
        onClick={onClick}
      >
        <img
          src={resolvedUrl}
          alt={fullName || 'Avatar utilisateur'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`user-avatar-container avatar-fallback ${className}`}
      style={{
        ...containerStyle,
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        color: '#ffffff',
      }}
      onClick={onClick}
    >
      {initial}
    </div>
  );
};
