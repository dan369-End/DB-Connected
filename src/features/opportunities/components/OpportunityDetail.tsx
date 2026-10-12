import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth';
import { useNavigation } from '@/hooks/useNavigation';
import type { Opportunity } from '@/types';
import {
  fetchOpportunityById,
  checkUserApplied,
  isDeadlinePassed,
  formatDeadline,
} from '../opportunitiesService';
import { ApplicationFormModal } from './ApplicationFormModal';
import { OpportunityImage } from './OpportunityImage';
import {
  BuildingIcon,
  LocationIcon,
  CalendarIcon,
  ExternalLinkIcon,
  CheckCircleIcon,
  OpportunitiesIcon,
} from '@/components/icons';

interface OpportunityDetailProps {
  opportunityId: string;
}

export const OpportunityDetail: React.FC<OpportunityDetailProps> = ({ opportunityId }) => {
  const { user } = useAuth();
  const { navigate } = useNavigation();

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // User candidature status for this specific opportunity
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplied, setCheckingApplied] = useState(false);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const loadOpportunity = useCallback(async () => {
    if (!opportunityId) {
      setErrorMessage('Identifiant d’opportunité invalide.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const { opportunity: opp, error } = await fetchOpportunityById(opportunityId);
      if (error || !opp) {
        setErrorMessage("Cette opportunité n'est plus disponible ou a été retirée.");
      } else {
        setOpportunity(opp);

        // Check if user already applied
        if (user) {
          setCheckingApplied(true);
          const checkRes = await checkUserApplied(opp.id, user.id);
          setHasApplied(checkRes.applied);
          setCheckingApplied(false);
        }
      }
    } catch {
      setErrorMessage('Une erreur est survenue lors du chargement des détails.');
    } finally {
      setLoading(false);
    }
  }, [opportunityId, user]);

  useEffect(() => {
    loadOpportunity();
  }, [loadOpportunity]);

  const handleApplicationSuccess = () => {
    setIsApplicationModalOpen(false);
    setHasApplied(true);
    setSuccessBanner('Votre candidature a été transmise avec succès à l’organisation !');
  };

  if (loading) {
    return (
      <div className="marketplace-page-container">
        <div className="academy-loading-box">
          <div className="spinner large" />
          <p>Chargement des détails de l'opportunité...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !opportunity) {
    return (
      <div className="marketplace-page-container">
        <div className="breadcrumb-nav-box">
          <button
            type="button"
            className="btn-back-breadcrumb"
            onClick={() => navigate('opportunities')}
          >
            &larr; Retour aux opportunités
          </button>
        </div>

        <div className="empty-catalog-state">
          <div className="empty-icon-circle">
            <OpportunitiesIcon size={38} />
          </div>
          <h3 className="empty-title">Opportunité introuvable</h3>
          <p className="empty-subtitle">
            {errorMessage || "L'offre recherchée n'existe pas ou n'est plus accessible."}
          </p>
          <button
            type="button"
            className="btn-admin-cta primary"
            onClick={() => navigate('opportunities')}
          >
            Consulter le catalogue des opportunités
          </button>
        </div>
      </div>
    );
  }

  const deadlinePassed = isDeadlinePassed(opportunity.deadline);
  const categoryName = opportunity.opportunity_categories?.name;

  // Split description into clean paragraphs without dangerous raw HTML injection
  const descriptionParagraphs = opportunity.description
    ? opportunity.description.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
    : [];

  return (
    <div className="marketplace-page-container">
      {/* Breadcrumb row */}
      <div className="breadcrumb-nav-box">
        <button
          type="button"
          className="btn-back-breadcrumb"
          onClick={() => navigate('opportunities')}
        >
          &larr; Retour aux opportunités
        </button>
      </div>

      {successBanner && (
        <div className="auth-alert alert-success" role="status">
          <CheckCircleIcon size={18} />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Main Opportunity Detail Layout */}
      <div className="opportunity-detail-layout">
        {/* Left Column: Media & Comprehensive information */}
        <div className="opportunity-main-col">
          {/* Framed Cover Image (if present or styled banner) */}
          {opportunity.image_url ? (
            <div className="opportunity-detail-media-frame">
              <OpportunityImage
                path={opportunity.image_url}
                alt={opportunity.title}
                className="opportunity-detail-hero-img"
                fallbackIconSize={48}
              />
            </div>
          ) : null}

          <div className="opportunity-detail-header-card">
            <div className="detail-category-wrapper">
              {categoryName ? (
                <span className="opportunity-category-badge">{categoryName}</span>
              ) : (
                <span className="opportunity-category-badge muted">Opportunité générale</span>
              )}

              {opportunity.status !== 'published' && (
                <span className={`status-badge status-${opportunity.status}`}>
                  {opportunity.status === 'draft' ? 'Brouillon' : 'Archivée'}
                </span>
              )}
            </div>

            <h1 className="opportunity-detail-title">{opportunity.title}</h1>

            <div className="opportunity-org-header-row">
              <div className="detail-meta-chip">
                <BuildingIcon size={16} className="text-cyan-400" />
                <span className="font-semibold text-slate-100">{opportunity.organization_name}</span>
              </div>

              {opportunity.location && (
                <div className="detail-meta-chip">
                  <LocationIcon size={16} className="text-slate-400" />
                  <span>{opportunity.location}</span>
                </div>
              )}

              {opportunity.deadline && (
                <div className={`detail-meta-chip ${deadlinePassed ? 'text-amber-400 font-medium' : ''}`}>
                  <CalendarIcon size={16} />
                  <span>
                    {deadlinePassed ? 'Clôturée le ' : 'Date limite : '}
                    {formatDeadline(opportunity.deadline)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div className="opportunity-detail-body-card">
            <h2 className="detail-section-heading">Description du poste / de la mission</h2>

            {opportunity.short_description && (
              <div className="detail-highlight-summary">
                <p>{opportunity.short_description}</p>
              </div>
            )}

            <div className="opportunity-paragraphs-container">
              {descriptionParagraphs.length > 0 ? (
                descriptionParagraphs.map((para, idx) => (
                  <p key={idx} className="opportunity-paragraph">
                    {para}
                  </p>
                ))
              ) : (
                <p className="opportunity-paragraph text-slate-400">
                  {opportunity.short_description || 'Aucun descriptif complémentaire renseigné.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Application Actions Box */}
        <div className="opportunity-sidebar-col">
          <div className="opportunity-action-box">
            <h3 className="action-box-title">Postuler à cette offre</h3>

            <div className="action-box-status-indicator">
              {deadlinePassed ? (
                <div className="action-alert alert-closed">
                  <span className="alert-dot red" />
                  <div>
                    <strong>Les candidatures sont clôturées.</strong>
                    <p className="text-xs text-slate-400 mt-0.5">
                      La date limite ({formatDeadline(opportunity.deadline)}) est dépassée.
                    </p>
                  </div>
                </div>
              ) : hasApplied ? (
                <div className="action-alert alert-applied">
                  <CheckCircleIcon size={18} className="text-emerald-400 shrink-0" />
                  <div>
                    <strong>Vous avez déjà postulé à cette opportunité.</strong>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Suivez le statut de votre candidature dans votre espace dédié.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="action-alert alert-open">
                  <span className="alert-dot green" />
                  <div>
                    <strong>Candidatures ouvertes</strong>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {opportunity.deadline
                        ? `Date limite : ${formatDeadline(opportunity.deadline)}`
                        : 'Aucune date limite fixée.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="action-buttons-group">
              {/* Internal Application Button */}
              {hasApplied ? (
                <button
                  type="button"
                  className="btn-opportunity-cta applied"
                  onClick={() => navigate('opportunities_applications')}
                >
                  <CheckCircleIcon size={16} />
                  <span>Consulter ma candidature</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-opportunity-cta primary"
                  disabled={deadlinePassed || checkingApplied}
                  onClick={() => setIsApplicationModalOpen(true)}
                  title={
                    deadlinePassed
                      ? 'Les candidatures sont clôturées.'
                      : "Soumettre ma candidature via DB-Connect"
                  }
                >
                  <span>{deadlinePassed ? 'Candidatures clôturées' : 'Postuler'}</span>
                </button>
              )}

              {/* External Application URL option if provided */}
              {opportunity.application_url && (
                <a
                  href={opportunity.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-opportunity-cta external"
                  title="Ouvrir le portail externe de candidature"
                >
                  <span>Postuler sur le site externe</span>
                  <ExternalLinkIcon size={15} />
                </a>
              )}
            </div>

            {/* Summary info list in card */}
            <div className="action-box-meta-list">
              <div className="meta-list-item">
                <span className="meta-label">Organisation</span>
                <span className="meta-value">{opportunity.organization_name}</span>
              </div>
              {opportunity.location && (
                <div className="meta-list-item">
                  <span className="meta-label">Lieu</span>
                  <span className="meta-value">{opportunity.location}</span>
                </div>
              )}
              {categoryName && (
                <div className="meta-list-item">
                  <span className="meta-label">Catégorie</span>
                  <span className="meta-value">{categoryName}</span>
                </div>
              )}
              {opportunity.deadline && (
                <div className="meta-list-item">
                  <span className="meta-label">Date limite</span>
                  <span className="meta-value">{formatDeadline(opportunity.deadline)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Internal Application Modal */}
      {isApplicationModalOpen && (
        <ApplicationFormModal
          opportunity={opportunity}
          onClose={() => setIsApplicationModalOpen(false)}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </div>
  );
};
