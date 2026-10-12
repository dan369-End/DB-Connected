import React from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import type { UserRoleName } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Ensures the user has an active Supabase session.
 * If loading, renders a dedicated non-blocking loading state.
 * If not authenticated, redirects/renders public auth entry.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback = null,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen" role="status">
        <div className="spinner large"></div>
        <p className="loading-text">Vérification de la session en cours...</p>
      </div>
    );
  }

  if (!user) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRoleName[];
  fallback?: React.ReactNode;
}

/**
 * Reusable role-based access controller.
 * Checks whether the authenticated user has at least one of the allowed roles
 * based strictly on public.user_roles + public.roles fetched from Supabase.
 * 
 * Note: Frontend guards improve UX and routing. True authorization is strictly
 * enforced on the backend via Postgres Row Level Security (RLS) policies.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback = null,
}) => {
  const { roles, isLoading, isProfileLoading } = useAuth();

  if (isLoading || isProfileLoading) {
    return (
      <div className="loading-screen" role="status">
        <div className="spinner large"></div>
        <p className="loading-text">Validation des autorisations...</p>
      </div>
    );
  }

  const hasAccess = roles.some((role) => allowedRoles.includes(role));

  if (!hasAccess) {
    return (
      <>
        {fallback || (
          <div className="auth-alert alert-error" style={{ margin: '2rem auto', maxWidth: '500px' }}>
            <strong>Accès restreint</strong>
            <p style={{ marginTop: '0.35rem', fontSize: '0.85rem' }}>
              Vous ne disposez pas des autorisations nécessaires pour accéder à cette section.
            </p>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
};
