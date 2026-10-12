import React from 'react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Créez votre compte',
      description:
        'Inscrivez-vous en quelques secondes pour accéder à votre espace personnel unifié et sécurisé.',
    },
    {
      number: '02',
      title: 'Choisissez ce dont vous avez besoin',
      description:
        'Explorez les cours de l’Académie, le catalogue Marketplace, les prestations de services ou les offres d’emploi.',
    },
    {
      number: '03',
      title: 'Apprenez, commandez, demandez ou postulez',
      description:
        'Démarrez votre apprentissage, passez commande, lancez une prestation ou déposez votre candidature en un instant.',
    },
  ];

  return (
    <section className="landing-section bg-gradient-subtle">
      <div className="section-header-centered">
        <div className="hero-pill-badge">
          <span className="chip-dot" />
          <span>Prise en main rapide</span>
        </div>
        <h2 className="landing-section-title">Comment ça marche ?</h2>
        <p className="landing-section-sub">
          Trois étapes limpides pour tirer pleinement parti de l’écosystème DB-Connect.
        </p>
      </div>

      <div className="how-it-works-grid">
        {steps.map((s, idx) => (
          <div key={s.number} className="step-card">
            <div className="step-number-bubble">{s.number}</div>
            <h3 className="step-card-title">{s.title}</h3>
            <p className="step-card-desc">{s.description}</p>
            {idx < steps.length - 1 && <div className="step-connector-line" />}
          </div>
        ))}
      </div>
    </section>
  );
};
