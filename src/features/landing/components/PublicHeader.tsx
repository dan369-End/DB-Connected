import React, { useState } from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { MenuIcon, CloseIcon } from '@/components/icons';

interface PublicHeaderProps {
  onOpenAuth?: (mode: 'signin' | 'signup') => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({ onOpenAuth }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { navigate } = useNavigation();

  const navItems = [
    { label: 'Accueil', href: '#hero' },
    { label: 'Académie', href: '#academie' },
    { label: 'Marketplace', href: '#marketplace' },
    { label: 'Services', href: '#services' },
    { label: 'Opportunités', href: '#opportunites' },
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogin = () => {
    setMobileMenuOpen(false);
    if (onOpenAuth) onOpenAuth('signin');
    navigate('login');
  };

  const handleRegister = () => {
    setMobileMenuOpen(false);
    if (onOpenAuth) onOpenAuth('signup');
    navigate('register');
  };

  return (
    <header className="public-header">
      <div className="public-header-container">
        {/* Brand Logo */}
        <a href="#hero" className="public-brand-link" onClick={() => handleNavClick('#hero')}>
          <span className="sidebar-brand-badge">DB</span>
          <div className="public-brand-text">
            <span className="public-brand-title">DB-Connect</span>
            <span className="public-brand-sub">Passerelle Numérique</span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="public-nav-desktop" aria-label="Navigation publique">
          <ul className="public-nav-list">
            {navItems.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="public-nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.href);
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop Auth CTAs */}
        <div className="public-auth-cluster">
          <button
            type="button"
            className="btn-public-secondary"
            onClick={handleLogin}
          >
            Se connecter
          </button>
          <button
            type="button"
            className="btn-public-primary"
            onClick={handleRegister}
          >
            Créer un compte
          </button>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          className="public-mobile-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {mobileMenuOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="public-mobile-drawer">
          <ul className="public-mobile-nav-list">
            {navItems.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="public-mobile-nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.href);
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="public-mobile-auth-actions">
            <button
              type="button"
              className="btn-public-secondary full-w"
              onClick={handleLogin}
            >
              Se connecter
            </button>
            <button
              type="button"
              className="btn-public-primary full-w"
              onClick={handleRegister}
            >
              Créer un compte
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
