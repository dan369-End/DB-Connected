import React from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import heroTeamImage from '@/assets/images/dbconnect_hero_team_1790935420461.jpg';
import { ArrowRightIcon, CheckCircleIcon } from '@/components/icons';

interface LandingHeroProps {
  onOpenAuth?: (mode: 'signin' | 'signup') => void;
  onExplore: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onOpenAuth, onExplore }) => {
  const { navigate } = useNavigation();

  const handleRegister = () => {
    if (onOpenAuth) onOpenAuth('signup');
    navigate('register');
  };

  return (
    <section id="hero" className="landing-hero-section">
      <div className="landing-hero-container">
        {/* Left Column: Headline and CTAs */}
        <div className="hero-content-col">
          <div className="hero-pill-badge">
            <span className="chip-dot" />
            <span>Passerelle Numérique Intégrée</span>
          </div>

          <h1 className="hero-headline">
            Un seul espace pour <span className="text-gradient-cyan">apprendre</span>,{' '}
            découvrir, acheter et saisir des <span className="text-gradient-cyan">opportunités</span>.
          </h1>

          <p className="hero-subheadline">
            DB-Connect réunit formation, services, marketplace et opportunités dans un même
            écosystème numérique simple, fiable et centralisé.
          </p>

          <div className="hero-cta-cluster">
            <button
              type="button"
              className="btn-hero-primary"
              onClick={handleRegister}
            >
              <span>Créer un compte</span>
              <ArrowRightIcon size={16} />
            </button>

            <button
              type="button"
              className="btn-hero-secondary"
              onClick={onExplore}
            >
              <span>Découvrir DB-Connect</span>
            </button>
          </div>

          <div className="hero-proof-chips">
            <div className="proof-chip">
              <CheckCircleIcon size={15} className="text-cyan-400" />
              <span>Accès centralisé</span>
            </div>
            <div className="proof-chip">
              <CheckCircleIcon size={15} className="text-cyan-400" />
              <span>Catalogue vérifié</span>
            </div>
            <div className="proof-chip">
              <CheckCircleIcon size={15} className="text-cyan-400" />
              <span>Suivi en temps réel</span>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Visual Photo */}
        <div className="hero-media-col">
          <div className="hero-image-frame">
            <img
              src={heroTeamImage}
              alt="Professionnels et apprenants collaborant sur la plateforme DB-Connect"
              className="hero-main-photo"
              loading="eager"
            />
            <div className="hero-floating-card">
              <div className="floating-card-icon">⚡</div>
              <div className="floating-card-text">
                <span className="font-semibold text-slate-100 text-xs">Écosystème unifié</span>
                <span className="text-[11px] text-slate-400">4 modules interconnectés</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
