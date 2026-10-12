import React, { useState, useEffect, useMemo } from 'react';
import { updateServiceStatus, deleteService } from '../servicesService';
import { formatServicePrice, getServiceStatusConfig } from '../utils';
import { getServiceImageUrl } from '../utils/servicesStorage';
import { ServiceFormModal } from './ServiceFormModal';
import {
  PlusIcon,
  SearchIcon,
  EditIcon,
  DeleteIcon,
  ServicesIcon,
} from '@/components/icons';
import type { ServiceRecord, ServiceCategory, ServiceStatus } from '@/types';

interface ServicesManagerProps {
  services: ServiceRecord[];
  categories: ServiceCategory[];
  onRefresh: () => void;
}

// Micro-component for thumbnail with private storage signed URL resolution
const ServiceTableThumbnail: React.FC<{ imagePath?: string | null }> = ({ imagePath }) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    if (imagePath) {
      getServiceImageUrl(imagePath).then((url) => {
        if (!isCancelled) setResolvedUrl(url);
      });
    } else {
      setResolvedUrl(null);
    }
    return () => {
      isCancelled = true;
    };
  }, [imagePath]);

  if (resolvedUrl) {
    return <img src={resolvedUrl} alt="" className="table-course-thumb" />;
  }

  return (
    <div className="table-course-thumb-fallback">
      <ServicesIcon size={16} />
    </div>
  );
};

export const ServicesManager: React.FC<ServicesManagerProps> = ({
  services,
  categories,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ServiceStatus>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceRecord | null>(null);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesCategory =
        categoryFilter === 'all' ||
        s.category_id === categoryFilter ||
        s.services_categories?.id === categoryFilter;

      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        (s.short_description && s.short_description.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q));

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [services, categoryFilter, statusFilter, searchQuery]);

  const handleOpenCreate = () => {
    setSelectedService(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (srv: ServiceRecord) => {
    setSelectedService(srv);
    setModalOpen(true);
  };

  const handleQuickStatus = async (serviceId: string, newStatus: ServiceStatus) => {
    setUpdatingId(serviceId);
    setActionMessage(null);
    setErrorMessage(null);

    const res = await updateServiceStatus(serviceId, newStatus);
    if (!res.success) {
      setErrorMessage(res.error || 'Erreur lors du changement de statut.');
    } else {
      setActionMessage('Statut de la prestation mis à jour.');
      onRefresh();
    }
    setUpdatingId(null);
  };

  const handleDelete = async (srv: ServiceRecord) => {
    const ok = window.confirm(
      `Confirmez-vous la suppression définitive de la prestation « ${srv.title} » ?`
    );
    if (!ok) return;

    setDeletingId(srv.id);
    setActionMessage(null);
    setErrorMessage(null);

    const res = await deleteService(srv.id);
    if (!res.success) {
      setErrorMessage(res.error || 'Erreur lors de la suppression de la prestation.');
    } else {
      setActionMessage('Prestation supprimée avec succès.');
      onRefresh();
    }
    setDeletingId(null);
  };

  return (
    <div className="admin-product-manager">
      <div className="admin-table-toolbar">
        <div>
          <h2 className="toolbar-section-title">Catalogue des prestations</h2>
          <p className="toolbar-section-sub">
            Gérez les offres de services numériques publiées sur DB-Connect
          </p>
        </div>

        <button
          type="button"
          className="btn-admin-cta primary"
          onClick={handleOpenCreate}
        >
          <PlusIcon size={16} />
          <span>Nouvelle prestation</span>
        </button>
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
            placeholder="Rechercher une prestation par nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="admin-select-filters">
          <select
            className="form-input select-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="form-input select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ServiceStatus)}
          >
            <option value="all">Tous les statuts</option>
            <option value="published">Publiés</option>
            <option value="draft">Brouillons</option>
            <option value="archived">Archivés</option>
          </select>
        </div>
      </div>

      {filteredServices.length === 0 ? (
        <div className="empty-catalog-state">
          <div className="empty-icon-circle">
            <ServicesIcon size={38} />
          </div>
          <h3 className="empty-title">Aucune prestation trouvée</h3>
          <p className="empty-subtitle">
            {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Aucune prestation ne correspond à vos filtres actuels.'
              : 'Créez votre première prestation professionnelle.'}
          </p>
        </div>
      ) : (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Prestation</th>
                <th>Catégorie</th>
                <th>Tarif indicatif</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((srv) => {
                const catName = srv.services_categories?.name || '—';
                const formattedPrice = formatServicePrice(srv.price_from, srv.currency || 'XAF');
                const statusConfig = getServiceStatusConfig(srv.status);
                const isUpdating = updatingId === srv.id;

                return (
                  <tr key={srv.id}>
                    <td>
                      <div className="table-course-cell">
                        <ServiceTableThumbnail imagePath={srv.image_url} />
                        <div className="table-item-primary">
                          <span className="font-semibold text-main">{srv.title}</span>
                          {srv.short_description && (
                            <span className="table-item-sub text-muted">
                              {srv.short_description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-muted">{catName}</td>
                    <td className="font-mono font-semibold text-main">{formattedPrice}</td>
                    <td>
                      <span className={statusConfig.className}>{statusConfig.label}</span>
                    </td>
                    <td className="text-right">
                      <div className="table-actions-group">
                        {/* Quick Status Toggles */}
                        {srv.status !== 'published' && (
                          <button
                            type="button"
                            className="btn-table-action publish"
                            onClick={() => handleQuickStatus(srv.id, 'published')}
                            disabled={isUpdating}
                            title="Publier la prestation"
                          >
                            Publier
                          </button>
                        )}
                        {srv.status === 'published' && (
                          <button
                            type="button"
                            className="btn-table-action content"
                            onClick={() => handleQuickStatus(srv.id, 'draft')}
                            disabled={isUpdating}
                            title="Mettre en brouillon"
                          >
                            Brouillon
                          </button>
                        )}
                        {srv.status !== 'archived' && (
                          <button
                            type="button"
                            className="btn-table-action"
                            style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}
                            onClick={() => handleQuickStatus(srv.id, 'archived')}
                            disabled={isUpdating}
                            title="Archiver"
                          >
                            Archiver
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-table-action edit"
                          onClick={() => handleOpenEdit(srv)}
                          title="Modifier la prestation"
                        >
                          <EditIcon size={14} />
                        </button>

                        <button
                          type="button"
                          className="btn-table-action delete"
                          onClick={() => handleDelete(srv)}
                          disabled={deletingId === srv.id}
                          title="Supprimer la prestation"
                        >
                          <DeleteIcon size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <ServiceFormModal
          service={selectedService}
          categories={categories}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            onRefresh();
            setActionMessage(
              selectedService
                ? 'Prestation mise à jour avec succès.'
                : 'Prestation créée avec succès.'
            );
          }}
        />
      )}
    </div>
  );
};
