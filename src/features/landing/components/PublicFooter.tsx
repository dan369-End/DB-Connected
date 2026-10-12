import React from 'react';
import { useNavigation } from '@/hooks/useNavigation';

interface PublicFooterProps {
  onOpenAuth?: (mode: 'signin' | 'signup') => void;
  onScrollTo: (sectionId: string) => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ onOpenAuth, onScrollTo }) => {
  const { navigate } = useNavigation();

  return (
    <footer className="public-footer">
      <div className="public-footer-container">
        {/* Brand Column */}
        <div className="footer-col brand-col">
          <div className="public-brand-link">
            <span className="sidebar-brand-badge">DB</span>
            <div className="public-brand-text">
              <span className="public-brand-title">DB-Connect</span>
              <span className="public-brand-sub">Passerelle Numérique</span>
            </div>
          </div>
          <p className="footer-brand-desc">
            Votre passerelle vers le numérique réunissant formation, commerce, prestations professionnelles et opportunités d'emploi.
          </p>
        </div>

        {/* Navigation Modules Column */}
        <div className="footer-col">
          <h4 className="footer-col-title">Écosystème</h4>
          <ul className="footer-links-list">
            <li>
              <button
                type="button"
                className="footer-link-btn"
                onClick={() => onScrollTo('academie')}
              >
                Académie
              </button>
            </li>
            <li>
              <button
                type="button"
                className="footer-link-btn"
                onClick={() => onScrollTo('marketplace')}
              >
                Marketplace
              </button>
            </li>
            <li>
              <button
                type="button"
                className="footer-link-btn"
                onClick={() => onScrollTo('services')}
              >
                Services
              </button>
            </li>
            <li>
              <button
                type="button"
                className="footer-link-btn"
                onClick={() => onScrollTo('opportunites')}
              >
                Opportunités
              </button>
            </li>
          </ul>
        </div>

        {/* Account Column */}
        <div className="footer-col">
          <h4 className="footer-col-title">Espace Personnel</h4>
          <ul className="footer-links-list">
            <li>
              <button
                type="button"
                className="footer-link-btn"
                onClick={() => {
                  if (onOpenAuth) onOpenAuth('signin');
                  navigate('login');
                }}
              >
                Se connecter
              </button>
            </li>
            <li>
              <button
                type="button"
                className="footer-link-btn text-cyan-400 font-medium"
                onClick={() => {
                  if (onOpenAuth) onOpenAuth('signup');
                  navigate('register');
                }}
              >
                Créer un compte
              </button>
            </li>
          </ul>
        </div>

        {/* Legal & Contact Info Placeholders */}
        <div className="footer-col">
          <h4 className="footer-col-title">Informations</h4>
          <ul className="footer-links-list">
            <li>
              <span className="footer-link-muted">Conditions d'utilisation</span>
            </li>
            <li>
              <span className="footer-link-muted">Politique de confidentialité</span>
            </li>
            <li>
              <span className="footer-link-muted">Contact & Assistance</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="public-footer-bottom">
        <div className="footer-bottom-container">
          <p className="footer-copy">
            &copy; {new Date().getFullYear()} DB-Connect. Tous droits réservés.
          </p>
          <p className="footer-tagline">
            "Votre passerelle vers le numérique."
          </p>
        </div>
      </div>
    </footer>
  );
};
