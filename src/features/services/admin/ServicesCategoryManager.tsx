import React, { useState } from 'react';
import { upsertServiceCategory, deleteServiceCategory } from '../servicesService';
import { generateSlug } from '../utils';
import { PlusIcon, EditIcon, DeleteIcon, CloseIcon } from '@/components/icons';
import type { ServiceCategory } from '@/types';

interface ServicesCategoryManagerProps {
  categories: ServiceCategory[];
  onRefresh: () => void;
}

export const ServicesCategoryManager: React.FC<ServicesCategoryManagerProps> = ({
  categories,
  onRefresh,
}) => {
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: ServiceCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug || '');
    setDescription(cat.description || '');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(generateSlug(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Le nom de la catégorie est obligatoire.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await upsertServiceCategory({
      id: editingCategory?.id,
      name,
      slug: slug || generateSlug(name),
      description,
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Erreur lors de l\'enregistrement de la catégorie.');
    } else {
      setSuccessMessage(
        editingCategory ? 'Catégorie modifiée avec succès.' : 'Catégorie créée avec succès.'
      );
      setIsModalOpen(false);
      onRefresh();
    }
    setSaving(false);
  };

  const handleDelete = async (category: ServiceCategory) => {
    const ok = window.confirm(
      `Confirmez-vous la suppression de la catégorie « ${category.name} » ?`
    );
    if (!ok) return;

    setDeletingId(category.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await deleteServiceCategory(category.id);
    if (!res.success) {
      setErrorMessage(
        res.error ||
          'Impossible de supprimer cette catégorie. Vérifiez si des prestations y sont encore associées.'
      );
    } else {
      setSuccessMessage('Catégorie supprimée avec succès.');
      onRefresh();
    }
    setDeletingId(null);
  };

  return (
    <div className="admin-category-manager">
      <div className="admin-table-toolbar">
        <div>
          <h2 className="toolbar-section-title">Catégories de services</h2>
          <p className="toolbar-section-sub">
            Organisez les prestations numériques par domaine d'expertise
          </p>
        </div>

        <button
          type="button"
          className="btn-admin-cta primary"
          onClick={openCreateModal}
        >
          <PlusIcon size={16} />
          <span>Nouvelle catégorie</span>
        </button>
      </div>

      {successMessage && (
        <div className="auth-alert alert-success" role="status">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="auth-alert alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      {categories.length === 0 ? (
        <div className="empty-catalog-state">
          <h3 className="empty-title">Aucune catégorie pour le moment</h3>
          <p className="empty-subtitle">
            Créez votre première catégorie pour structurer le catalogue de services.
          </p>
        </div>
      ) : (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Slug</th>
                <th>Description</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td className="font-semibold text-main">{cat.name}</td>
                  <td className="font-mono text-muted text-sm">{cat.slug || '—'}</td>
                  <td className="text-muted text-sm">{cat.description || '—'}</td>
                  <td className="text-right">
                    <div className="table-actions-group">
                      <button
                        type="button"
                        className="btn-table-action edit"
                        onClick={() => openEditModal(cat)}
                        title="Modifier la catégorie"
                      >
                        <EditIcon size={14} />
                      </button>

                      <button
                        type="button"
                        className="btn-table-action delete"
                        onClick={() => handleDelete(cat)}
                        disabled={deletingId === cat.id}
                        title="Supprimer la catégorie"
                      >
                        <DeleteIcon size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Category Create/Edit Modal */}
      {isModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => !saving && setIsModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="modal-title">
                  {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                </h3>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                disabled={saving}
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-modal-form">
              <div className="form-group">
                <label className="form-label" htmlFor="cat-name">
                  Nom de la catégorie *
                </label>
                <input
                  id="cat-name"
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ex : Conseil & Stratégie Digitale"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cat-slug">
                  Identifiant d'URL (Slug)
                </label>
                <input
                  id="cat-slug"
                  type="text"
                  className="form-input font-mono"
                  placeholder="conseil-strategie-digitale"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cat-desc">
                  Description (Optionnel)
                </label>
                <textarea
                  id="cat-desc"
                  rows={3}
                  className="form-input"
                  placeholder="Description succincte de ce pôle de compétences..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  disabled={saving}
                  onClick={() => setIsModalOpen(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-admin-cta primary"
                  disabled={saving}
                >
                  {saving ? (
                    <span className="btn-loading-content">
                      <span className="spinner"></span> Sauvegarde...
                    </span>
                  ) : (
                    editingCategory ? 'Enregistrer les modifications' : 'Créer la catégorie'
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
