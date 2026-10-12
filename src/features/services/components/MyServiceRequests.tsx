import React, { useState, useEffect } from 'react';
import { fetchUserServiceRequests } from '../servicesService';
import { useNavigation } from '@/hooks/useNavigation';
import { formatServicePrice, getServiceRequestStatusConfig } from '../utils';
import { PackageIcon, ArrowRightIcon, CloseIcon } from '@/components/icons';
import type { ServiceRequestRecord } from '@/types';

export const MyServiceRequests: React.FC = () => {
  const { navigate } = useNavigation();
  const [requests, setRequests] = useState<ServiceRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Detail Modal for selected request (read-only for user)
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequestRecord | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setErrorMessage(null);

    fetchUserServiceRequests().then((res) => {
      if (!isCancelled) {
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          setRequests(res.requests);
        }
        setLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="orders-page-container">
      {/* Header bar */}
      <div className="cart-header-row">
        <div>
          <button
            type="button"
            className="btn-back-breadcrumb"
            onClick={() => navigate('services')}
          >
            &larr; Retour au catalogue des services
          </button>
          <h1 className="cart-title">Mes demandes</h1>
          <p className="cart-subtitle">
            Suivez l'état d'avancement et les échanges relatifs à vos demandes de prestations
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="auth-alert alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="academy-loading-box">
          <div className="spinner large"></div>
          <p>Chargement de vos demandes de services...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-catalog-state">
          <div className="empty-icon-circle">
            <PackageIcon size={38} />
          </div>
          <h3 className="empty-title">Aucune demande pour le moment</h3>
          <p className="empty-subtitle">
            Vous n'avez pas encore formulé de demande de prestation. Découvrez dès maintenant les solutions et compétences proposées par DB-Connect.
          </p>
          <button
            type="button"
            className="btn-admin-cta primary"
            onClick={() => navigate('services')}
          >
            Découvrir les services
          </button>
        </div>
      ) : (
        <div className="orders-list-card">
          <div className="orders-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Date de création</th>
                  <th>Date souhaitée</th>
                  <th>Statut</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
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
                    : 'Non spécifiée';

                  const statusConfig = getServiceRequestStatusConfig(req.status);
                  const serviceTitle = req.services?.title || req.service?.title || 'Prestation personnalisée';

                  return (
                    <tr key={req.id}>
                      <td className="font-semibold text-main">
                        {serviceTitle}
                      </td>
                      <td className="text-muted">{formattedCreatedDate}</td>
                      <td className="font-mono text-muted">{formattedPrefDate}</td>
                      <td>
                        <span className={statusConfig.className}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="btn-table-action edit"
                          onClick={() => setSelectedRequest(req)}
                        >
                          <span>Détails</span>
                          <ArrowRightIcon size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Request Detail Modal (Strictly Read-Only) */}
      {selectedRequest && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedRequest(null)}>
          <div className="admin-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="modal-title">
                  {selectedRequest.services?.title || selectedRequest.service?.title || 'Demande de prestation'}
                </h3>
                <span className="modal-sub">
                  Enregistrée le{' '}
                  {new Date(selectedRequest.created_at).toLocaleDateString('fr-FR', {
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

            {/* Modal Body */}
            <div className="modal-customer-info-grid">
              <div className="info-block-cell">
                <span className="cell-label">Statut de la demande</span>
                <div style={{ marginTop: '0.2rem' }}>
                  <span className={getServiceRequestStatusConfig(selectedRequest.status).className}>
                    {getServiceRequestStatusConfig(selectedRequest.status).label}
                  </span>
                </div>
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
                <span className="cell-label">Demandeur</span>
                <span className="cell-value">{selectedRequest.full_name}</span>
              </div>

              <div className="info-block-cell">
                <span className="cell-label">Téléphone</span>
                <span className="cell-value font-mono">{selectedRequest.phone}</span>
              </div>

              {selectedRequest.email && (
                <div className="info-block-cell full-width">
                  <span className="cell-label">Adresse email</span>
                  <span className="cell-value font-mono">{selectedRequest.email}</span>
                </div>
              )}

              <div className="info-block-cell full-width">
                <span className="cell-label">Message transmis</span>
                <p className="delivery-address-text italic" style={{ marginTop: '0.25rem' }}>
                  {selectedRequest.message}
                </p>
              </div>
            </div>

            <div className="admin-modal-actions" style={{ justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn-admin-cta"
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
