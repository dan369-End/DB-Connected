import React from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { ArrowRightIcon } from '@/components/icons';

interface FinalCtaSectionProps {
  onOpenAuth?: (mode: 'signin' | 'signup') => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ onOpenAuth }) => {
  const { navigate } = useNavigation();

  return (
    <section className="landing-section py-16">
      <div className="final-cta-card">
        <div className="final-cta-glow-effect" />
        <div className="final-cta-content">
          <div className="hero-pill-badge mb-4">
            <span className="chip-dot" />
            <span>Rejoignez l'Écosystème</span>
          </div>

          <h2 className="final-cta-title">
            Prêt à rejoindre DB-Connect ?
          </h2>

          <p className="final-cta-sub">
            Créez votre compte et accédez à l'ensemble de l'écosystème.
          </p>

          <div className="final-cta-buttons">
            <button
              type="button"
              className="btn-hero-primary"
              onClick={() => {
                if (onOpenAuth) onOpenAuth('signup');
                navigate('register');
              }}
            >
              <span>Créer un compte</span>
              <ArrowRightIcon size={16} />
            </button>

            <button
              type="button"
              className="btn-hero-secondary"
              onClick={() => {
                if (onOpenAuth) onOpenAuth('signin');
                navigate('login');
              }}
            >
              <span>Se connecter</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
