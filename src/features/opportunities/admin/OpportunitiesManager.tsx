import React, { useState, useMemo } from 'react';
import type { Opportunity, OpportunityCategory, OpportunityStatus } from '@/types';
import {
  deleteOpportunity,
  updateOpportunityStatus,
  formatDeadline,
} from '../opportunitiesService';
import { OpportunityFormModal } from './OpportunityFormModal';
import { DeleteOpportunityModal } from '../components/DeleteOpportunityModal';
import { OpportunityImage } from '../components/OpportunityImage';
import {
  PlusIcon,
  SearchIcon,
  BuildingIcon,
  LocationIcon,
  OpportunitiesIcon,
  CheckCircleIcon,
  EditIcon,
  TrashIcon,
} from '@/components/icons';

interface OpportunitiesManagerProps {
  opportunities: Opportunity[];
  categories: OpportunityCategory[];
  onRefresh: () => Promise<void>;
}

export const OpportunitiesManager: React.FC<OpportunitiesManagerProps> = ({
  opportunities,
  categories,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OpportunityStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);

  // Delete confirmation popup state
  const [opportunityToDelete, setOpportunityToDelete] = useState<Opportunity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((o) => {
      // Status match
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;

      // Category match
      const matchesCat =
        categoryFilter === 'all' ||
        String(o.category_id) === String(categoryFilter) ||
        (o.opportunity_categories?.id != null &&
          String(o.opportunity_categories.id) === String(categoryFilter));

      // Text search match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.title.toLowerCase().includes(q) ||
        o.organization_name.toLowerCase().includes(q) ||
        (o.location && o.location.toLowerCase().includes(q));

      return matchesStatus && matchesCat && matchesSearch;
    });
  }, [opportunities, statusFilter, categoryFilter, searchQuery]);

  const handleOpenCreate = () => {
    setEditingOpportunity(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (opp: Opportunity) => {
    setEditingOpportunity(opp);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = async () => {
    setIsModalOpen(false);
    setEditingOpportunity(null);
    setActionSuccess('Opportunité enregistrée avec succès.');
    await onRefresh();
  };

  // Called when user clicks "Supprimer" in the table: opens confirmation popup
  const handleRequestDelete = (opp: Opportunity) => {
    setActionSuccess(null);
    setActionError(null);
    setOpportunityToDelete(opp);
  };

  // Executed only after user confirms deletion in the popup modal
  const handleConfirmDelete = async () => {
    if (!opportunityToDelete) return;

    setIsDeleting(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await deleteOpportunity(opportunityToDelete.id);
      if (!res.success) {
        setActionError(res.error || "Impossible de supprimer l'opportunité.");
      } else {
        setActionSuccess(`L'opportunité « ${opportunityToDelete.title} » a été supprimée.`);
        setOpportunityToDelete(null);
        await onRefresh();
      }
    } catch {
      setActionError('Une erreur inattendue est survenue.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickStatusChange = async (opp: Opportunity, newStatus: OpportunityStatus) => {
    setStatusUpdatingId(opp.id);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await updateOpportunityStatus(opp.id, newStatus);
      if (!res.success) {
        setActionError(res.error || 'Impossible de mettre à jour le statut.');
      } else {
        setActionSuccess(
          `Statut passé à « ${
            newStatus === 'published' ? 'Publiée' : newStatus === 'archived' ? 'Archivée' : 'Brouillon'
          } »`
        );
        await onRefresh();
      }
    } catch {
      setActionError('Une erreur inattendue est survenue.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <div className="admin-section-container">
      {/* Top action header */}
      <div className="admin-table-toolbar">
        <div>
          <h2 className="toolbar-section-title">Catalogue des Opportunités</h2>
          <p className="toolbar-section-sub">
            Gérez la publication des offres, missions et appels à candidatures
          </p>
        </div>
        <button
          type="button"
          className="btn-admin-cta primary"
          onClick={handleOpenCreate}
        >
          <PlusIcon size={16} />
          <span>Nouvelle opportunité</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="auth-alert alert-success" role="status">
          <CheckCircleIcon size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="auth-alert alert-error" role="alert">
          {actionError}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="admin-filter-bar">
        <div className="admin-search-wrapper">
          <SearchIcon className="search-icon" size={17} />
          <input
            type="search"
            className="header-search-input"
            placeholder="Rechercher par titre ou organisation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="admin-select-filters">
          <select
            className="form-input select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | OpportunityStatus)}
          >
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="published">Publiée</option>
            <option value="archived">Archivée</option>
          </select>

          <select
            className="form-input select-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={String(cat.id)} value={String(cat.id)}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Opportunities Table */}
      {filteredOpportunities.length === 0 ? (
        <div className="empty-catalog-state">
          <div className="empty-icon-circle">
            <OpportunitiesIcon size={38} />
          </div>
          <h3 className="empty-title">Aucune opportunité trouvée</h3>
          <p className="empty-subtitle">
            {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Aucun résultat ne correspond aux filtres appliqués.'
              : 'Commencez par créer votre première opportunité.'}
          </p>
          <button
            type="button"
            className="btn-admin-cta primary"
            onClick={handleOpenCreate}
          >
            Créer une opportunité
          </button>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-courses-table">
            <thead>
              <tr>
                <th style={{ width: '68px' }}>Visuel</th>
                <th>Titre de l'offre</th>
                <th>Organisation & Lieu</th>
                <th>Catégorie</th>
                <th>Date limite</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOpportunities.map((opp) => (
                <tr key={opp.id}>
                  {/* Uniform Thumbnail Image */}
                  <td>
                    <div className="admin-table-thumbnail-box">
                      <OpportunityImage
                        path={opp.image_url}
                        alt={opp.title}
                        thumbnail
                        fallbackIconSize={18}
                      />
                    </div>
                  </td>
                  <td>
                    <div className="font-semibold text-slate-100 text-sm leading-snug">
                      {opp.title}
                    </div>
                    {opp.short_description && (
                      <div className="text-xs text-slate-400 line-clamp-1 mt-0.5 max-w-[280px]">
                        {opp.short_description}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
                      <BuildingIcon size={14} className="text-cyan-400 shrink-0" />
                      <span>{opp.organization_name}</span>
                    </div>
                    {opp.location && (
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <LocationIcon size={12} />
                        <span>{opp.location}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="text-xs text-slate-300">
                      {opp.opportunity_categories?.name || (
                        <span className="text-slate-500 italic">Générale</span>
                      )}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-slate-300 font-mono">
                      {formatDeadline(opp.deadline)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${opp.status}`}>
                      {opp.status === 'published'
                        ? 'Publiée'
                        : opp.status === 'draft'
                        ? 'Brouillon'
                        : 'Archivée'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Status toggle shortcuts */}
                      {opp.status !== 'published' ? (
                        <button
                          type="button"
                          className="btn-table-action"
                          disabled={statusUpdatingId === opp.id}
                          onClick={() => handleQuickStatusChange(opp, 'published')}
                          title="Mettre en ligne immédiatement"
                        >
                          Publier
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-table-action"
                          disabled={statusUpdatingId === opp.id}
                          onClick={() => handleQuickStatusChange(opp, 'archived')}
                          title="Archiver l'offre"
                        >
                          Archiver
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn-table-action"
                        onClick={() => handleOpenEdit(opp)}
                        title="Modifier l'opportunité"
                      >
                        <EditIcon size={13} />
                        <span>Éditer</span>
                      </button>

                      <button
                        type="button"
                        className="btn-table-action delete-action"
                        onClick={() => handleRequestDelete(opp)}
                        title="Supprimer définitivement"
                      >
                        <TrashIcon size={13} />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <OpportunityFormModal
          opportunity={editingOpportunity}
          categories={categories}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSaveSuccess}
        />
      )}

      {/* Delete Confirmation Modal Popup */}
      {opportunityToDelete && (
        <DeleteOpportunityModal
          opportunity={opportunityToDelete}
          isDeleting={isDeleting}
          onConfirm={handleConfirmDelete}
          onClose={() => setOpportunityToDelete(null)}
        />
      )}
    </div>
  );
};
