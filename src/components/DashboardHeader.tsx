import React, { useState } from 'react';
import { useAuth } from '@/features/auth';
import { useNavigation } from '@/hooks/useNavigation';
import { NAVIGATION_ITEMS } from '@/utils/navigation';
import { MenuIcon, SearchIcon, BellIcon, ProfileIcon, LogoutIcon } from '@/components/icons';
import { UserAvatar } from '@/components/UserAvatar';

export const DashboardHeader: React.FC = () => {
  const { user, profile, primaryRole, signOut } = useAuth();
  const { currentRoute, navigate, toggleMobileMenu } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState(false);

  const currentItem = NAVIGATION_ITEMS.find((item) => item.id === currentRoute);
  const pageTitle = currentItem ? currentItem.label : 'Tableau de bord';

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Utilisateur';
  const displayAvatar = profile?.full_name
    ? profile.full_name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search interface only (no complex search backend in this foundation step)
  };

  return (
    <header className="dashboard-header">
      {/* Left: Mobile trigger & Page Title */}
      <div className="header-left">
        <button
          type="button"
          className="header-mobile-toggle"
          onClick={toggleMobileMenu}
          aria-label="Ouvrir le menu"
        >
          <MenuIcon />
        </button>
        <div className="header-title-container">
          <h1 className="header-page-title">{pageTitle}</h1>
          <span className="header-breadcrumb-sub">DB-Connect</span>
        </div>
      </div>

      {/* Middle: Search input (UI interface only) */}
      <div className="header-search-container">
        <form onSubmit={handleSearchSubmit} className="header-search-form">
          <SearchIcon className="search-icon" size={17} />
          <input
            type="search"
            className="header-search-input"
            placeholder="Rechercher des formations, services, produits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Recherche sur DB-Connect"
          />
        </form>
      </div>

      {/* Right: Notifications & User Avatar */}
      <div className="header-right">
        {/* Notification Button */}
        <div className="header-action-wrapper">
          <button
            type="button"
            className="header-icon-btn"
            onClick={() => setShowNotificationToast((prev) => !prev)}
            aria-label="Notifications"
            title="Notifications DB-Connect"
          >
            <BellIcon size={19} />
            <span className="notification-indicator" />
          </button>

          {showNotificationToast && (
            <div className="header-dropdown-menu notification-menu">
              <div className="dropdown-header">
                <span className="dropdown-title">Notifications</span>
                <span className="dropdown-tag">Nouveau</span>
              </div>
              <div className="notification-item unread">
                <p className="notification-text">
                  Bienvenue sur la plateforme DB-Connect ! Votre compte est opérationnel.
                </p>
                <span className="notification-time">À l'instant</span>
              </div>
              <div className="dropdown-footer">
                <span>Système de notification en cours d'intégration</span>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Dropdown */}
        <div className="header-user-wrapper">
          <button
            type="button"
            className="header-avatar-btn"
            onClick={() => setShowUserDropdown((prev) => !prev)}
            aria-expanded={showUserDropdown}
            aria-label="Menu utilisateur"
          >
            <UserAvatar
              avatarUrl={profile?.avatar_url}
              fullName={profile?.full_name}
              email={user?.email}
              size={32}
            />
            <span className="header-avatar-name">{displayName}</span>
          </button>

          {showUserDropdown && (
            <div className="header-dropdown-menu user-menu">
              <div className="dropdown-user-info">
                <p className="dropdown-user-name">{displayName}</p>
                <p className="dropdown-user-email">{user?.email}</p>
                <span className={`sidebar-role-badge role-${primaryRole}`}>
                  {primaryRole}
                </span>
              </div>
              <div className="dropdown-divider" />
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setShowUserDropdown(false);
                  navigate('profile');
                }}
              >
                <ProfileIcon size={16} />
                <span>Mon profil</span>
              </button>
              <button
                type="button"
                className="dropdown-item danger"
                onClick={() => {
                  setShowUserDropdown(false);
                  signOut();
                }}
              >
                <LogoutIcon size={16} />
                <span>Se déconnecter</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
