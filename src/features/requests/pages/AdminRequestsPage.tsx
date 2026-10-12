import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth, RoleGuard } from '@/features/auth';
import { useNavigation } from '@/hooks/useNavigation';
import {
  fetchAdminContactRequests,
  updateAdminContactRequest,
} from '../requestsService';
import { RequestStatusBadge, STATUS_LABELS } from '../components/RequestStatusBadge';
import {
  SearchIcon,
  CloseIcon,
  CheckCircleIcon,
  PhoneIcon,
  ServicesIcon,
} from '@/components/icons';
import type { ContactRequest, ContactRequestStatus } from '@/types';

export const AdminRequestsPage: React.FC = () => {
  const { navigate } = useNavigation();

  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Selected request for admin management drawer / modal
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);
  const [adminResponseText, setAdminResponseText] = useState<string>('');
  const [targetStatus, setTargetStatus] = useState<ContactRequestStatus>('new');
  const [isSavingResponse, setIsSavingResponse] = useState<boolean>(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'contact' | 'quote'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'academy' | 'service' | 'general'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ContactRequestStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadAllRequests = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    const res = await fetchAdminContactRequests();
    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setRequests(res.requests);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAllRequests();
  }, [loadAllRequests]);

  const handleOpenDetail = (req: ContactRequest) => {
    setSelectedRequest(req);
    setAdminResponseText(req.admin_response || '');
    setTargetStatus(req.status);
    setActionSuccessMessage(null);
  };

  const handleCloseDetail = () => {
    if (!isSavingResponse) {
      setSelectedRequest(null);
      setActionSuccessMessage(null);
    }
  };

  const handleSaveResponseAndStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || isSavingResponse) return;

    setIsSavingResponse(true);
    setActionSuccessMessage(null);
    setErrorMessage(null);

    const res = await updateAdminContactRequest(selectedRequest.id, {
      adminResponse: adminResponseText,
      status: targetStatus,
    });

    setIsSavingResponse(false);

    if (!res.success || !res.data) {
      setErrorMessage(res.error || 'Erreur lors de l\'enregistrement de la réponse.');
    } else {
      setActionSuccessMessage('Réponse et statut enregistrés avec succès.');
      setSelectedRequest(res.data);
      // Update item in local list
      setRequests((prev) =>
        prev.map((r) => (r.id === res.data!.id ? res.data! : r))
      );
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchType = typeFilter === 'all' || req.request_type === typeFilter;
      const matchSource = sourceFilter === 'all' || req.source_type === sourceFilter;
      const matchStatus = statusFilter === 'all' || req.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        req.full_name?.toLowerCase().includes(q) ||
        req.email?.toLowerCase().includes(q) ||
        req.phone?.toLowerCase().includes(q) ||
        req.subject?.toLowerCase().includes(q) ||
        req.message?.toLowerCase().includes(q) ||
        req.academy_courses?.title?.toLowerCase().includes(q) ||
        req.services?.title?.toLowerCase().includes(q);

      return matchType && matchSource && matchStatus && matchSearch;
    });
  }, [requests, typeFilter, sourceFilter, statusFilter, searchQuery]);

  // Counts for overview
  const totalCount = requests.length;
  const newCount = requests.filter((r) => r.status === 'new').length;
  const inReviewCount = requests.filter((r) => r.status === 'in_review').length;
  const quotedCount = requests.filter((r) => r.status === 'quoted').length;
  const closedCount = requests.filter((r) => r.status === 'closed' || r.status === 'accepted').length;

  return (
    <RoleGuard
      allowedRoles={['academy_admin', 'services_admin', 'super_admin']}
      fallback={
        <div className="module-page-container">
          <div className="academy-error-box" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
            <h3 className="empty-title">Accès réservé aux administrateurs</h3>
            <p style={{ marginTop: '0.75rem', color: 'var(--color-text-muted)' }}>
              Cette interface centralisée de gestion des messages et devis est réservée aux administrateurs autorisés (<code>academy_admin</code>, <code>services_admin</code> ou <code>super_admin</code>).
            </p>
            <button
              type="button"
              className="btn-back-catalog"
              style={{ marginTop: '1.5rem' }}
              onClick={() => navigate('home')}
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      }
    >
      <div className="module-page-container">
        {/* Page Header */}
        <div className="module-page-header">
          <div className="header-left-col">
            <h1 className="module-page-title">Messages & Devis</h1>
            <p className="module-page-subtitle">
              Boîte de réception centralisée des demandes de contact et devis (Académie, Services et Général)
            </p>
          </div>
          <div className="header-right-col">
            <button
              type="button"
              className="btn-admin-cta secondary"
              onClick={loadAllRequests}
              disabled={loading}
            >
              Actualiser
            </button>
          </div>
        </div>

        {/* Quick KPI Stats Summary */}
        <div className="admin-stats-grid mb-6">
          <div className="admin-stat-card">
            <span className="stat-label">Total Demandes</span>
            <span className="stat-value">{loading ? '...' : totalCount}</span>
            <span className="stat-detail">Toutes catégories confondues</span>
          </div>

          <div className="admin-stat-card">
            <span className="stat-label">Nouvelles</span>
            <span className="stat-value text-cyan-400">{loading ? '...' : newCount}</span>
            <span className="stat-detail">À traiter en priorité</span>
          </div>

          <div className="admin-stat-card">
            <span className="stat-label">En cours d'étude</span>
            <span className="stat-value text-amber-400">{loading ? '...' : inReviewCount}</span>
            <span className="stat-detail">En analyse ou qualification</span>
          </div>

          <div className="admin-stat-card">
            <span className="stat-label">Devis envoyés</span>
            <span className="stat-value text-indigo-400">{loading ? '...' : quotedCount}</span>
            <span className="stat-detail">Propositions transmises</span>
          </div>

          <div className="admin-stat-card">
            <span className="stat-label">Traitées / Clôturées</span>
            <span className="stat-value text-emerald-400">{loading ? '...' : closedCount}</span>
            <span className="stat-detail">Acceptées ou archivées</span>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="admin-requests-filter-panel">
          <div className="filter-row-top">
            <div className="search-box-wrap flex-1">
              <SearchIcon size={16} className="search-icon-left text-slate-400" />
              <input
                type="text"
                className="form-input search-input"
                placeholder="Rechercher par nom, email, téléphone, sujet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="selects-cluster">
              {/* Type Filter */}
              <select
                className="form-input select-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
              >
                <option value="all">Tous types</option>
                <option value="quote">Devis</option>
                <option value="contact">Contacts</option>
              </select>

              {/* Source Filter */}
              <select
                className="form-input select-filter"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as any)}
              >
                <option value="all">Toutes sources</option>
                <option value="academy">Académie</option>
                <option value="service">Services</option>
                <option value="general">Général</option>
              </select>

              {/* Status Filter */}
              <select
                className="form-input select-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">Tous statuts</option>
                <option value="new">Nouvelle</option>
                <option value="in_review">En cours d'étude</option>
                <option value="quoted">Devis envoyé</option>
                <option value="accepted">Acceptée</option>
                <option value="rejected">Refusée</option>
                <option value="closed">Clôturée</option>
              </select>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="auth-alert alert-error my-4" role="alert">
            {errorMessage}
          </div>
        )}

        {/* Admin Requests Table */}
        {loading ? (
          <div className="academy-loading-box">
            <div className="spinner large" />
            <p>Chargement des demandes...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-catalog-state">
            <div className="empty-icon-circle">
              <ServicesIcon size={38} />
            </div>
            <h3 className="empty-title">Aucune demande trouvée</h3>
            <p className="empty-subtitle">
              {searchQuery || typeFilter !== 'all' || sourceFilter !== 'all' || statusFilter !== 'all'
                ? 'Aucune demande ne correspond aux critères de filtre sélectionnés.'
                : 'La boîte de réception ne contient aucune demande pour le moment.'}
            </p>
          </div>
        ) : (
          <div className="admin-table-card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Utilisateur / Contact</th>
                  <th>Type</th>
                  <th>Origine</th>
                  <th>Élément concerné</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => {
                  const formattedDate = req.created_at
                    ? new Date(req.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—';

                  const relatedTitle =
                    req.source_type === 'academy'
                      ? req.academy_courses?.title || 'Formation Académie'
                      : req.source_type === 'service'
                      ? req.services?.title || 'Prestation'
                      : 'Général';

                  const isQuote = req.request_type === 'quote';

                  return (
                    <tr key={req.id}>
                      <td>
                        <div className="table-user-cell">
                          <span className="font-semibold text-slate-100 block">
                            {req.full_name}
                          </span>
                          <span className="font-mono text-xs text-slate-400 block">
                            {req.email || req.phone || '—'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className={`type-chip ${isQuote ? 'quote' : 'contact'}`}>
                          {isQuote ? 'Devis' : 'Contact'}
                        </span>
                      </td>

                      <td>
                        <span className="source-chip">
                          {req.source_type === 'academy'
                            ? 'Académie'
                            : req.source_type === 'service'
                            ? 'Service'
                            : 'Général'}
                        </span>
                      </td>

                      <td>
                        <span className="text-slate-300 text-sm max-w-[200px] truncate block" title={relatedTitle}>
                          {relatedTitle}
                        </span>
                        {req.subject && (
                          <span className="text-xs text-muted max-w-[200px] truncate block" title={req.subject}>
                            {req.subject}
                          </span>
                        )}
                      </td>

                      <td>
                        <RequestStatusBadge status={req.status} />
                      </td>

                      <td className="font-mono text-xs text-muted">
                        {formattedDate}
                      </td>

                      <td className="text-right">
                        <button
                          type="button"
                          className="btn-table-action edit"
                          onClick={() => handleOpenDetail(req)}
                        >
                          Traiter
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Treatment Drawer / Modal for Selected Request */}
        {selectedRequest && (
          <div className="admin-modal-backdrop" onClick={handleCloseDetail}>
            <div
              className="admin-modal-box admin-treatment-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="admin-modal-header">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`type-chip ${
                        selectedRequest.request_type === 'quote' ? 'quote' : 'contact'
                      }`}
                    >
                      {selectedRequest.request_type === 'quote' ? 'Devis' : 'Contact'}
                    </span>
                    <span className="source-chip">
                      {selectedRequest.source_type === 'academy'
                        ? 'Académie'
                        : selectedRequest.source_type === 'service'
                        ? 'Service'
                        : 'Général'}
                    </span>
                  </div>
                  <h3 className="modal-title">
                    Traitement de la demande de {selectedRequest.full_name}
                  </h3>
                </div>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={handleCloseDetail}
                  disabled={isSavingResponse}
                  aria-label="Fermer"
                >
                  <CloseIcon size={20} />
                </button>
              </div>

              {actionSuccessMessage && (
                <div className="auth-alert alert-success mx-6 mt-4" role="status">
                  {actionSuccessMessage}
                </div>
              )}

              <div className="treatment-modal-body">
                {/* 1. Identity & Details Strip */}
                <div className="treatment-info-grid">
                  <div className="treatment-info-card">
                    <span className="detail-label">Identité utilisateur :</span>
                    <span className="font-semibold text-slate-100 block mt-1">
                      {selectedRequest.full_name}
                    </span>
                    {selectedRequest.phone && (
                      <span className="font-mono text-xs text-cyan-400 block mt-1">
                        <PhoneIcon size={12} className="inline mr-1" />
                        {selectedRequest.phone}
                      </span>
                    )}
                    {selectedRequest.email && (
                      <span className="text-xs text-slate-400 block mt-0.5">
                        {selectedRequest.email}
                      </span>
                    )}
                  </div>

                  <div className="treatment-info-card">
                    <span className="detail-label">Élément concerné :</span>
                    <span className="font-semibold text-slate-100 block mt-1">
                      {selectedRequest.source_type === 'academy'
                        ? selectedRequest.academy_courses?.title || 'Formation Académie'
                        : selectedRequest.source_type === 'service'
                        ? selectedRequest.services?.title || 'Prestation de service'
                        : 'Demande générale'}
                    </span>
                    <span className="text-xs text-muted block mt-1">
                      Envoyée le {new Date(selectedRequest.created_at || '').toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                {/* 2. Message / Requirement */}
                <div className="treatment-message-section">
                  <span className="detail-label block mb-1">
                    {selectedRequest.request_type === 'quote'
                      ? 'Besoin exprimé par le demandeur :'
                      : 'Message du demandeur :'}
                  </span>
                  {selectedRequest.subject && (
                    <p className="font-medium text-slate-200 text-sm mb-2">
                      Sujet : {selectedRequest.subject}
                    </p>
                  )}
                  <div className="treatment-message-content">
                    {selectedRequest.message}
                  </div>

                  {/* Quote Specific metadata */}
                  {selectedRequest.request_type === 'quote' && (
                    <div className="quote-specific-meta-strip mt-3">
                      {selectedRequest.budget && (
                        <div className="meta-item">
                          <span className="detail-label">Budget indicatif :</span>
                          <span className="font-mono text-cyan-400 font-semibold ml-2">
                            {selectedRequest.budget}
                          </span>
                        </div>
                      )}
                      {selectedRequest.preferred_date && (
                        <div className="meta-item">
                          <span className="detail-label">Date souhaitée :</span>
                          <span className="font-mono text-slate-200 ml-2">
                            {new Date(selectedRequest.preferred_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Status and Response Editor */}
                <form onSubmit={handleSaveResponseAndStatus} className="treatment-editor-form">
                  <div className="form-group">
                    <label className="form-label" htmlFor="treatment-status">
                      Statut de traitement *
                    </label>
                    <select
                      id="treatment-status"
                      className="form-input"
                      value={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.value as ContactRequestStatus)}
                      disabled={isSavingResponse}
                    >
                      <option value="new">Nouvelle (en attente)</option>
                      <option value="in_review">En cours d'étude</option>
                      <option value="quoted">Devis envoyé (proposition transmise)</option>
                      <option value="accepted">Acceptée (validée)</option>
                      <option value="rejected">Refusée</option>
                      <option value="closed">Clôturée</option>
                    </select>
                    <span className="form-hint">
                      Mise à jour en temps réel visible dans l'espace « Mes demandes » de l'utilisateur.
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="treatment-response">
                      Réponse de l'équipe (visible par l'utilisateur)
                    </label>
                    <textarea
                      id="treatment-response"
                      rows={5}
                      className="form-input font-sans"
                      placeholder="Rédigez la réponse administrative, le devis ou les détails pour le demandeur..."
                      value={adminResponseText}
                      onChange={(e) => setAdminResponseText(e.target.value)}
                      disabled={isSavingResponse}
                    />
                    <span className="form-hint">
                      Cette réponse s'affichera directement dans la fiche de demande du demandeur.
                    </span>
                  </div>

                  <div className="treatment-actions-bar">
                    <button
                      type="button"
                      className="btn-admin-cta secondary"
                      onClick={handleCloseDetail}
                      disabled={isSavingResponse}
                    >
                      Fermer
                    </button>
                    <button
                      type="submit"
                      className="btn-admin-cta primary"
                      disabled={isSavingResponse}
                    >
                      {isSavingResponse ? (
                        <span className="btn-loading-content">
                          <span className="spinner" /> Enregistrement...
                        </span>
                      ) : (
                        'Enregistrer la réponse'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
};
