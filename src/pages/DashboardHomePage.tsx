import React from 'react';
import { useAuth } from '@/features/auth';
import { useNavigation } from '@/hooks/useNavigation';
import {
  AcademyIcon,
  MarketplaceIcon,
  ServicesIcon,
  OpportunitiesIcon,
  ArrowRightIcon,
} from '@/components/icons';
import type { DashboardRoute } from '@/types';

interface ServiceCardConfig {
  id: DashboardRoute;
  title: string;
  tag: string;
  description: string;
  icon: React.ReactNode;
  accentClass: string;
}

export const DashboardHomePage: React.FC = () => {
  const { user, profile } = useAuth();
  const { navigate } = useNavigation();

  const firstName = profile?.full_name?.split(' ')[0];
  const greetingName = firstName || profile?.full_name || user?.email?.split('@')[0] || '';

  const serviceCards: ServiceCardConfig[] = [
    {
      id: 'academy',
      title: 'ACADÉMIE',
      tag: 'Formations',
      description: 'Découvrir des formations et développer ses compétences.',
      icon: <AcademyIcon size={26} />,
      accentClass: 'accent-academy',
    },
    {
      id: 'marketplace',
      title: 'MARKETPLACE',
      tag: 'Boutiques & Produits',
      description: 'Découvrir les produits et offres disponibles.',
      icon: <MarketplaceIcon size={26} />,
      accentClass: 'accent-marketplace',
    },
    {
      id: 'services',
      title: 'SERVICES',
      tag: 'Solutions & Prestations',
      description: 'Trouver les services proposés sur DB-Connect.',
      icon: <ServicesIcon size={26} />,
      accentClass: 'accent-services',
    },
    {
      id: 'opportunities',
      title: 'OPPORTUNITÉS',
      tag: 'Carrière & Annonces',
      description: 'Découvrir les opportunités professionnelles et autres annonces.',
      icon: <OpportunitiesIcon size={26} />,
      accentClass: 'accent-opportunities',
    },
  ];

  return (
    <div className="dashboard-home">
      {/* Welcome Banner */}
      <section className="welcome-banner">
        <div className="welcome-banner-badge">
          <span className="banner-dot" />
          <span>Espace Connecté DB-Connect</span>
        </div>
        <h1 className="welcome-banner-title">
          {greetingName ? `Bonjour ${greetingName},` : 'Bonjour,'}
          <span className="welcome-sub-heading">Bienvenue sur DB-Connect</span>
        </h1>
        <p className="welcome-banner-desc">
          Votre passerelle vers le numérique. Accédez à vos programmes d'apprentissage, explorez les offres de la marketplace, sollicitez des prestations expertes et saisissez de nouvelles opportunités professionnelles.
        </p>
      </section>

      {/* Services Grid Section */}
      <section className="dashboard-modules-section">
        <div className="section-header">
          <h2 className="section-title">Écosystème & Accès Rapides</h2>
          <p className="section-subtitle">
            Explorez les pôles de la plateforme pour propulser vos projets
          </p>
        </div>

        <div className="services-grid">
          {serviceCards.map((card) => (
            <div
              key={card.id}
              className={`service-card ${card.accentClass}`}
              onClick={() => navigate(card.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate(card.id);
                }
              }}
            >
              <div className="card-top">
                <div className="card-icon-box">{card.icon}</div>
                <span className="card-tag">{card.tag}</span>
              </div>

              <div className="card-content">
                <h3 className="card-title">{card.title}</h3>
                <p className="card-description">{card.description}</p>
              </div>

              <div className="card-footer">
                <button
                  type="button"
                  className="card-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(card.id);
                  }}
                >
                  <span>Découvrir</span>
                  <ArrowRightIcon size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
