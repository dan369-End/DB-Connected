import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/features/auth';
import { useNavigation } from '@/hooks/useNavigation';
import type { OpportunityApplication } from '@/types';
import {
  fetchUserApplications,
  withdrawApplication,
  formatApplicationStatus,
  getApplicationStatusBadgeClass,
  formatDateTime,
} from '../opportunitiesService';
import { ApplicationDetailModal } from './ApplicationDetailModal';
import {
  OpportunitiesIcon,
  BuildingIcon,
  CalendarIcon,
  CheckCircleIcon,
  SearchIcon,
} from '@/components/icons';

export const MyApplications: React.FC = () => {
  const { user } = useAuth();
  const { navigate } = useNavigation();

  const [applications, setApplications] = useState<OpportunityApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<OpportunityApplication | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const { applications: apps, error } = await fetchUserApplications(user.id);
      if (error) {
        setErrorMessage('Impossible de charger vos candidatures.');
      } else {
        setApplications(apps);
      }
    } catch {
      setErrorMessage('Une erreur est survenue lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleWithdraw = async (applicationId: string) => {
    if (!user) return;
    const ok = window.confirm(
      'Confirmez-vous le retrait de votre candidature ? Cette action est irréversible.'
    );
    if (!ok) return;

    setWithdrawingId(applicationId);
    setErrorMessage(null);
    setActionSuccess(null);

    try {
      const res = await withdrawApplication(applicationId, user.id);
      if (!res.success) {
        setErrorMessage(res.error || 'Impossible de retirer votre candidature.');
      } else {
        setActionSuccess('Votre candidature a été retirée.');
        if (selectedApplication?.id === applicationId) {
          setSelectedApplication(null);
        }
        await loadApplications();
      }
    } catch {
      setErrorMessage('Une erreur imprévue est survenue.');
    } finally {
      setWithdrawingId(null);
    }
  };

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const oppTitle = app.opportunities?.title?.toLowerCase() || '';
      const orgName = app.opportunities?.organization_name?.toLowerCase() || '';
      return oppTitle.includes(q) || orgName.includes(q);
    });
  }, [applications, searchQuery]);

  return (
    <div className="marketplace-page-container">
      {/* Breadcrumb nav */}
      <div className="breadcrumb-nav-box">
        <button
          type="button"
          className="btn-back-breadcrumb"
          onClick={() => navigate('opportunities')}
        >
          &larr; Retour aux opportunités
        </button>
      </div>

      {/* Header Banner */}
      <div className="marketplace-header-banner">
        <div className="marketplace-title-group">
          <div className="marketplace-chip">
            <span className="chip-dot" />
            <span>Suivi des Candidatures</span>
          </div>
          <h1 className="marketplace-title">Mes candidatures</h1>
          <p className="marketplace-tagline">
            Consultez l'historique et l'état de traitement de vos candidatures aux opportunités DB-Connect
          </p>
        </div>
      </div>

      {/* Feedback alerts */}
      {actionSuccess && (
        <div className="auth-alert alert-success" role="status">
          <CheckCircleIcon size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="auth-alert alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Filter and Search Bar */}
      {applications.length > 0 && (
        <div className="marketplace-toolbar">
          <div className="marketplace-search-box">
            <SearchIcon className="search-icon" size={18} />
            <input
              type="search"
              className="header-search-input"
              placeholder="Rechercher par offre ou organisation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-400 font-mono ml-auto">
            {applications.length} candidature{applications.length > 1 ? 's' : ''} au total
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="academy-loading-box">
          <div className="spinner large" />
          <p>Chargement de vos candidatures en cours...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="empty-catalog-state">
          <div className="empty-icon-circle">
            <OpportunitiesIcon size={38} />
          </div>
          <h3 className="empty-title">Aucune candidature enregistrée</h3>
          <p className="empty-subtitle">
            Vous n'avez pas encore postulé à des offres ou missions sur DB-Connect.
          </p>
          <button
            type="button"
            className="btn-admin-cta primary"
            onClick={() => navigate('opportunities')}
          >
            Découvrir les opportunités disponibles
          </button>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="empty-catalog-state">
          <h3 className="empty-title">Aucune candidature ne correspond à votre recherche</h3>
          <p className="empty-subtitle">Essayez avec un autre mot-clé ou réinitialisez la recherche.</p>
          <button
            type="button"
            className="btn-admin-cta"
            onClick={() => setSearchQuery('')}
          >
            Réinitialiser le filtre
          </button>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-courses-table">
            <thead>
              <tr>
                <th>Opportunité & Organisation</th>
                <th>Date d'envoi</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((app) => {
                const canWithdraw = !['accepted', 'rejected', 'withdrawn'].includes(app.status);
                const opp = app.opportunities;

                return (
                  <tr key={app.id}>
                    <td>
                      <div className="font-semibold text-slate-100">
                        {opp?.title || 'Opportunité non spécifiée'}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <BuildingIcon size={13} />
                        <span>{opp?.organization_name || 'Organisation'}</span>
                        {opp?.location && <span>&bull; {opp.location}</span>}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-slate-300 font-mono">
                        {formatDateTime(app.created_at)}
                      </span>
                    </td>
                    <td>
                      <span className={`app-status-badge ${getApplicationStatusBadgeClass(app.status)}`}>
                        {formatApplicationStatus(app.status)}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={() => setSelectedApplication(app)}
                          title="Consulter le détail de la candidature"
                        >
                          Détails
                        </button>

                        {canWithdraw && (
                          <button
                            type="button"
                            className="btn-table-action delete-action"
                            disabled={withdrawingId === app.id}
                            onClick={() => handleWithdraw(app.id)}
                            title="Retirer ma candidature"
                          >
                            {withdrawingId === app.id ? 'Retrait...' : 'Retirer'}
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

      {/* Application Detail Modal */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onWithdraw={handleWithdraw}
          isWithdrawing={withdrawingId === selectedApplication.id}
        />
      )}
    </div>
  );
};
