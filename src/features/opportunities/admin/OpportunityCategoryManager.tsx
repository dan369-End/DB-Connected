import React, { useState } from 'react';
import type { OpportunityCategory } from '@/types';
import {
  createOpportunityCategory,
  updateOpportunityCategory,
  deleteOpportunityCategory,
  generateSlug,
} from '../opportunitiesService';
import {
  PlusIcon,
  CategoryIcon,
  CloseIcon,
  CheckCircleIcon,
} from '@/components/icons';

interface OpportunityCategoryManagerProps {
  categories: OpportunityCategory[];
  onRefresh: () => Promise<void>;
}

export const OpportunityCategoryManager: React.FC<OpportunityCategoryManagerProps> = ({
  categories,
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<OpportunityCategory | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setIsSlugManuallyEdited(false);
    setDescription('');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: OpportunityCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug || generateSlug(cat.name));
    setIsSlugManuallyEdited(true);
    setDescription(cat.description || '');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManuallyEdited) {
      setSlug(generateSlug(val));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMessage('Le nom de la catégorie est obligatoire.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setActionSuccess(null);

    try {
      if (editingCategory) {
        const res = await updateOpportunityCategory(editingCategory.id, {
          name: name.trim(),
          slug: slug.trim() || generateSlug(name),
          description: description.trim() || null,
        });

        if (!res.success) {
          setErrorMessage(res.error || 'Impossible de mettre à jour la catégorie.');
          setIsSaving(false);
          return;
        }

        setActionSuccess('Catégorie mise à jour avec succès.');
      } else {
        const res = await createOpportunityCategory({
          name: name.trim(),
          slug: slug.trim() || generateSlug(name),
          description: description.trim() || null,
        });

        if (!res.success) {
          setErrorMessage(res.error || 'Impossible de créer la catégorie.');
          setIsSaving(false);
          return;
        }

        setActionSuccess('Catégorie créée avec succès.');
      }

      setIsModalOpen(false);
      await onRefresh();
    } catch {
      setErrorMessage('Une erreur imprévue est survenue.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (cat: OpportunityCategory) => {
    const ok = window.confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement la catégorie « ${cat.name} » ?`
    );
    if (!ok) return;

    setDeletingId(cat.id);
    setActionSuccess(null);
    setErrorMessage(null);

    try {
      const res = await deleteOpportunityCategory(cat.id);
      if (!res.success) {
        setErrorMessage(res.error || 'Impossible de supprimer cette catégorie.');
      } else {
        setActionSuccess('Catégorie supprimée.');
        await onRefresh();
      }
    } catch {
      setErrorMessage('Une erreur imprévue est survenue.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-section-container">
      {/* Top action header */}
      <div className="admin-table-toolbar">
        <div>
          <h2 className="toolbar-section-title">Catégories d'Opportunités</h2>
          <p className="toolbar-section-sub">
            Organisez les secteurs, thématiques et filières d'opportunités
          </p>
        </div>
        <button
          type="button"
          className="btn-admin-cta primary"
          onClick={handleOpenCreate}
        >
          <PlusIcon size={16} />
          <span>Nouvelle catégorie</span>
        </button>
      </div>

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

      {/* Categories Table */}
      {categories.length === 0 ? (
        <div className="empty-catalog-state">
          <div className="empty-icon-circle">
            <CategoryIcon size={38} />
          </div>
          <h3 className="empty-title">Aucune catégorie enregistrée</h3>
          <p className="empty-subtitle">
            Créez des catégories pour classer vos opportunités (ex : Développement Web, Data, Marketing, Consulting).
          </p>
          <button
            type="button"
            className="btn-admin-cta primary"
            onClick={handleOpenCreate}
          >
            Créer une catégorie
          </button>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-courses-table">
            <thead>
              <tr>
                <th>Nom de la catégorie</th>
                <th>Slug URL</th>
                <th>Description</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={String(cat.id)}>
                  <td>
                    <div className="font-semibold text-slate-100">{cat.name}</div>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-slate-400">{cat.slug || '-'}</span>
                  </td>
                  <td>
                    <span className="text-xs text-slate-300">
                      {cat.description || <span className="text-slate-500 italic">Aucune description</span>}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        className="btn-table-action"
                        onClick={() => handleOpenEdit(cat)}
                        title="Modifier la catégorie"
                      >
                        Éditer
                      </button>
                      <button
                        type="button"
                        className="btn-table-action delete-action"
                        disabled={deletingId === cat.id}
                        onClick={() => handleDelete(cat)}
                        title="Supprimer la catégorie"
                      >
                        {deletingId === cat.id ? '...' : 'Supprimer'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)} role="dialog" aria-modal="true">
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 className="modal-title">
                  {editingCategory ? 'Modifier la catégorie' : 'Créer une catégorie'}
                </h2>
                <p className="modal-subtitle">
                  {editingCategory
                    ? `Modification de « ${editingCategory.name} »`
                    : 'Définissez une nouvelle catégorie d’opportunités professionnelles.'}
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fermer"
                disabled={isSaving}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {errorMessage && (
              <div className="auth-alert alert-error" role="alert">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSave} className="admin-course-form">
              <div className="form-group">
                <label className="form-label" htmlFor="cat-name">
                  Nom de la catégorie *
                </label>
                <input
                  id="cat-name"
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ex : Ingénierie Logicielle"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cat-slug">
                  Slug URL
                </label>
                <input
                  id="cat-slug"
                  type="text"
                  className="form-input font-mono"
                  placeholder="ingenierie-logicielle"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setIsSlugManuallyEdited(true);
                  }}
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cat-desc">
                  Description
                </label>
                <textarea
                  id="cat-desc"
                  rows={3}
                  className="form-input"
                  placeholder="Présentez les profils et offres rattachés à cette catégorie..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn-admin-cta"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-admin-cta primary"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <span className="btn-loading-content">
                      <span className="spinner" /> Enregistrement...
                    </span>
                  ) : editingCategory ? (
                    'Mettre à jour'
                  ) : (
                    'Créer la catégorie'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
