import React from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { AuthVisualPanel } from './AuthVisualPanel';
import { ArrowLeftIcon } from '@/components/icons';

interface AuthLayoutProps {
  children: React.ReactNode;
  tagline?: string;
  quote?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, tagline, quote }) => {
  const { navigate } = useNavigation();

  return (
    <div className="auth-page-root">
      <div className="auth-page-container">
        {/* Left Column: Visual Panel (Desktop) */}
        <AuthVisualPanel tagline={tagline} quote={quote} />

        {/* Right Column: Form Container */}
        <div className="auth-form-panel">
          <div className="auth-panel-top-nav">
            <button
              type="button"
              className="btn-auth-back"
              onClick={() => navigate('home')}
            >
              <ArrowLeftIcon size={16} />
              <span>Retour à l'accueil</span>
            </button>
          </div>

          <div className="auth-panel-card-wrapper">
            <div className="auth-mobile-brand-header">
              <span className="sidebar-brand-badge">DB</span>
              <span className="auth-mobile-brand-title">DB-Connect</span>
            </div>

            {children}
          </div>

          <div className="auth-panel-footer">
            <p className="auth-footer-copyright">
              &copy; {new Date().getFullYear()} DB-Connect. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
