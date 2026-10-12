import React from 'react';
import { AuthModalOrCard } from '@/features/auth';

export const HomePage: React.FC = () => {
  return (
    <div className="auth-page-container">
      <div className="auth-brand-presentation">
        <span className="brand-pill">Plateforme Technologique</span>
        <h1 className="brand-hero-title">DB-Connect</h1>
        <p className="brand-hero-slogan">
          « Votre passerelle vers le numérique. »
        </p>
        <p className="brand-hero-desc">
          Accédez aux services numériques, à l'Académie, au Marketplace et à l'écosystème d'innovation DB-Connect avec votre compte sécurisé.
        </p>
      </div>

      <div className="auth-form-column">
        <AuthModalOrCard />
      </div>
    </div>
  );
};
