import React, { useState, useMemo } from 'react';
import { updateServiceRequestStatus } from '../servicesService';
import { getServiceRequestStatusConfig } from '../utils';
import { SearchIcon, PackageIcon, CloseIcon } from '@/components/icons';
import type { ServiceRequestRecord, ServiceRequestStatus } from '@/types';

interface ServiceRequestsAdminProps {
  requests: ServiceRequestRecord[];
  onRefresh: () => void;
}

export const ServiceRequestsAdmin: React.FC<ServiceRequestsAdminProps> = ({
  requests,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ServiceRequestStatus>('all');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequestRecord | null>(null);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter requests by client name or phone
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        req.full_name.toLowerCase().includes(q) ||
        req.phone.toLowerCase().includes(q) ||
        (req.services?.title && req.services.title.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [requests, statusFilter, searchQuery]);

  const handleStatusChange = async (requestId: string, newStatus: ServiceRequestStatus) => {
    setUpdatingId(requestId);
    setActionMessage(null);
    setErrorMessage(null);

    const res = await updateServiceRequestStatus(requestId, newStatus);
    if (!res.success) {
      setErrorMessage(res.error || 'Erreur lors du changement de statut de la demande.');
    } else {
      setActionMessage('Statut de la demande mis à jour avec succès.');
      onRefresh();

      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest({
          ...selectedRequest,
          status: newStatus,
        });
      }
    }
    setUpdatingId(null);
  };

  return (
    <div className="admin-orders-view">
      <div className="admin-table-toolbar">
        <div>
          <h2 className="toolbar-section-title">Demandes de prestations</h2>
          <p className="toolbar-section-sub">
            Traitement, suivi commercial et exécution des demandes clients
          </p>
        </div>
      </div>

      {actionMessage && (
        <div className="auth-alert alert-success" role="status">
          {actionMessage}
        </div>
      )}

      {errorMessage && (
        <div className="auth-alert alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Filter and search bar */}
      <div className="admin-filter-bar">
        <div className="admin-search-wrapper">
          <SearchIcon className="search-icon" size={17} />
          <input
            type="search"
            className="header-search-input"
            placeholder="Rechercher par nom de client, téléphone, prestation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="admin-select-filters">
          <select
            className="form-input select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ServiceRequestStatus)}
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="contacted">Contacté</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminée</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="empty-catalog-state">
          <div className="empty-icon-circle">
            <PackageIcon size={38} />
          </div>
          <h3 className="empty-title">Aucune demande trouvée</h3>
          <p className="empty-subtitle">
            {searchQuery || statusFilter !== 'all'
              ? 'Aucune demande ne correspond à vos filtres.'
              : 'Aucune demande de prestation enregistrée pour le moment.'}
          </p>
        </div>
      ) : (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Service</th>
                <th>Téléphone</th>
                <th>Date demande</th>
                <th>Date souhaitée</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => {
                const formattedCreatedDate = new Date(req.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const formattedPrefDate = req.preferred_date
                  ? new Date(req.preferred_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—';

                const statusConfig = getServiceRequestStatusConfig(req.status);
                const isWorking = updatingId === req.id;
                const serviceTitle = req.services?.title || req.service?.title || 'Prestation personnalisée';

                return (
                  <tr key={req.id}>
                    <td className="font-semibold text-main">{req.full_name}</td>
                    <td className="text-muted">{serviceTitle}</td>
                    <td className="font-mono text-muted">{req.phone}</td>
                    <td className="text-muted">{formattedCreatedDate}</td>
                    <td className="font-mono text-muted">{formattedPrefDate}</td>
                    <td>
                      <span className={statusConfig.className}>{statusConfig.label}</span>
                    </td>
                    <td className="text-right">
                      <div className="table-actions-group">
                        <button
                          type="button"
                          className="btn-table-action edit"
                          onClick={() => setSelectedRequest(req)}
                          title="Voir le dossier complet"
                        >
                          Détails
                        </button>

                        {/* Sequential workflow actions */}
                        {req.status === 'pending' && (
                          <button
                            type="button"
                            className="btn-table-action content"
                            onClick={() => handleStatusChange(req.id, 'contacted')}
                            disabled={isWorking}
                            title="Marquer comme contacté"
                          >
                            Contacter
                          </button>
                        )}
                        {req.status === 'contacted' && (
                          <button
                            type="button"
                            className="btn-table-action content"
                            onClick={() => handleStatusChange(req.id, 'in_progress')}
                            disabled={isWorking}
                            title="Lancer la réalisation"
                          >
                            Démarrer
                          </button>
                        )}
                        {req.status === 'in_progress' && (
                          <button
                            type="button"
                            className="btn-table-action publish"
                            onClick={() => handleStatusChange(req.id, 'completed')}
                            disabled={isWorking}
                            title="Marquer comme terminée"
                          >
                            Terminer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin Request Detail Modal */}
      {selectedRequest && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedRequest(null)}>
          <div className="admin-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="modal-title">Dossier de prestation</h3>
                <span className="modal-sub">
                  Service : <strong>{selectedRequest.services?.title || selectedRequest.service?.title || 'Prestation'}</strong> &bull; Créé le {new Date(selectedRequest.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setSelectedRequest(null)}
              >
                &times;
              </button>
            </div>

            <div className="modal-customer-info-grid">
              <div className="info-block-cell">
                <span className="cell-label">Client</span>
                <span className="cell-value">{selectedRequest.full_name}</span>
              </div>
              <div className="info-block-cell">
                <span className="cell-label">Téléphone</span>
                <span className="cell-value font-mono">{selectedRequest.phone}</span>
              </div>
              <div className="info-block-cell">
                <span className="cell-label">Email</span>
                <span className="cell-value font-mono">{selectedRequest.email || '—'}</span>
              </div>
              <div className="info-block-cell">
                <span className="cell-label">Date souhaitée</span>
                <span className="cell-value font-mono">
                  {selectedRequest.preferred_date
                    ? new Date(selectedRequest.preferred_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Non spécifiée'}
                </span>
              </div>
              <div className="info-block-cell">
                <span className="cell-label">Statut actuel</span>
                <div style={{ marginTop: '0.2rem' }}>
                  <span className={getServiceRequestStatusConfig(selectedRequest.status).className}>
                    {getServiceRequestStatusConfig(selectedRequest.status).label}
                  </span>
                </div>
              </div>
              <div className="info-block-cell full-width">
                <span className="cell-label">Message transmis par le client</span>
                <p className="delivery-address-text italic" style={{ marginTop: '0.35rem' }}>
                  {selectedRequest.message}
                </p>
              </div>
            </div>

            {/* Admin Status Transitions Bar */}
            <div className="modal-status-actions-bar">
              <span className="actions-bar-label">Modifier le statut de traitement :</span>
              <div className="status-buttons-cluster">
                {selectedRequest.status !== 'contacted' && selectedRequest.status !== 'completed' && selectedRequest.status !== 'cancelled' && (
                  <button
                    type="button"
                    className="btn-status-pill outline-accent"
                    onClick={() => handleStatusChange(selectedRequest.id, 'contacted')}
                    disabled={updatingId === selectedRequest.id}
                  >
                    Marquer contacté
                  </button>
                )}
                {selectedRequest.status !== 'in_progress' && selectedRequest.status !== 'completed' && selectedRequest.status !== 'cancelled' && (
                  <button
                    type="button"
                    className="btn-status-pill outline-accent"
                    onClick={() => handleStatusChange(selectedRequest.id, 'in_progress')}
                    disabled={updatingId === selectedRequest.id}
                  >
                    En cours de réalisation
                  </button>
                )}
                {selectedRequest.status !== 'completed' && selectedRequest.status !== 'cancelled' && (
                  <button
                    type="button"
                    className="btn-status-pill outline-success"
                    onClick={() => handleStatusChange(selectedRequest.id, 'completed')}
                    disabled={updatingId === selectedRequest.id}
                  >
                    Marquer terminée
                  </button>
                )}

                {/* Cancel allowed if NOT completed */}
                {selectedRequest.status !== 'completed' && selectedRequest.status !== 'cancelled' && (
                  <button
                    type="button"
                    className="btn-status-pill outline-danger"
                    onClick={() => {
                      const ok = window.confirm('Confirmez-vous l\'annulation de cette demande ?');
                      if (ok) handleStatusChange(selectedRequest.id, 'cancelled');
                    }}
                    disabled={updatingId === selectedRequest.id}
                  >
                    Annuler la demande
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
