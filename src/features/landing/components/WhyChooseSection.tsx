import React from 'react';
import { CheckCircleIcon } from '@/components/icons';

export const WhyChooseSection: React.FC = () => {
  const benefits = [
    {
      title: 'Un seul compte',
      description: 'Accédez à plusieurs services essentiels depuis un même espace centralisé.',
      icon: '🔐',
    },
    {
      title: 'Suivi centralisé',
      description: 'Retrouvez facilement vos formations, commandes, demandes et candidatures.',
      icon: '📊',
    },
    {
      title: 'Simple à utiliser',
      description: 'Une interface claire, rapide et pensée pour aller droit à l’essentiel.',
      icon: '✨',
    },
    {
      title: 'Écosystème évolutif',
      description: 'De nouvelles possibilités et fonctionnalités sont ajoutées progressivement.',
      icon: '🚀',
    },
  ];

  return (
    <section className="landing-section">
      <div className="section-header-centered">
        <div className="hero-pill-badge">
          <span className="chip-dot" />
          <span>Valeur Ajoutée</span>
        </div>
        <h2 className="landing-section-title">Pourquoi choisir DB-Connect ?</h2>
        <p className="landing-section-sub">
          Une plateforme moderne conçue pour simplifier votre parcours numérique au quotidien.
        </p>
      </div>

      <div className="why-choose-grid">
        {benefits.map((b) => (
          <div key={b.title} className="benefit-card">
            <div className="benefit-icon-bubble">{b.icon}</div>
            <h3 className="benefit-card-title">{b.title}</h3>
            <p className="benefit-card-desc">{b.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
