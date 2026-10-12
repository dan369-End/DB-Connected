import React from 'react';
import { useAuth } from '@/features/auth';

export const WelcomePage: React.FC = () => {
  const { user, profile, primaryRole, roles, isProfileLoading, refreshProfile, signOut } = useAuth();

  return (
    <section className="welcome-section">
      <div className="welcome-card">
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span className="status-label">Session active &bull; Supabase Auth</span>
        </div>

        <h1 className="welcome-title">Bienvenue sur DB-Connect</h1>
        
        <p className="welcome-slogan">
          « Votre passerelle vers le numérique. »
        </p>

        {isProfileLoading ? (
          <div className="profile-loading-box">
            <div className="spinner"></div>
            <span>Récupération des données du profil et des rôles depuis Supabase...</span>
          </div>
        ) : (
          <div className="user-details-card">
            <div className="user-avatar-placeholder">
              {profile?.full_name
                ? profile.full_name.charAt(0).toUpperCase()
                : (user?.email?.charAt(0).toUpperCase() || 'U')}
            </div>

            <div className="user-details-body">
              <h3 className="user-email-heading">
                {profile?.full_name || user?.email}
              </h3>
              {profile?.full_name && (
                <span className="user-sub-email">{user?.email}</span>
              )}
              
              <div className="user-roles-container">
                <span className="role-tag-label">Rôle(s) vérifié(s) :</span>
                {roles.length > 0 ? (
                  roles.map((r) => (
                    <span key={r} className={`role-badge role-${r}`}>
                      {r}
                    </span>
                  ))
                ) : (
                  <span className={`role-badge role-${primaryRole}`}>
                    {primaryRole}
                  </span>
                )}
              </div>

              {profile?.created_at && (
                <div className="user-meta-info">
                  <span>Membre depuis le : {new Date(profile.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="welcome-notice">
          <p>
            Authentification sécurisée active. Les autorisations sont régies exclusivement par la base PostgreSQL via Row Level Security (RLS) et les tables de rôles associées.
          </p>
        </div>

        <div className="welcome-actions">
          <button
            type="button"
            onClick={() => refreshProfile()}
            className="btn-refresh"
            disabled={isProfileLoading}
            title="Actualiser les autorisations"
          >
            Actualiser profil
          </button>
          <button
            type="button"
            onClick={() => signOut()}
            className="btn-signout"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </section>
  );
};
