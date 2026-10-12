import React from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { MarketplaceIcon, ArrowRightIcon, CartIcon, CheckCircleIcon } from '@/components/icons';

interface MarketplaceSectionProps {
  onOpenAuth?: (mode: 'signin' | 'signup', targetRoute?: string) => void;
}

export const MarketplaceSection: React.FC<MarketplaceSectionProps> = ({ onOpenAuth }) => {
  const { navigate, setReturnTo } = useNavigation();

  const handleDiscover = () => {
    setReturnTo('/marketplace');
    if (onOpenAuth) onOpenAuth('signin', '/marketplace');
    navigate('login');
  };
  return (
    <section id="marketplace" className="landing-section">
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
              <span className="preview-card-tag">Boutique & Matériel Pro</span>
            </div>

            <div className="preview-products-grid">
              <div className="preview-product-card">
                <div className="product-fake-thumb">
                  <span className="text-xl">💻</span>
                </div>
                <div className="product-info-col">
                  <span className="product-badge-cat">Équipement</span>
                  <span className="product-name font-semibold text-slate-100">Laptop Pro Développeur</span>
                  <div className="product-price-row">
                    <span className="product-price text-cyan-400 font-bold">450 000 FCFA</span>
                    <span className="product-cart-btn"><CartIcon size={14} /></span>
                  </div>
                </div>
              </div>

              <div className="preview-product-card">
                <div className="product-fake-thumb">
                  <span className="text-xl">📦</span>
                </div>
                <div className="product-info-col">
                  <span className="product-badge-cat">Logiciel</span>
                  <span className="product-name font-semibold text-slate-100">Pack Licences & Outils Cloud</span>
                  <div className="product-price-row">
                    <span className="product-price text-cyan-400 font-bold">35 000 FCFA</span>
                    <span className="product-cart-btn"><CartIcon size={14} /></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Text & CTA) */}
        <div className="feature-text-col">
          <div className="hero-pill-badge cyan">
            <MarketplaceIcon size={14} className="text-cyan-400" />
            <span>Commerce Numérique</span>
          </div>

          <h2 className="feature-main-title">
            Trouvez ce dont vous avez besoin
          </h2>

          <p className="feature-main-desc">
            Découvrez les produits disponibles, ajoutez-les à votre panier et suivez vos commandes depuis votre espace.
          </p>

          <ul className="feature-checklist">
            <li className="checklist-item">
              <CheckCircleIcon size={16} className="text-cyan-400" />
              <span>Panier persistant et récapitulatif clair de vos achats</span>
            </li>
            <li className="checklist-item">
              <CheckCircleIcon size={16} className="text-cyan-400" />
              <span>Paiement sécurisé et confirmation immédiate de commande</span>
            </li>
            <li className="checklist-item">
              <CheckCircleIcon size={16} className="text-cyan-400" />
              <span>Historique complet et suivi du statut de livraison</span>
            </li>
          </ul>

          <div className="feature-cta-row">
            <button
              type="button"
              className="btn-hero-primary"
              onClick={handleDiscover}
            >
              <span>Découvrir le Marketplace</span>
              <ArrowRightIcon size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
