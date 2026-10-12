import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/features/auth';
import { useNavigation } from '@/hooks/useNavigation';
import { fetchMyContactRequests } from '../requestsService';
import {
  RequestStatusBadge,
  RequestTypeBadge,
  RequestSourceBadge,
} from '../components/RequestStatusBadge';
import {
  AcademyIcon,
  ServicesIcon,
  SearchIcon,
  CloseIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  CalendarIcon,
  PhoneIcon,
  MessageIcon,
} from '@/components/icons';
import type { ContactRequest } from '@/types';

type TypeFilter = 'all' | 'quote' | 'contact';
type StatusFilter = 'all' | 'new' | 'in_progress' | 'closed';

export const MyRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const { navigate } = useNavigation();

  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected request for detail modal
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    const res = await fetchMyContactRequests();
    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setRequests(res.requests);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Real counts for compact summary bar
  const totalCount = requests.length;
  const quotesCount = requests.filter((r) => r.request_type === 'quote').length;
  const contactsCount = requests.filter((r) => r.request_type === 'contact').length;
  const inProgressCount = requests.filter((r) =>
    ['new', 'in_review', 'quoted'].includes(r.status)
  ).length;

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // 1. Type filter
      if (typeFilter !== 'all' && req.request_type !== typeFilter) {
        return false;
      }

      // 2. Status filter
      if (statusFilter === 'new' && req.status !== 'new') {
        return false;
      }
      if (
        statusFilter === 'in_progress' &&
        !['new', 'in_review', 'quoted'].includes(req.status)
      ) {
        return false;
      }
      if (
        statusFilter === 'closed' &&
        !['accepted', 'rejected', 'closed'].includes(req.status)
      ) {
        return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inSubject = (req.subject || '').toLowerCase().includes(q);
        const inMessage = (req.message || '').toLowerCase().includes(q);
        const inCourse = (req.academy_courses?.title || '').toLowerCase().includes(q);
        const inService = (req.services?.title || '').toLowerCase().includes(q);
        const inName = (req.full_name || '').toLowerCase().includes(q);

        if (!inSubject && !inMessage && !inCourse && !inService && !inName) {
          return false;
        }
      }

      return true;
    });
  }, [requests, typeFilter, statusFilter, searchQuery]);

  const handleResetFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="requests-client-shell">
      {/* 1. Page Header */}
      <div className="requests-client-header">
        <h1 className="requests-client-title">Mes demandes</h1>
        <p className="requests-client-subtitle">
          Suivez vos prises de contact et demandes de devis.
        </p>
      </div>

      {errorMessage && (
        <div className="auth-alert alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="academy-loading-box">
          <div className="spinner large" />
          <p>Chargement de vos demandes...</p>
        </div>
      ) : requests.length === 0 ? (
        /* 9. Empty State when user has 0 requests */
        <div className="requests-empty-state-card">
          <div className="requests-empty-icon-wrap">
            <MessageIcon size={34} />
          </div>
          <h3 className="requests-empty-title">
            Vous n'avez encore envoyé aucune demande.
          </h3>
          <p className="requests-empty-desc">
            Contactez une formation ou un service pour retrouver ici le suivi.
          </p>
          <div className="requests-empty-actions">
            <button
              type="button"
              className="btn-admin-cta secondary"
              onClick={() => navigate('academy')}
            >
              Voir les formations
            </button>
            <button
              type="button"
              className="btn-admin-cta primary"
              onClick={() => navigate('services')}
            >
              Voir les services
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 1. Quick Summary Compact Strip */}
          <section className="requests-summary-grid" aria-label="Résumé des demandes">
            <button
              type="button"
              className={`requests-summary-card ${
                typeFilter === 'all' && statusFilter === 'all' ? 'active' : ''
              }`}
              onClick={() => {
                setTypeFilter('all');
                setStatusFilter('all');
              }}
            >
              <span className="summary-card-label">Toutes</span>
              <span className="summary-card-count">{totalCount}</span>
            </button>

            <button
              type="button"
              className={`requests-summary-card ${typeFilter === 'quote' ? 'active' : ''}`}
              onClick={() => {
                setTypeFilter('quote');
                setStatusFilter('all');
              }}
            >
              <span className="summary-card-label">Devis</span>
              <span className="summary-card-count count-quotes">{quotesCount}</span>
            </button>

            <button
              type="button"
              className={`requests-summary-card ${typeFilter === 'contact' ? 'active' : ''}`}
              onClick={() => {
                setTypeFilter('contact');
                setStatusFilter('all');
              }}
            >
              <span className="summary-card-label">Contacts</span>
              <span className="summary-card-count count-contacts">{contactsCount}</span>
            </button>

            <button
              type="button"
              className={`requests-summary-card ${
                statusFilter === 'in_progress' ? 'active' : ''
              }`}
              onClick={() => {
                setStatusFilter('in_progress');
                setTypeFilter('all');
              }}
            >
              <span className="summary-card-label">En cours</span>
              <span className="summary-card-count count-inreview">{inProgressCount}</span>
            </button>
          </section>

          {/* 2 & 3. Filters Toolbar & Search */}
          <div className="requests-toolbar-container">
            <div className="requests-toolbar-row">
              {/* Type Pills */}
              <div
                className="requests-filter-pills-group"
                role="tablist"
                aria-label="Filtres par type de demande"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={typeFilter === 'all'}
                  className={`requests-filter-btn ${typeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setTypeFilter('all')}
                >
                  <span>Toutes</span>
                  <span className="filter-badge">{totalCount}</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={typeFilter === 'quote'}
                  className={`requests-filter-btn ${typeFilter === 'quote' ? 'active' : ''}`}
                  onClick={() => setTypeFilter('quote')}
                >
                  <span>Devis</span>
                  {quotesCount > 0 && <span className="filter-badge">{quotesCount}</span>}
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={typeFilter === 'contact'}
                  className={`requests-filter-btn ${typeFilter === 'contact' ? 'active' : ''}`}
                  onClick={() => setTypeFilter('contact')}
                >
                  <span>Contacts</span>
                  {contactsCount > 0 && <span className="filter-badge">{contactsCount}</span>}
                </button>
              </div>

              {/* Search Box */}
              <div className="requests-search-box">
                <span className="requests-search-icon" aria-hidden="true">
                  <SearchIcon size={16} />
                </span>
                <input
                  type="text"
                  className="requests-search-input"
                  placeholder="Rechercher par sujet, service ou formation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Rechercher dans mes demandes"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="requests-search-clear"
                    onClick={() => setSearchQuery('')}
                    aria-label="Effacer la recherche"
                  >
                    <CloseIcon size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Secondary Status Subpills */}
            <div className="requests-status-pills-row">
              <span className="requests-status-label">Statut :</span>
              <button
                type="button"
                className={`requests-status-subpill ${
                  statusFilter === 'all' ? 'active' : ''
                }`}
                onClick={() => setStatusFilter('all')}
              >
                Tous statuts
              </button>
              <button
                type="button"
                className={`requests-status-subpill ${
                  statusFilter === 'new' ? 'active' : ''
                }`}
                onClick={() => setStatusFilter('new')}
              >
                Nouvelles
              </button>
              <button
                type="button"
                className={`requests-status-subpill ${
                  statusFilter === 'in_progress' ? 'active' : ''
                }`}
                onClick={() => setStatusFilter('in_progress')}
              >
                En cours
              </button>
              <button
                type="button"
                className={`requests-status-subpill ${
                  statusFilter === 'closed' ? 'active' : ''
                }`}
                onClick={() => setStatusFilter('closed')}
              >
                Clôturées
              </button>
            </div>
          </div>

          {/* 4 & 7. Request Cards Grid */}
          {filteredRequests.length === 0 ? (
            <div className="requests-empty-state-card">
              <h3 className="requests-empty-title">Aucune demande trouvée</h3>
              <p className="requests-empty-desc">
                Aucune demande ne correspond à vos filtres actuels.
              </p>
              <button
                type="button"
                className="btn-admin-cta secondary"
                onClick={handleResetFilters}
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="requests-grid-layout">
              {filteredRequests.map((req) => {
                const formattedDate = req.created_at
                  ? new Date(req.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—';

                // Entity title based on source
                const relatedTitle =
                  req.source_type === 'academy'
                    ? req.academy_courses?.title || 'Formation Académie'
                    : req.source_type === 'service'
                    ? req.services?.title || 'Prestation de service'
                    : 'Demande générale';

                return (
                  <article
                    key={req.id}
                    className="request-client-card"
                    onClick={() => setSelectedRequest(req)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedRequest(req);
                      }
                    }}
                  >
                    {/* 1. Type + Origine & Statut */}
                    <div className="request-card-header-line">
                      <div className="request-card-badge-cluster">
                        <RequestTypeBadge type={req.request_type} />
                        <span style={{ color: 'rgba(148, 163, 184, 0.4)' }}>•</span>
                        <RequestSourceBadge source={req.source_type} />
                      </div>
                      <RequestStatusBadge status={req.status} />
                    </div>

                    {/* 2 & 3 & 4. Title, Subject & Excerpt */}
                    <div className="request-card-content">
                      {/* 2. Titre contenu concerné */}
                      <h3 className="request-entity-title">{relatedTitle}</h3>

                      {/* 3. Sujet */}
                      {req.subject && (
                        <p className="request-subject-line">{req.subject}</p>
                      )}

                      {/* 4. Aperçu court du message */}
                      <p className="request-message-excerpt">{req.message}</p>
                    </div>

                    {/* 5, 6 & 7. Date, Statut / Réponse & Bouton détail */}
                    <div className="request-card-footer-line">
                      <div className="request-card-date-col">
                        <span className="request-date-tag">
                          <CalendarIcon size={13} />
                          <span>Envoyée le {formattedDate}</span>
                        </span>

                        {req.admin_response && (
                          <span className="response-indicator-pill">
                            <span className="indicator-dot" aria-hidden="true" />
                            <span>Réponse reçue</span>
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="btn-request-view-detail"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequest(req);
                        }}
                      >
                        <span>Voir le détail</span>
                        <ArrowRightIcon size={14} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 10. Detail Modal for Selected Request */}
      {selectedRequest && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="request-detail-modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="admin-modal-header">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <RequestTypeBadge type={selectedRequest.request_type} />
                  <span style={{ color: 'rgba(148, 163, 184, 0.4)' }}>•</span>
                  <RequestSourceBadge source={selectedRequest.source_type} />
                </div>
                <h3 className="modal-title">
                  {selectedRequest.subject || 'Détails de la demande'}
                </h3>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setSelectedRequest(null)}
                aria-label="Fermer"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Modal Content Sections */}
            <div className="request-detail-body">
              {/* Section 1: Informations & État */}
              <div className="detail-card-panel">
                <span className="panel-title">Informations de la demande</span>
                <div className="detail-info-grid">
                  <div className="detail-info-cell">
                    <span className="cell-label">Statut de traitement</span>
                    <div className="mt-1">
                      <RequestStatusBadge status={selectedRequest.status} />
                    </div>
                  </div>

                  <div className="detail-info-cell">
                    <span className="cell-label">Date d'envoi</span>
                    <span className="cell-value font-mono">
                      {selectedRequest.created_at
                        ? new Date(selectedRequest.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </span>
                  </div>

                  <div className="detail-info-cell">
                    <span className="cell-label">Élément concerné</span>
                    <span className="cell-value">
                      {selectedRequest.source_type === 'academy'
                        ? selectedRequest.academy_courses?.title || 'Formation Académie'
                        : selectedRequest.source_type === 'service'
                        ? selectedRequest.services?.title || 'Prestation de service'
                        : 'Demande générale'}
                    </span>
                  </div>

                  <div className="detail-info-cell">
                    <span className="cell-label">Demandeur</span>
                    <span className="cell-value">{selectedRequest.full_name}</span>
                  </div>

                  {selectedRequest.phone && (
                    <div className="detail-info-cell">
                      <span className="cell-label">Téléphone</span>
                      <span className="cell-value font-mono">{selectedRequest.phone}</span>
                    </div>
                  )}

                  {selectedRequest.email && (
                    <div className="detail-info-cell">
                      <span className="cell-label">Email</span>
                      <span className="cell-value font-mono">{selectedRequest.email}</span>
                    </div>
                  )}

                  {selectedRequest.request_type === 'quote' && selectedRequest.budget && (
                    <div className="detail-info-cell">
                      <span className="cell-label">Budget indicatif</span>
                      <span className="cell-value font-mono text-cyan-400">
                        {selectedRequest.budget}
                      </span>
                    </div>
                  )}

                  {selectedRequest.request_type === 'quote' && selectedRequest.preferred_date && (
                    <div className="detail-info-cell">
                      <span className="cell-label">Date souhaitée</span>
                      <span className="cell-value font-mono">
                        {new Date(selectedRequest.preferred_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Message / Besoin */}
              <div className="detail-message-card">
                <span className="panel-title">
                  {selectedRequest.request_type === 'quote'
                    ? 'Description de votre besoin'
                    : 'Votre message'}
                </span>
                <p className="detail-message-text">{selectedRequest.message}</p>
              </div>

              {/* Section 3: Distinct Admin Response Card */}
              {selectedRequest.admin_response ? (
                <div className="detail-admin-response-card">
                  <div className="admin-response-head">
                    <CheckCircleIcon size={18} className="text-cyan-400" />
                    <span>Réponse de l'équipe DB-Connect</span>
                  </div>
                  <div className="admin-response-content">
                    {selectedRequest.admin_response}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '0.5rem', color: '#64748b', fontSize: '0.8rem' }}>
                  Votre demande est entre les mains de notre équipe. Vous recevrez une réponse ici dès son traitement.
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="admin-modal-actions">
              <button
                type="button"
                className="btn-admin-cta secondary"
                onClick={() => setSelectedRequest(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
