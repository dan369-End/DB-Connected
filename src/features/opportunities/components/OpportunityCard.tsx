import React from 'react';
import type { Opportunity } from '@/types';
import {
  BuildingIcon,
  LocationIcon,
  CalendarIcon,
  ArrowRightIcon,
} from '@/components/icons';
import { isDeadlinePassed, formatDeadline } from '../opportunitiesService';
import { OpportunityImage } from './OpportunityImage';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onView: (id: string) => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  onView,
}) => {
  const categoryName = opportunity.opportunity_categories?.name;
  const deadlinePassed = isDeadlinePassed(opportunity.deadline);

  return (
    <div
      className="opportunity-card-modern"
      onClick={() => onView(opportunity.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onView(opportunity.id);
        }
      }}
    >
      {/* 16:9 Framed Image Cover */}
      <div className="opportunity-card-media">
        <OpportunityImage
          path={opportunity.image_url}
          alt={opportunity.title}
          className="opportunity-card-media-img"
          fallbackIconSize={34}
        />

        {/* Floating badges on top of media */}
        <div className="card-media-overlay-tags">
          {categoryName ? (
            <span className="opportunity-category-badge">{categoryName}</span>
          ) : (
            <span className="opportunity-category-badge muted">Opportunité</span>
          )}

          {deadlinePassed ? (
            <span className="opportunity-deadline-pill expired" title="Les candidatures sont closes">
              Date limite dépassée
            </span>
          ) : opportunity.deadline ? (
            <span className="opportunity-deadline-pill open" title="Date limite de candidature">
              <CalendarIcon size={12} />
              <span>{formatDeadline(opportunity.deadline)}</span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="opportunity-card-content">
        <h3 className="opportunity-card-title">{opportunity.title}</h3>

        <div className="opportunity-meta-row">
          <div className="opportunity-org-chip" title="Organisation">
            <BuildingIcon size={14} className="meta-icon" />
            <span className="org-name">{opportunity.organization_name}</span>
          </div>

          {opportunity.location && (
            <div className="opportunity-loc-chip" title="Localisation">
              <LocationIcon size={14} className="meta-icon" />
              <span>{opportunity.location}</span>
            </div>
          )}
        </div>

        <p className="opportunity-card-desc">
          {opportunity.short_description ||
            (opportunity.description
              ? opportunity.description.slice(0, 140) + '...'
              : 'Consultez les détails pour découvrir le poste et candidater.')}
        </p>

        <div className="opportunity-card-footer">
          <button
            type="button"
            className="btn-opportunity-action-modern"
            onClick={(e) => {
              e.stopPropagation();
              onView(opportunity.id);
            }}
          >
            <span>Voir l'opportunité</span>
            <ArrowRightIcon size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
