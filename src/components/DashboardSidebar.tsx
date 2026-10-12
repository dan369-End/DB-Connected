import React from 'react';
import { useAuth } from '@/features/auth';
import { useNavigation } from '@/hooks/useNavigation';
import { NAVIGATION_ITEMS } from '@/utils/navigation';
import {
  HomeIcon,
  AcademyIcon,
  MarketplaceIcon,
  ServicesIcon,
  OpportunitiesIcon,
  ProfileIcon,
  LogoutIcon,
  CloseIcon,
  MessageIcon,
  DashboardIcon,
} from '@/components/icons';
import { UserAvatar } from '@/components/UserAvatar';
import type { DashboardRoute } from '@/types';

export const DashboardSidebar: React.FC = () => {
  const { user, profile, roles, primaryRole, signOut } = useAuth();
  const { currentRoute, navigate, isMobileMenuOpen, closeMobileMenu, clearReturnTo } = useNavigation();

  const isSuperAdmin = roles.includes('super_admin');
  const isAdmin = roles.some((r) => ['academy_admin', 'services_admin', 'super_admin'].includes(r));

  const handleLogout = async () => {
    clearReturnTo();
    navigate('home');
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
    await signOut();
  };

  const getIcon = (iconName: string, isSelected: boolean) => {
    const className = `nav-icon ${isSelected ? 'active' : ''}`;
    switch (iconName) {
      case 'home':
        return <HomeIcon className={className} />;
      case 'academy':
        return <AcademyIcon className={className} />;
      case 'marketplace':
        return <MarketplaceIcon className={className} />;
      case 'services':
        return <ServicesIcon className={className} />;
      case 'opportunities':
        return <OpportunitiesIcon className={className} />;
      case 'requests':
        return <MessageIcon className={className} />;
      case 'profile':
        return <ProfileIcon className={className} />;
      default:
        return <HomeIcon className={className} />;
    }
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Utilisateur';
  const displayAvatar = profile?.full_name
    ? profile.full_name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand-group">
            <span className="sidebar-brand-badge">DB</span>
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title">DB-Connect</span>
              <span className="sidebar-brand-sub">Passerelle Numérique</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={closeMobileMenu}
            aria-label="Fermer le menu"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="sidebar-nav" aria-label="Navigation principale">
          <div className="sidebar-nav-section-title">Navigation</div>
          <ul className="sidebar-nav-list">
            {NAVIGATION_ITEMS.map((item) => {
              const isActive =
                currentRoute === item.id ||
                (item.id === 'opportunities' &&
                  (currentRoute === 'opportunities_detail' ||
                    currentRoute === 'opportunities_applications' ||
                    currentRoute === 'opportunities_admin')) ||
                (item.id === 'services' &&
                  (currentRoute === 'services_detail' ||
                    currentRoute === 'services_requests' ||
                    currentRoute === 'services_admin')) ||
                (item.id === 'academy' &&
                  (currentRoute === 'academy_course' ||
                    currentRoute === 'academy_player' ||
                    currentRoute === 'academy_admin')) ||
                (item.id === 'requests' &&
                  (currentRoute === 'requests' || currentRoute === 'request_detail')) ||
                (item.id === 'marketplace' &&
                  (currentRoute === 'marketplace_product' ||
                    currentRoute === 'marketplace_cart' ||
                    currentRoute === 'marketplace_checkout' ||
                    currentRoute === 'marketplace_orders' ||
                    currentRoute === 'marketplace_order_detail' ||
                    currentRoute === 'marketplace_admin'));
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => navigate(item.id as DashboardRoute)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="sidebar-item-icon">
                      {getIcon(item.icon, isActive)}
                    </span>
                    <span className="sidebar-item-label">{item.label}</span>
                    {isActive && <span className="active-pill" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Admin section for privileged roles */}
          {isAdmin && (
            <>
              <div className="sidebar-nav-section-title" style={{ marginTop: '1.25rem' }}>
                Administration
              </div>
              <ul className="sidebar-nav-list">
                {isSuperAdmin && (
                  <li>
                    <button
                      type="button"
                      className={`sidebar-nav-item ${currentRoute === 'admin' ? 'active' : ''}`}
                      onClick={() => navigate('admin')}
                      aria-current={currentRoute === 'admin' ? 'page' : undefined}
                    >
                      <span className="sidebar-item-icon">
                        <DashboardIcon className={`nav-icon ${currentRoute === 'admin' ? 'active' : ''}`} />
                      </span>
                      <span className="sidebar-item-label">Administration globale</span>
                      {currentRoute === 'admin' && <span className="active-pill" aria-hidden="true" />}
                    </button>
                  </li>
                )}
                <li>
                  <button
                    type="button"
                    className={`sidebar-nav-item ${currentRoute === 'requests_admin' ? 'active' : ''}`}
                    onClick={() => navigate('requests_admin')}
                    aria-current={currentRoute === 'requests_admin' ? 'page' : undefined}
                  >
                    <span className="sidebar-item-icon">
                      <MessageIcon className={`nav-icon ${currentRoute === 'requests_admin' ? 'active' : ''}`} />
                    </span>
                    <span className="sidebar-item-label">Messages & Devis</span>
                    {currentRoute === 'requests_admin' && <span className="active-pill" aria-hidden="true" />}
                  </button>
                </li>
              </ul>
            </>
          )}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="sidebar-footer">
          <div
            className="sidebar-user-card"
            onClick={() => navigate('profile')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate('profile');
              }
            }}
            title="Consulter mon profil"
          >
            <div className="sidebar-user-avatar">
              <UserAvatar
                avatarUrl={profile?.avatar_url}
                fullName={profile?.full_name}
                email={user?.email}
                size={36}
              />
            </div>
            <div className="sidebar-user-details">
              <span className="sidebar-user-name" title={displayName}>
                {displayName}
              </span>
              <span className={`sidebar-role-badge role-${primaryRole}`}>
                {primaryRole}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Se déconnecter de DB-Connect"
          >
            <LogoutIcon size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
};
