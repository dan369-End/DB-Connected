import React from 'react';
import { PublicHeader } from './components/PublicHeader';
import { LandingHero } from './components/LandingHero';
import { ModulesOverview } from './components/ModulesOverview';
import { AcademySection } from './components/AcademySection';
import { MarketplaceSection } from './components/MarketplaceSection';
import { ServicesSection } from './components/ServicesSection';
import { OpportunitiesSection } from './components/OpportunitiesSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { WhyChooseSection } from './components/WhyChooseSection';
import { FinalCtaSection } from './components/FinalCtaSection';
import { PublicFooter } from './components/PublicFooter';

interface LandingPageProps {
  onOpenAuth?: (mode: 'signin' | 'signup', targetRoute?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const handleScrollTo = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="public-landing-root">
      {/* Sticky Public Header */}
      <PublicHeader onOpenAuth={onOpenAuth} />

      {/* Main Content Sections */}
      <main>
        {/* 1. Hero */}
        <LandingHero
          onOpenAuth={onOpenAuth}
          onExplore={() => handleScrollTo('modules-overview')}
        />

        {/* 2. Fast 4 Modules Presentation */}
        <ModulesOverview onScrollTo={handleScrollTo} />

        {/* 3. Academy Detailed Section */}
        <AcademySection onOpenAuth={onOpenAuth} />

        {/* 4. Marketplace Detailed Section */}
        <MarketplaceSection onOpenAuth={onOpenAuth} />

        {/* 5. Services Detailed Section */}
        <ServicesSection onOpenAuth={onOpenAuth} />

        {/* 6. Opportunities Detailed Section */}
        <OpportunitiesSection onOpenAuth={onOpenAuth} />

        {/* 7. How it works */}
        <HowItWorksSection />

        {/* 8. Why DB-Connect */}
        <WhyChooseSection />

        {/* 9. Final CTA */}
        <FinalCtaSection onOpenAuth={onOpenAuth} />
      </main>

      {/* 10. Public Footer */}
      <PublicFooter onOpenAuth={onOpenAuth} onScrollTo={handleScrollTo} />
    </div>
  );
};
