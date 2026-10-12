import React from 'react';
import {
  AcademyIcon,
  MarketplaceIcon,
  ServicesIcon,
  OpportunitiesIcon,
  ArrowRightIcon,
} from '@/components/icons';

interface ModulesOverviewProps {
  onScrollTo: (sectionId: string) => void;
}

export const ModulesOverview: React.FC<ModulesOverviewProps> = ({ onScrollTo }) => {
  const modules = [
    {
      id: 'academie',
      title: 'ACADÉMIE',
      description: 'Développez vos compétences grâce à des formations accessibles.',
      icon: AcademyIcon,
      accentColor: 'blue',
      sectionId: 'academie',
    },
    {
      id: 'marketplace',
      title: 'MARKETPLACE',
      description: 'Découvrez des produits et solutions disponibles sur DB-Connect.',
      icon: MarketplaceIcon,
      accentColor: 'cyan',
      sectionId: 'marketplace',
    },
    {
      id: 'services',
      title: 'SERVICES',
      description: 'Trouvez des prestations adaptées à vos besoins.',
      icon: ServicesIcon,
      accentColor: 'indigo',
      sectionId: 'services',
    },
    {
      id: 'opportunites',
      title: 'OPPORTUNITÉS',
      description: 'Accédez à des opportunités et suivez vos candidatures.',
      icon: OpportunitiesIcon,
      accentColor: 'sky',
      sectionId: 'opportunites',
    },
  ];

  return (
    <section id="modules-overview" className="landing-section">
      <div className="section-header-centered">
        <div className="hero-pill-badge">
          <span className="chip-dot" />
          <span>Modules Clés</span>
        </div>
        <h2 className="landing-section-title">
          Tout ce dont vous avez besoin, au même endroit
        </h2>
        <p className="landing-section-sub">
          Quatre piliers essentiels pour vous former, vous équiper, réaliser vos projets et booster votre carrière.
        </p>
      </div>

      <div className="landing-modules-grid">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.id}
              className={`module-feature-card ${mod.accentColor}`}
              onClick={() => onScrollTo(mod.sectionId)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onScrollTo(mod.sectionId);
                }
              }}
            >
              <div className="module-card-icon-bubble">
                <Icon size={24} />
              </div>

              <h3 className="module-card-title">{mod.title}</h3>
              <p className="module-card-desc">{mod.description}</p>

              <div className="module-card-cta">
                <span>En savoir plus</span>
                <ArrowRightIcon size={14} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
