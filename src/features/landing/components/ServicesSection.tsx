import React from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { ServicesIcon, ArrowRightIcon, CheckCircleIcon } from '@/components/icons';

interface ServicesSectionProps {
  onOpenAuth?: (mode: 'signin' | 'signup', targetRoute?: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onOpenAuth }) => {
  const { navigate, setReturnTo } = useNavigation();

  const handleDiscover = () => {
    setReturnTo('/services');
    if (onOpenAuth) onOpenAuth('signin', '/services');
    navigate('login');
  };

  return (
    <section id="services" className="landing-section">
      <div className="landing-feature-row">
        {/* Left Column: Text & CTA */}
        <div className="feature-text-col">
          <div className="hero-pill-badge indigo">
            <ServicesIcon size={14} className="text-cyan-400" />
            <span>Prestations & Solutions</span>
          </div>

          <h2 className="feature-main-title">
            Des services pour vos projets
          </h2>

          <p className="feature-main-desc">
            Découvrez les prestations disponibles, envoyez votre demande et suivez son évolution.
          </p>

          <ul className="feature-checklist">
            <li className="checklist-item">
              <CheckCircleIcon size={16} className="text-cyan-400" />
              <span>Accompagnement d'experts en développement web, mobile, cloud et infrastructure</span>
            </li>
            <li className="checklist-item">
              <CheckCircleIcon size={16} className="text-cyan-400" />
              <span>Formulaire de demande de devis simple et cadrage rapide des besoins</span>
            </li>
            <li className="checklist-item">
              <CheckCircleIcon size={16} className="text-cyan-400" />
              <span>Espace personnel de suivi des étapes de traitement et prises de contact</span>
            </li>
          </ul>

          <div className="feature-cta-row">
            <button
              type="button"
              className="btn-hero-primary"
              onClick={handleDiscover}
            >
              <span>Voir les services</span>
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
              <span className="preview-card-tag">Catalogue Prestations</span>
            </div>

            <div className="preview-services-stack">
              <div className="preview-service-item">
                <div className="service-bullet-icon">🚀</div>
                <div className="service-content-group">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-100 text-sm">Développement d'Applications Web & SaaS</span>
                    <span className="text-xs text-cyan-400 font-mono">Sur devis</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Conception sur-mesure d'architectures modernes, scalables et sécurisées.</p>
                </div>
              </div>

              <div className="preview-service-item">
                <div className="service-bullet-icon">☁️</div>
                <div className="service-content-group">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-100 text-sm">Audit & Migration Cloud</span>
                    <span className="text-xs text-cyan-400 font-mono">Dès 150 000 FCFA</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Optimisation des coûts, sécurisation des données et scalabilité continue.</p>
                </div>
              </div>

              <div className="preview-service-item">
                <div className="service-bullet-icon">🛡️</div>
                <div className="service-content-group">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-100 text-sm">Conseil & Transformation Numérique</span>
                    <span className="text-xs text-cyan-400 font-mono">Sur mesure</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Stratégie digitale et formation de vos équipes aux technologies actuelles.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
