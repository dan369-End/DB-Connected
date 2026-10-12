import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { CourseForm } from './CourseForm';
import { CourseContentBuilder } from './CourseContentBuilder';
import { getAcademyCourseImageUrl } from '../utils/academyStorage';
import { SearchIcon, AcademyIcon } from '@/components/icons';
import type { AcademyCourse, AcademyCategory, CourseStatus } from '@/types';

interface CourseManagerProps {
  courses: AcademyCourse[];
  categories: AcademyCategory[];
  loading: boolean;
  onRefresh: () => void;
  openCreateImmediately?: boolean;
}

// Micro-component for thumbnail with private storage signed URL resolution
const CourseTableThumbnail: React.FC<{ thumbnailPath?: string | null }> = ({ thumbnailPath }) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    if (thumbnailPath) {
      getAcademyCourseImageUrl(thumbnailPath).then((url) => {
        if (!isCancelled) setResolvedUrl(url);
      });
    } else {
      setResolvedUrl(null);
    }
    return () => {
      isCancelled = true;
    };
  }, [thumbnailPath]);

  if (resolvedUrl) {
    return <img src={resolvedUrl} alt="" className="table-course-thumb" />;
  }

  return (
    <div className="table-course-thumb-fallback">
      <AcademyIcon size={16} />
    </div>
  );
};

