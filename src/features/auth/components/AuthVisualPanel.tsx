import React from 'react';
import heroTeamImage from '@/assets/images/dbconnect_hero_team_1790935420461.jpg';
import { CheckCircleIcon } from '@/components/icons';

interface AuthVisualPanelProps {
  quote?: string;
  tagline?: string;
}

export const AuthVisualPanel: React.FC<AuthVisualPanelProps> = ({
  tagline = 'Votre passerelle vers le numérique.',
  quote = 'Rejoignez la communauté de talents, accédez aux formations et développez vos projets numériques en toute simplicité.',
}) => {
  return (
    <div className="auth-visual-panel">
      <img
        src={heroTeamImage}
        alt="Équipe DB-Connect"
        className="auth-visual-bg-img"
        loading="lazy"
      />
      <div className="auth-visual-overlay" />

      <div className="auth-visual-content">
        <div className="auth-visual-header">
          <span className="sidebar-brand-badge">DB</span>
          <div className="auth-visual-brand-text">
            <span className="auth-visual-brand-title">DB-Connect</span>
            <span className="auth-visual-brand-sub">Plateforme Numérique</span>
          </div>
        </div>

        <div className="auth-visual-bottom">
          <p className="auth-visual-tagline">« {tagline} »</p>
          <p className="auth-visual-quote">{quote}</p>

          <div className="auth-visual-features">
            <div className="auth-visual-feature-item">
              <CheckCircleIcon size={14} className="text-cyan-400" />
              <span>Académie & Formations certifiantes</span>
            </div>
            <div className="auth-visual-feature-item">
              <CheckCircleIcon size={14} className="text-cyan-400" />
              <span>Marketplace d'équipements & logiciels pro</span>
            </div>
            <div className="auth-visual-feature-item">
              <CheckCircleIcon size={14} className="text-cyan-400" />
              <span>Services numériques & opportunités d'emploi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
