import React from 'react';
import { useAuth } from '@/features/auth';

interface BaseLayoutProps {
  children: React.ReactNode;
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({ children }) => {
  const { user, primaryRole, signOut } = useAuth();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-logo-group">
            <span className="brand-badge">DB-Connect</span>
            <span className="brand-title">Votre passerelle vers le numérique</span>
          </div>

          {user && (
            <div className="header-user-status">
              <span className="header-user-email">{user.email}</span>
              <span className={`header-role-badge role-${primaryRole}`}>
                {primaryRole}
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                className="btn-header-signout"
                title="Se déconnecter"
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="app-content">
        {children}
      </main>

      <footer className="app-footer">
        <p className="footer-text">
          &copy; {new Date().getFullYear()} DB-Connect &bull; « Votre passerelle vers le numérique. » &bull; Tous droits réservés.
        </p>
      </footer>
    </div>
  );
};
