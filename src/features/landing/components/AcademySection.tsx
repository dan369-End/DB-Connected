import React from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { AcademyIcon, ArrowRightIcon, CheckCircleIcon } from '@/components/icons';

interface AcademySectionProps {
  onOpenAuth?: (mode: 'signin' | 'signup', targetRoute?: string) => void;
}

export const AcademySection: React.FC<AcademySectionProps> = ({ onOpenAuth }) => {
  const { navigate, setReturnTo } = useNavigation();

  const handleDiscover = () => {
    setReturnTo('/academy');
    if (onOpenAuth) onOpenAuth('signin', '/academy');
    navigate('login');
  };

  return (
    <section id="academie" className="landing-section">
      <div className="landing-feature-row">
        {/* Left Column: Text & CTA */}
        <div className="feature-text-col">
          <div className="hero-pill-badge blue">
            <AcademyIcon size={14} className="text-cyan-400" />
            <span>Formations Numériques</span>
          </div>

          <h2 className="feature-main-title">
            Apprenez et développez vos compétences
          </h2>

          <p className="feature-main-desc">
            Accédez à des formations organisées, progressez leçon après leçon et retrouvez vos supports directement dans votre espace.
          </p>

          <ul className="feature-checklist">
            <li className="checklist-item">
              <CheckCircleIcon size={16} className="text-cyan-400" />
              <span>Parcours structurés pour tous les niveaux : débutant, intermédiaire et avancé</span>
            </li>
            <li className="checklist-item">
              <CheckCircleIcon size={16} className="text-cyan-400" />
              <span>Lecteur de cours interactif avec suivi précis de votre avancement</span>
            </li>
            <li className="checklist-item">
              <CheckCircleIcon size={16} className="text-cyan-400" />
              <span>Supports et ressources téléchargeables directement liés à vos leçons</span>
            </li>
          </ul>

          <div className="feature-cta-row">
            <button
              type="button"
              className="btn-hero-primary"
              onClick={handleDiscover}
            >
              <span>Découvrir l'Académie</span>
              <ArrowRightIcon size={15} />
            </button>
          </div>
        </div>

        {/* Right Column: Visual Mockup */}
        <div className="feature-visual-col">
          <div className="interactive-preview-card">
            <div className="preview-card-header">
              <div className="window-dots">
                <span className="dot red" />
                <span className="dot amber" />
                <span className="dot green" />
              </div>
              <span className="preview-card-tag">Lecteur de Formation DB-Connect</span>
            </div>

            <div className="preview-course-body">
              <div className="preview-player-box">
                <div className="player-simulated-screen">
                  <div className="player-play-icon">▶</div>
                  <span className="text-xs text-slate-300 font-medium">Introduction au Développement Web Moderne</span>
                </div>
              </div>

              <div className="preview-curriculum-list">
                <div className="curriculum-item completed">
                  <span className="item-checkbox checked">✓</span>
                  <span className="item-title">1. Fondations & Environnement</span>
                  <span className="item-duration">15 min</span>
                </div>
                <div className="curriculum-item active">
                  <span className="item-checkbox active">▶</span>
                  <span className="item-title font-semibold text-slate-100">2. Composants React & Hooks</span>
                  <span className="item-duration text-cyan-400">En cours</span>
                </div>
                <div className="curriculum-item locked">
                  <span className="item-checkbox">○</span>
                  <span className="item-title">3. Connectivité Supabase & Auth</span>
                  <span className="item-duration">25 min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
