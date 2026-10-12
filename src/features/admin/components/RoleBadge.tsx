import React from 'react';
import type { UserRoleName } from '@/types';

interface RoleBadgeProps {
  role: UserRoleName | string;
  size?: 'sm' | 'md';
  onRemove?: () => void;
  canRemove?: boolean;
}

export const ROLE_LABELS: Record<string, string> = {
  user: 'Utilisateur',
  academy_admin: 'Admin Académie',
  marketplace_admin: 'Admin Marketplace',
  services_admin: 'Admin Services',
  editor: 'Éditeur Opportunités',
  super_admin: 'Super Admin',
};

const ROLE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  super_admin: {
    bg: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.4)',
    text: '#c084fc',
  },
  academy_admin: {
    bg: 'rgba(37, 99, 235, 0.15)',
    border: 'rgba(56, 189, 248, 0.4)',
    text: '#38bdf8',
  },
  marketplace_admin: {
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.4)',
    text: '#34d399',
  },
  services_admin: {
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)',
    text: '#fbbf24',
  },
  editor: {
    bg: 'rgba(20, 184, 166, 0.15)',
    border: 'rgba(20, 184, 166, 0.4)',
    text: '#2dd4bf',
  },
  user: {
    bg: 'rgba(148, 163, 184, 0.1)',
    border: 'rgba(148, 163, 184, 0.25)',
    text: '#94a3b8',
  },
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'md',
  onRemove,
  canRemove = false,
}) => {
  const label = ROLE_LABELS[role] || role;
  const style = ROLE_STYLES[role] || {
    bg: 'rgba(148, 163, 184, 0.1)',
    border: 'rgba(148, 163, 184, 0.25)',
    text: '#94a3b8',
  };

  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: isSmall ? '0.15rem 0.45rem' : '0.25rem 0.65rem',
        fontSize: isSmall ? '0.725rem' : '0.8rem',
        fontWeight: 600,
        borderRadius: '9999px',
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        color: style.text,
        letterSpacing: '0.01em',
        lineHeight: 1.2,
      }}
    >
      <span>{label}</span>
      {canRemove && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '0 0.15rem',
            marginLeft: '0.15rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem',
            lineHeight: 1,
            opacity: 0.8,
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '0.8';
          }}
          title={`Retirer le rôle ${label}`}
          aria-label={`Retirer le rôle ${label}`}
        >
          &times;
        </button>
      )}
    </span>
  );
};
