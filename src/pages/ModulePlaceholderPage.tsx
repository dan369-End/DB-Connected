import React from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import {
  AcademyIcon,
  MarketplaceIcon,
  ServicesIcon,
  OpportunitiesIcon,
  ArrowRightIcon,
} from '@/components/icons';
import type { DashboardRoute } from '@/types';

interface ModulePlaceholderPageProps {
  moduleId: DashboardRoute;
  title: string;
  tagline: string;
  description: string;
}

export const ModulePlaceholderPage: React.FC<ModulePlaceholderPageProps> = ({
  moduleId,
  title,
  tagline,
  description,
}) => {
  const { navigate } = useNavigation();

  const getModuleIcon = () => {
    switch (moduleId) {
      case 'academy':
        return <AcademyIcon size={38} />;
      case 'marketplace':
        return <MarketplaceIcon size={38} />;
      case 'services':
        return <ServicesIcon size={38} />;
      case 'opportunities':
        return <OpportunitiesIcon size={38} />;
      default:
        return <AcademyIcon size={38} />;
    }
  };

  return (
    <div className="module-page-container">
      <div className="module-placeholder-card">
        <div className={`module-icon-emblem emblem-${moduleId}`}>
          {getModuleIcon()}
        </div>

        <div className="module-status-chip">
          <span className="chip-dot" />
          <span>Module en préparation</span>
        </div>

        <h1 className="placeholder-title">{title}</h1>
        <p className="placeholder-tagline">« {tagline} »</p>

        <p className="placeholder-description">{description}</p>

        <div className="placeholder-notice-box">
          <p>
            Les fonctionnalités de ce module seront ajoutées progressivement dans les prochaines étapes de développement de l'écosystème DB-Connect.
          </p>
        </div>

        <div className="placeholder-actions">
          <button
            type="button"
            className="btn-back-home"
            onClick={() => navigate('home')}
          >
            <span>Retour à l'accueil</span>
            <ArrowRightIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