export const CourseManager: React.FC<CourseManagerProps> = ({
  courses,
  categories,
  loading,
  onRefresh,
}) => {
  // Navigation internal mode: 'list' | 'create' | 'edit' | 'builder'
  const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'builder'>('list');
  const [selectedCourse, setSelectedCourse] = useState<AcademyCourse | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CourseStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Deleting / Status action loading
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtered list
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesCat =
        categoryFilter === 'all' ||
        (c.category_id != null && String(c.category_id) === String(categoryFilter)) ||
        (c.academy_categories?.id != null && String(c.academy_categories.id) === String(categoryFilter));

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.short_description && c.short_description.toLowerCase().includes(q)) ||
        (c.slug && c.slug.toLowerCase().includes(q));

      return matchesStatus && matchesCat && matchesSearch;
    });
  }, [courses, statusFilter, categoryFilter, searchQuery]);

  // Status updates: publish / draft / archive
  const handleUpdateStatus = async (courseId: string, newStatus: CourseStatus) => {
    if (!supabase) return;
    setActionLoadingId(courseId);
    setActionMessage(null);
    setErrorMessage(null);

    try {
      const { error } = await supabase
        .from('academy_courses')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', courseId);

      if (error) {
        setErrorMessage("Impossible de mettre à jour le statut du cours.");
      } else {
        setActionMessage(
          `Statut modifié : formation ${
            newStatus === 'published'
              ? 'publiée'
              : newStatus === 'archived'
              ? 'archivée'
              : 'mise en brouillon'
          }.`
        );
        onRefresh();
      }
    } catch (err) {
      console.warn('[DB-Connect Academy] Error updating status:', err);
      setErrorMessage("Une erreur est survenue lors de la mise à jour.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete course
  const handleDeleteCourse = async (course: AcademyCourse) => {
    if (!supabase) return;

    const confirmed = window.confirm(
      `Confirmez-vous la suppression de la formation « ${course.title} » ? Tous les modules et leçons associés seront également supprimés.`
    );
    if (!confirmed) return;

    setActionLoadingId(course.id);
    setActionMessage(null);
    setErrorMessage(null);

    try {
      const { error } = await supabase
        .from('academy_courses')
        .delete()
        .eq('id', course.id);

      if (error) {
        setErrorMessage("Impossible de supprimer cette formation.");
      } else {
        setActionMessage(`La formation « ${course.title} » a été supprimée.`);
        onRefresh();
      }
    } catch (err) {
      console.warn('[DB-Connect Academy] Error deleting course:', err);
      setErrorMessage("Une erreur imprévue est survenue.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // If in create/edit mode, render CourseForm
  if (mode === 'create' || mode === 'edit') {
    return (
      <CourseForm
        course={selectedCourse}
        categories={categories}
        onSaveSuccess={() => {
          setMode('list');
          setSelectedCourse(null);
          onRefresh();
          setActionMessage(
            selectedCourse
              ? 'Formation modifiée avec succès.'
              : 'Formation créée avec succès.'
          );
        }}
        onCancel={() => {
          setMode('list');
          setSelectedCourse(null);
        }}
      />
    );
  }

  // If in builder mode, render CourseContentBuilder
  if (mode === 'builder' && selectedCourse) {
    return (
      <CourseContentBuilder
        course={selectedCourse}
        onBack={() => {
          setMode('list');
          setSelectedCourse(null);
          onRefresh();
        }}
      />
    );
  }

  return (
    <div className="admin-course-manager">
      {/* Toolbar with action button */}
      <div className="admin-table-toolbar">
        <div>
          <h2 className="toolbar-section-title">Catalogue des Formations</h2>
          <p className="toolbar-section-sub">
            Gérez les cours, leurs modules pédagogiques et leur statut de publication.
          </p>
        </div>
        <button
          type="button"
          className="btn-admin-cta primary"
          onClick={() => {
            setSelectedCourse(null);
            setMode('create');
          }}
        >
          <span>Créer une formation</span>
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
            placeholder="Rechercher par titre ou mot-clé..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="admin-select-filters">
          <select
            className="form-input select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | CourseStatus)}
          >
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
            <option value="archived">Archivé</option>
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

      {/* Courses Table */}
      {loading ? (
        <div className="academy-loading-box">
          <div className="spinner large"></div>
          <p>Chargement des formations...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="empty-catalog-state">
          <div className="empty-icon-circle">
            <AcademyIcon size={38} />
          </div>
          <h3 className="empty-title">Aucune formation trouvée</h3>
          <p className="empty-subtitle">
            {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Aucun cours ne correspond aux critères de filtre sélectionnés.'
              : 'Aucune formation créée pour le moment.'}
          </p>
          <button
            type="button"
            className="btn-admin-cta primary"
            onClick={() => {
              setSelectedCourse(null);
              setMode('create');
            }}
          >
            Créer une formation
          </button>
        </div>
      ) : (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Formation</th>
                <th>Catégorie</th>
                <th>Tarif & Mode</th>
                <th>Statut</th>
                <th>Créée le</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((c) => {
                const categoryName = c.academy_categories?.name || c.category?.name || '—';
                const createdDate = c.created_at
                  ? new Date(c.created_at).toLocaleDateString('fr-FR')
                  : '—';
                const isWorking = actionLoadingId === c.id;

                return (
                  <tr key={c.id}>
                    <td>
                      <div className="table-course-cell">
                        <CourseTableThumbnail thumbnailPath={c.thumbnail_url} />
                        <div className="table-course-info">
                          <span className="table-course-title font-semibold text-main">
                            {c.title}
                          </span>
                          <span className="table-course-slug font-mono text-muted">
                            /{c.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="text-muted">{categoryName}</td>
                    <td>
                      <div className="table-tariff-mode-cell">
                        <span className={`table-tariff-chip ${c.is_paid ? 'paid' : 'free'}`}>
                          {c.is_paid
                            ? `${Number(c.price || 0).toLocaleString('fr-FR')} FCFA`
                            : 'Gratuit'}
                        </span>
                        <span className="table-mode-caption">
                          {c.delivery_mode === 'dbconnect'
                            ? 'DB-Connect'
                            : (c.external_platform ? `Ext. (${c.external_platform})` : 'Externe')}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${c.status}`}>
                        {c.status === 'published'
                          ? 'Publié'
                          : c.status === 'archived'
                          ? 'Archivé'
                          : 'Brouillon'}
                      </span>
                    </td>
                    <td className="font-mono text-muted text-sm">{createdDate}</td>
                    <td className="text-right">
                      <div className="table-actions-group">
                        <button
                          type="button"
                          className="btn-table-action content"
                          onClick={() => {
                            setSelectedCourse(c);
                            setMode('builder');
                          }}
                          disabled={isWorking}
                          title="Gérer les modules et les leçons"
                        >
                          Contenu
                        </button>

                        <button
                          type="button"
                          className="btn-table-action edit"
                          onClick={() => {
                            setSelectedCourse(c);
                            setMode('edit');
                          }}
                          disabled={isWorking}
                          title="Modifier les informations"
                        >
                          Éditer
                        </button>

                        {c.status !== 'published' ? (
                          <button
                            type="button"
                            className="btn-table-action publish"
                            onClick={() => handleUpdateStatus(c.id, 'published')}
                            disabled={isWorking}
                            title="Publier la formation"
                          >
                            Publier
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-table-action draft"
                            onClick={() => handleUpdateStatus(c.id, 'draft')}
                            disabled={isWorking}
                            title="Remettre en brouillon"
                          >
                            Brouillon
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-table-action delete"
                          onClick={() => handleDeleteCourse(c)}
                          disabled={isWorking}
                          title="Supprimer la formation"
                        >
                          Supprimer
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
    </div>
  );
};
