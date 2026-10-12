import React from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { OpportunitiesIcon, ArrowRightIcon, CheckCircleIcon, BuildingIcon, CalendarIcon } from '@/components/icons';

interface OpportunitiesSectionProps {
  onOpenAuth?: (mode: 'signin' | 'signup', targetRoute?: string) => void;
}

export const OpportunitiesSection: React.FC<OpportunitiesSectionProps> = ({ onOpenAuth }) => {
  const { navigate, setReturnTo } = useNavigation();

  const handleDiscover = () => {
    setReturnTo('/opportunities');
    if (onOpenAuth) onOpenAuth('signin', '/opportunities');
    navigate('login');
  };
  return (
    <section id="opportunites" className="landing-section">
      <div className="landing-feature-row reverse">
        {/* Left Column on Desktop (visually right due to reverse): Visual Mockup */}
        <div className="feature-visual-col">
          <div className="interactive-preview-card">
            <div className="preview-card-header">
              <div className="window-dots">
                <span className="dot red" />
                <span className="dot amber" />
                <span className="dot green" />
              </div>
              <span className="preview-card-tag">Offres & Candidatures</span>
            </div>

            <div className="preview-opportunities-stack">
              <div className="preview-opp-card">
                <div className="flex justify-between items-start gap-2">
                  <span className="opportunity-category-badge">Développement Web</span>
                  <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Ouvert
                  </span>
                </div>
                <h4 className="font-bold text-slate-100 text-sm mt-2">Ingénieur Full-Stack React & Node</h4>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1"><BuildingIcon size={12} /> TechCongo Labs</span>
                  <span>Brazzaville / Télétravail</span>
                </div>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400 flex items-center gap-1 font-mono"><CalendarIcon size={12} /> 30 nov. 2026</span>
                  <span className="text-cyan-400 font-semibold">Postuler &rarr;</span>
                </div>
              </div>

              <div className="preview-opp-card">
                <div className="flex justify-between items-start gap-2">
                  <span className="opportunity-category-badge">Cloud & DevOps</span>
                  <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Ouvert
                  </span>
                </div>
                <h4 className="font-bold text-slate-100 text-sm mt-2">Administrateur Systèmes & Réseaux</h4>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1"><BuildingIcon size={12} /> Digital Bridge CG</span>
                  <span>Pointe-Noire</span>
                </div>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400 flex items-center gap-1 font-mono"><CalendarIcon size={12} /> 15 déc. 2026</span>
                  <span className="text-cyan-400 font-semibold">Postuler &rarr;</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Text & CTA) */}
        <div className="feature-text-col">
          <div className="hero-pill-badge sky">
            <OpportunitiesIcon size={14} className="text-cyan-400" />
            <span>Emploi & Partenariats</span>
          </div>

          <h2 className="feature-main-title">
            Ne passez plus à côté d'une opportunité
          </h2>

          <p className="feature-main-desc">
            Consultez les opportunités disponibles, postulez et suivez vos candidatures directement sur DB-Connect.
          </p>

          <ul className="feature-checklist">
            <li className="checklist-item">
              <CheckCircleIcon size={16} className="text-cyan-400" />
              <span>Offres d'emploi, missions freelance et appels à projets vérifiés</span>
            </li>
            <li className="checklist-item">
              <CheckCircleIcon size={16} className="text-cyan-400" />
              <span>Candidature simplifiée en un clic avec préremplissage de votre profil</span>
            </li>
            <li className="checklist-item">
              <CheckCircleIcon size={16} className="text-cyan-400" />
              <span>Tableau de bord transparent : état de traitement (En étude, Présélectionné, Accepté)</span>
            </li>
          </ul>

          <div className="feature-cta-row">
            <button
              type="button"
              className="btn-hero-primary"
              onClick={handleDiscover}
            >
              <span>Voir les opportunités</span>
              <ArrowRightIcon size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
