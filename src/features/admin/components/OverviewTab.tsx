import React from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import {
  UsersIcon,
  AcademyIcon,
  MarketplaceIcon,
  ServicesIcon,
  OpportunitiesIcon,
  MessageIcon,
} from '@/components/icons';
import type { AdminGlobalStats } from '@/types';

interface OverviewTabProps {
  stats: AdminGlobalStats;
  loading: boolean;
  onNavigateTab: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  loading,
  onNavigateTab,
}) => {
  const { navigate } = useNavigation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Quick Summary Banner */}
      <div className="admin-quick-actions-bar">
        <div className="quick-actions-info">
          <h2 className="overview-headline">Vue d'ensemble Globale DB-Connect</h2>
          <p className="overview-subline">
            Supervision transversale de la plateforme, des modules métiers et des flux utilisateurs
          </p>
        </div>
        <div className="quick-actions-buttons">
          <button
            type="button"
            className="btn-admin-cta primary"
            onClick={() => onNavigateTab('users')}
          >
            <UsersIcon size={16} /> Gérer les utilisateurs
          </button>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="admin-stats-grid">
        {/* Users Card */}
        <div
          className="admin-stat-card cursor-pointer"
          onClick={() => onNavigateTab('users')}
          style={{ cursor: 'pointer', transition: 'border-color 0.15s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Utilisateurs</span>
            <span style={{ color: 'var(--color-accent)', display: 'inline-flex' }}>
              <UsersIcon size={18} />
            </span>
          </div>
          <span className="stat-value text-accent">
            {loading ? '...' : stats.users.total}
          </span>
          <span className="stat-detail">
            {stats.users.superAdmins} super admin &bull; {stats.users.moduleAdmins} admin(s) module
          </span>
        </div>

        {/* Academy Card */}
        <div
          className="admin-stat-card cursor-pointer"
          onClick={() => onNavigateTab('academy')}
          style={{ cursor: 'pointer', transition: 'border-color 0.15s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Académie</span>
            <span style={{ color: '#38bdf8', display: 'inline-flex' }}>
              <AcademyIcon size={18} />
            </span>
          </div>
          <span className="stat-value">
            {loading ? '...' : stats.academy.totalCourses}
          </span>
          <span className="stat-detail">
            <span className="text-success">{stats.academy.publishedCourses} publiées</span> &bull; {stats.academy.totalEnrollments} apprenant(s)
          </span>
        </div>

        {/* Marketplace Card */}
        <div
          className="admin-stat-card cursor-pointer"
          onClick={() => onNavigateTab('marketplace')}
          style={{ cursor: 'pointer', transition: 'border-color 0.15s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Marketplace</span>
            <span style={{ color: '#34d399', display: 'inline-flex' }}>
              <MarketplaceIcon size={18} />
            </span>
          </div>
          <span className="stat-value text-success">
            {loading ? '...' : stats.marketplace.totalProducts}
          </span>
          <span className="stat-detail">
            {stats.marketplace.totalOrders} commandes &bull; {stats.marketplace.pendingOrders} en attente
          </span>
        </div>

        {/* Services Card */}
        <div
          className="admin-stat-card cursor-pointer"
          onClick={() => onNavigateTab('services')}
          style={{ cursor: 'pointer', transition: 'border-color 0.15s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Services</span>
            <span style={{ color: '#fbbf24', display: 'inline-flex' }}>
              <ServicesIcon size={18} />
            </span>
          </div>
          <span className="stat-value text-warning">
            {loading ? '...' : stats.services.totalServices}
          </span>
          <span className="stat-detail">
            {stats.services.publishedServices} publiés &bull; {stats.services.pendingRequests} demande(s) en attente
          </span>
        </div>

        {/* Opportunities Card */}
        <div
          className="admin-stat-card cursor-pointer"
          onClick={() => onNavigateTab('opportunities')}
          style={{ cursor: 'pointer', transition: 'border-color 0.15s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Opportunités</span>
            <span style={{ color: '#2dd4bf', display: 'inline-flex' }}>
              <OpportunitiesIcon size={18} />
            </span>
          </div>
          <span className="stat-value">
            {loading ? '...' : stats.opportunities.totalOpportunities}
          </span>
          <span className="stat-detail">
            {stats.opportunities.publishedOpportunities} publiées &bull; {stats.opportunities.totalApplications} candidature(s)
          </span>
        </div>

        {/* Requests Card */}
        <div
          className="admin-stat-card cursor-pointer"
          onClick={() => onNavigateTab('requests')}
          style={{ cursor: 'pointer', transition: 'border-color 0.15s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Messages & Devis</span>
            <span style={{ color: '#c084fc', display: 'inline-flex' }}>
              <MessageIcon size={18} />
            </span>
          </div>
          <span className="stat-value">
            {loading ? '...' : stats.requests.totalRequests}
          </span>
          <span className="stat-detail">
            {stats.requests.newRequests} nouvelles &bull; {stats.requests.quotedRequests} devis
          </span>
        </div>
      </div>

      {/* Module Overview Quick Directory */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
          Accès directs aux back-offices métiers
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {/* Academy Card */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--color-accent)', display: 'inline-flex' }}>
                  <AcademyIcon size={18} />
                </span>
                <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-main)' }}>
                  Académie
                </h4>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                Gestion des formations en ligne, modules, leçons vidéo et inscriptions.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {stats.academy.publishedCourses} / {stats.academy.totalCourses} formations
              </span>
              <button
                type="button"
                className="btn-table-action"
                onClick={() => navigate('academy_admin')}
                style={{ color: 'var(--color-accent)' }}
              >
                Ouvrir &rarr;
              </button>
            </div>
          </div>

          {/* Marketplace Card */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span style={{ color: '#34d399', display: 'inline-flex' }}>
                  <MarketplaceIcon size={18} />
                </span>
                <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-main)' }}>
                  Marketplace
                </h4>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                Catalogue produits, stocks, traitement des commandes et expéditions.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {stats.marketplace.totalProducts} produits &bull; {stats.marketplace.totalOrders} commandes
              </span>
              <button
                type="button"
                className="btn-table-action"
                onClick={() => navigate('marketplace_admin')}
                style={{ color: '#34d399' }}
              >
                Ouvrir &rarr;
              </button>
            </div>
          </div>

          {/* Services Card */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span style={{ color: '#fbbf24', display: 'inline-flex' }}>
                  <ServicesIcon size={18} />
                </span>
                <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-main)' }}>
                  Services Pro
                </h4>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                Offres d'expertise numérique, maintenance, audit et demandes de prestations.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {stats.services.publishedServices} publiées &bull; {stats.services.pendingRequests} en attente
              </span>
              <button
                type="button"
                className="btn-table-action"
                onClick={() => navigate('services_admin')}
                style={{ color: '#fbbf24' }}
              >
                Ouvrir &rarr;
              </button>
            </div>
          </div>

          {/* Opportunities Card */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span style={{ color: '#2dd4bf', display: 'inline-flex' }}>
                  <OpportunitiesIcon size={18} />
                </span>
                <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-main)' }}>
                  Opportunités
                </h4>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                Offres d'emploi, stages, missions freelances et suivi des candidatures.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {stats.opportunities.publishedOpportunities} publiées &bull; {stats.opportunities.totalApplications} candidatures
              </span>
              <button
                type="button"
                className="btn-table-action"
                onClick={() => navigate('opportunities_admin')}
                style={{ color: '#2dd4bf' }}
              >
                Ouvrir &rarr;
              </button>
            </div>
          </div>

          {/* Messages & Quotes Card */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span style={{ color: '#c084fc', display: 'inline-flex' }}>
                  <MessageIcon size={18} />
                </span>
                <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-main)' }}>
                  Messages & Devis
                </h4>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                Demandes de contact général, demandes de devis formations et services.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {stats.requests.newRequests} nouvelles &bull; {stats.requests.totalRequests} au total
              </span>
              <button
                type="button"
                className="btn-table-action"
                onClick={() => navigate('requests_admin')}
                style={{ color: '#c084fc' }}
              >
                Ouvrir &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
