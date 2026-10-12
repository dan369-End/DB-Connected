import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { generateSlug } from '@/features/academy/admin/utils';
import type { MarketplaceCategory } from '@/types';

interface MarketplaceCategoryManagerProps {
  categories: MarketplaceCategory[];
  loading: boolean;
  onRefresh: () => void;
}

export const MarketplaceCategoryManager: React.FC<MarketplaceCategoryManagerProps> = ({
  categories,
  loading,
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MarketplaceCategory | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const openNewModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setIsSlugManuallyEdited(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: MarketplaceCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug || generateSlug(cat.name));
    setDescription(cat.description || '');
    setIsSlugManuallyEdited(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setErrorMessage(null);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManuallyEdited) {
      setSlug(generateSlug(val));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (!name.trim()) {
      setErrorMessage('Le nom de la catégorie est obligatoire.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const finalSlug = (slug.trim() || generateSlug(name)).toLowerCase();

    try {
      if (editingCategory) {
        // UPDATE public.marketplace_categories
        const { error } = await supabase
          .from('marketplace_categories')
          .update({
            name: name.trim(),
            slug: finalSlug,
            description: description.trim() || null,
          })
          .eq('id', editingCategory.id);

        if (error) {
          if (error.code === '23505') {
            setErrorMessage('Une catégorie avec ce slug ou ce nom existe déjà.');
          } else {
            setErrorMessage("Impossible de mettre à jour la catégorie.");
          }
          return;
        }

        setSuccessMessage('Catégorie mise à jour avec succès.');
      } else {
        // CREATE public.marketplace_categories
        const { error } = await supabase
          .from('marketplace_categories')
          .insert({
            name: name.trim(),
            slug: finalSlug,
            description: description.trim() || null,
          });

        if (error) {
          if (error.code === '23505') {
            setErrorMessage('Une catégorie avec ce slug ou ce nom existe déjà.');
          } else {
            setErrorMessage("Impossible de créer la catégorie.");
          }
          return;
        }

        setSuccessMessage('Catégorie créée avec succès.');
      }

      onRefresh();
      setTimeout(() => {
        closeModal();
      }, 500);
    } catch (err) {
      console.warn('[DB-Connect Marketplace] Category error:', err);
      setErrorMessage("Une erreur inattendue est survenue.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: MarketplaceCategory) => {
    if (!supabase) return;
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement la catégorie « ${cat.name} » ?`
    );
    if (!confirmed) return;

    setDeletingId(cat.id);
    setErrorMessage(null);
    try {
      const { error } = await supabase
        .from('marketplace_categories')
        .delete()
        .eq('id', cat.id);

      if (error) {
        setErrorMessage("Impossible de supprimer la catégorie (des produits y sont peut-être encore rattachés).");
      } else {
        onRefresh();
      }
    } catch (err) {
      console.warn('[DB-Connect Marketplace] Delete category error:', err);
      setErrorMessage("Erreur lors de la suppression.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-categories-view">
      <div className="admin-table-toolbar">
        <div>
          <h2 className="toolbar-section-title">Gestion des Catégories Marketplace</h2>
          <p className="toolbar-section-sub">
            Structurez les rayons et rubriques de produits sur DB-Connect
          </p>
        </div>
        <button
          type="button"
          className="btn-admin-cta primary"
          onClick={openNewModal}
        >
          + Nouvelle catégorie
        </button>
      </div>

      {errorMessage && (
        <div className="auth-alert alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="academy-loading-box">
          <div className="spinner large"></div>
          <p>Chargement des catégories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="empty-catalog-state">
          <h3 className="empty-title">Aucune catégorie existante</h3>
          <p className="empty-subtitle">
            Créez votre première catégorie pour organiser les fiches produits.
          </p>
          <button
            type="button"
            className="btn-admin-cta primary"
            onClick={openNewModal}
          >
            Créer une catégorie
          </button>
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
                  <td className="text-muted font-mono">{cat.slug || '—'}</td>
                  <td className="text-muted desc-col">{cat.description || '—'}</td>
                  <td className="text-right">
                    <div className="table-actions-group">
                      <button
                        type="button"
                        className="btn-table-action edit"
                        onClick={() => openEditModal(cat)}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="btn-table-action delete"
                        onClick={() => handleDelete(cat)}
                        disabled={deletingId === cat.id}
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

      {/* Category Modal (Create / Edit) */}
      {isModalOpen && (
        <div className="admin-modal-backdrop" onClick={closeModal}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="modal-title">
                {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={closeModal}
              >
                &times;
              </button>
            </div>

            {errorMessage && (
              <div className="auth-alert alert-error" role="alert">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="auth-alert alert-success" role="status">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSave} className="admin-form">
              <div className="form-group">
                <label className="form-label" htmlFor="mcat-name">
                  Nom de la catégorie *
                </label>
                <input
                  id="mcat-name"
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ex : Matériel Informatique, Licences Logiciels..."
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="mcat-slug">
                  Slug URL
                </label>
                <input
                  id="mcat-slug"
                  type="text"
                  className="form-input font-mono"
                  placeholder="ex : materiel-informatique"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setIsSlugManuallyEdited(true);
                  }}
                />
                <span className="form-hint">Généré automatiquement si laissé vide.</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="mcat-desc">
                  Description
                </label>
                <textarea
                  id="mcat-desc"
                  rows={3}
                  className="form-input"
                  placeholder="Description succincte de ce rayon du marketplace..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn-admin-cta secondary"
                  onClick={closeModal}
                  disabled={saving}
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
                      <span className="spinner"></span> Enregistrement...
                    </span>
                  ) : editingCategory ? (
                    'Enregistrer les modifications'
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
