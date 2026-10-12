import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { LessonAttachmentUploader } from '../components/LessonAttachmentUploader';
import {
  ACADEMY_STORAGE_BUCKET,
  buildLessonResourceStoragePath,
  formatFileSize,
} from '../utils/storage';
import { FileIcon } from '@/components/icons';
import type { AcademyCourse, AcademyModule, AcademyLesson } from '@/types';

interface CourseContentBuilderProps {
  course: AcademyCourse;
  onBack: () => void;
}

export const CourseContentBuilder: React.FC<CourseContentBuilderProps> = ({
  course,
  onBack,
}) => {
  const [modules, setModules] = useState<AcademyModule[]>([]);
  const [enrollmentCount, setEnrollmentCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Module Modal / Form state
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<AcademyModule | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [modulePosition, setModulePosition] = useState<number>(1);
  const [savingModule, setSavingModule] = useState(false);

  // Lesson Modal / Form state
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [selectedModuleForLesson, setSelectedModuleForLesson] = useState<AcademyModule | null>(null);
  const [editingLesson, setEditingLesson] = useState<AcademyLesson | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonShortDesc, setLessonShortDesc] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonPosition, setLessonPosition] = useState<number>(1);

  // Staged File for Storage upload
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [savingLesson, setSavingLesson] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState<string | null>(null);

  // Fetch modules, lessons & enrollments count
  const fetchCurriculum = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Fetch modules
      const { data: modulesData, error: modError } = await supabase
        .from('academy_modules')
        .select('*')
        .eq('course_id', course.id)
        .order('position', { ascending: true });

      if (modError) throw modError;
      const moduleList = (modulesData as AcademyModule[]) || [];

      // 2. Fetch lessons if modules exist
      if (moduleList.length > 0) {
        const moduleIds = moduleList.map((m) => m.id);
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('academy_lessons')
          .select('*')
          .in('module_id', moduleIds)
          .order('position', { ascending: true });

        if (lessonsError) throw lessonsError;

        const allLessons = (lessonsData as AcademyLesson[]) || [];
        const populated = moduleList.map((m) => ({
          ...m,
          lessons: allLessons.filter((l) => l.module_id === m.id),
        }));
        setModules(populated);
      } else {
        setModules([]);
      }

      // 3. Read enrollments count (read-only for admin)
      const { count } = await supabase
        .from('academy_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course.id);

      setEnrollmentCount(count || 0);
    } catch (err) {
      console.warn('[DB-Connect Academy] Error loading curriculum:', err);
      setErrorMessage("Impossible de charger les modules et leçons de cette formation.");
    } finally {
      setLoading(false);
    }
  }, [course.id]);

  useEffect(() => {
    fetchCurriculum();
  }, [fetchCurriculum]);

  // MODULE CRUD
  const handleOpenModuleModal = (mod?: AcademyModule) => {
    if (mod) {
      setEditingModule(mod);
      setModuleTitle(mod.title);
      setModuleDescription(mod.description || '');
      setModulePosition(mod.position);
    } else {
      setEditingModule(null);
      setModuleTitle('');
      setModuleDescription('');
      setModulePosition(modules.length > 0 ? modules[modules.length - 1].position + 1 : 1);
    }
    setIsModuleModalOpen(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !moduleTitle.trim()) return;

    setSavingModule(true);
    try {
      if (editingModule) {
        // UPDATE public.academy_modules
        const { error } = await supabase
          .from('academy_modules')
          .update({
            title: moduleTitle.trim(),
            description: moduleDescription.trim() || null,
            position: Number(modulePosition),
          })
          .eq('id', editingModule.id);

        if (error) throw error;
      } else {
        // CREATE public.academy_modules
        const { error } = await supabase
          .from('academy_modules')
          .insert({
            course_id: course.id,
            title: moduleTitle.trim(),
            description: moduleDescription.trim() || null,
            position: Number(modulePosition),
          });

        if (error) throw error;
      }

      setIsModuleModalOpen(false);
      fetchCurriculum();
    } catch (err) {
      console.warn('[DB-Connect Academy] Module save error:', err);
      alert("Erreur lors de l'enregistrement du module.");
    } finally {
      setSavingModule(false);
    }
  };

  const handleDeleteModule = async (mod: AcademyModule) => {
    if (!supabase) return;
    const ok = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le module « ${mod.title} » ainsi que toutes ses leçons associées ?`
    );
    if (!ok) return;

    try {
      const { error } = await supabase
        .from('academy_modules')
        .delete()
        .eq('id', mod.id);

      if (error) throw error;
      fetchCurriculum();
    } catch (err) {
      console.warn('[DB-Connect Academy] Module delete error:', err);
      alert("Erreur lors de la suppression du module.");
    }
  };

  // LESSON CRUD
  const handleOpenLessonModal = (targetModule: AcademyModule, lesson?: AcademyLesson) => {
    setSelectedModuleForLesson(targetModule);
    setStagedFile(null);
    setUploadStatusText(null);

    if (lesson) {
      setEditingLesson(lesson);
      setLessonTitle(lesson.title);
      setLessonShortDesc(lesson.short_description || '');
      setLessonContent(lesson.content || '');
      setLessonVideoUrl(lesson.video_url || '');
      setLessonPosition(lesson.position);
    } else {
      setEditingLesson(null);
      setLessonTitle('');
      setLessonShortDesc('');
      setLessonContent('');
      setLessonVideoUrl('');
      const currentLessons = targetModule.lessons || [];
      setLessonPosition(currentLessons.length > 0 ? currentLessons[currentLessons.length - 1].position + 1 : 1);
    }
    setIsLessonModalOpen(true);
  };

  /**
   * Save lesson adhering strictly to user requirements:
   * 1. Save lesson to academy_lessons (insert or update text/video)
   * 2. Obtain lessonId
   * 3. If stagedFile exists:
   *    - Upload file to Storage at courses/{course_id}/{module_id}/{lesson_id}/{filename}
   *    - Update academy_lessons with resource_url, resource_name, resource_type, resource_size
   *    - If replacing: delete previous file from Storage only after successful new upload and update
   */
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !selectedModuleForLesson || !lessonTitle.trim()) return;

    setSavingLesson(true);
    setUploadStatusText("Enregistrement de la leçon...");

    try {
      let savedLessonId: string;
      const oldResourceUrl = editingLesson?.resource_url || null;

      if (editingLesson) {
        // 1. UPDATE lesson text/meta
        const { error } = await supabase
          .from('academy_lessons')
          .update({
            title: lessonTitle.trim(),
            short_description: lessonShortDesc.trim() || null,
            content: lessonContent.trim() || null,
            video_url: lessonVideoUrl.trim() || null,
            position: Number(lessonPosition),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingLesson.id);

        if (error) throw error;
        savedLessonId = editingLesson.id;
      } else {
        // 1. CREATE lesson first to get ID
        const { data: newLesson, error } = await supabase
          .from('academy_lessons')
          .insert({
            module_id: selectedModuleForLesson.id,
            title: lessonTitle.trim(),
            short_description: lessonShortDesc.trim() || null,
            content: lessonContent.trim() || null,
            video_url: lessonVideoUrl.trim() || null,
            position: Number(lessonPosition),
          })
          .select('id')
          .single();

        if (error || !newLesson) throw error;
        savedLessonId = newLesson.id;
      }

      // 2. If a file is staged for upload:
      if (stagedFile) {
        setUploadStatusText("Importation du support de cours vers Supabase Storage...");

        const storagePath = buildLessonResourceStoragePath(
          course.id,
          selectedModuleForLesson.id,
          savedLessonId,
          stagedFile.name
        );

        // Upload to private bucket
        const { error: uploadError } = await supabase.storage
          .from(ACADEMY_STORAGE_BUCKET)
          .upload(storagePath, stagedFile, {
            upsert: true,
            contentType: stagedFile.type || 'application/octet-stream',
          });

        if (uploadError) {
          console.warn('[DB-Connect Academy] Storage upload failed:', uploadError.message);
          alert(
            `La leçon a été enregistrée, mais l'importation du fichier a échoué (${uploadError.message}). Vous pourrez réessayer depuis le bouton Modifier.`
          );
        } else {
          // Update lesson resource metadata
          setUploadStatusText("Mise à jour des métadonnées du fichier...");
          const { error: metaUpdateError } = await supabase
            .from('academy_lessons')
            .update({
              resource_url: storagePath,
              resource_name: stagedFile.name,
              resource_type: stagedFile.type || 'application/octet-stream',
              resource_size: stagedFile.size,
              updated_at: new Date().toISOString(),
            })
            .eq('id', savedLessonId);

          if (metaUpdateError) {
            console.warn('[DB-Connect Academy] Error updating resource meta:', metaUpdateError.message);
          } else {
            // If replacement of an old file succeeded, safely remove old file
            if (oldResourceUrl && oldResourceUrl !== storagePath) {
              await supabase.storage
                .from(ACADEMY_STORAGE_BUCKET)
                .remove([oldResourceUrl]);
            }
          }
        }
      }

      setIsLessonModalOpen(false);
      setStagedFile(null);
      fetchCurriculum();
    } catch (err) {
      console.warn('[DB-Connect Academy] Lesson save error:', err);
      alert("Erreur lors de l'enregistrement de la leçon.");
    } finally {
      setSavingLesson(false);
      setUploadStatusText(null);
    }
  };

  const handleDeleteLesson = async (lesson: AcademyLesson) => {
    if (!supabase) return;
    const ok = window.confirm(`Supprimer définitivement la leçon « ${lesson.title} » ?`);
    if (!ok) return;

    try {
      // If resource exists, delete from Storage
      if (lesson.resource_url) {
        await supabase.storage
          .from(ACADEMY_STORAGE_BUCKET)
          .remove([lesson.resource_url]);
      }

      const { error } = await supabase
        .from('academy_lessons')
        .delete()
        .eq('id', lesson.id);

      if (error) throw error;
      fetchCurriculum();
    } catch (err) {
      console.warn('[DB-Connect Academy] Lesson delete error:', err);
      alert("Erreur lors de la suppression de la leçon.");
    }
  };

  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);

  return (
    <div className="content-builder-view">
      {/* Top Header */}
      <div className="builder-top-bar">
        <button
          type="button"
          className="btn-back-breadcrumb"
          onClick={onBack}
        >
          &larr; Retour à la liste des formations
        </button>

        <div className="builder-title-block">
          <div className="builder-header-meta">
            <span className="builder-tag">Constructeur Pédagogique</span>
            <span className={`status-badge status-${course.status || 'draft'}`}>
              {course.status === 'published'
                ? 'Publié'
                : course.status === 'archived'
                ? 'Archivé'
                : 'Brouillon'}
            </span>
          </div>
          <h1 className="builder-course-title">{course.title}</h1>
          <p className="builder-stats-line">
            {modules.length} modules &bull; {totalLessons} leçons &bull; {enrollmentCount} apprenants inscrits
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="auth-alert alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Main Hierarchy area */}
      <div className="builder-main-card">
        <div className="builder-card-toolbar">
          <h2 className="builder-card-heading">Structure du Programme</h2>
          <button
            type="button"
            className="btn-admin-cta primary"
            onClick={() => handleOpenModuleModal()}
          >
            + Ajouter un module
          </button>
        </div>

        {loading ? (
          <div className="academy-loading-box">
            <div className="spinner large"></div>
            <p>Chargement du programme...</p>
          </div>
        ) : modules.length === 0 ? (
          <div className="empty-catalog-state">
            <h3 className="empty-title">Aucun module pour le moment</h3>
            <p className="empty-subtitle">
              Commencez par créer le premier module pédagogique de cette formation.
            </p>
            <button
              type="button"
              className="btn-admin-cta primary"
              onClick={() => handleOpenModuleModal()}
            >
              Créer le premier module
            </button>
          </div>
        ) : (
          <div className="modules-builder-list">
            {modules.map((mod) => (
              <div key={mod.id} className="builder-module-item">
                <div className="builder-module-header">
                  <div className="module-info-zone">
                    <span className="module-pos-pill">Module {mod.position}</span>
                    <h3 className="module-builder-title">{mod.title}</h3>
                    {mod.description && (
                      <p className="module-builder-desc">{mod.description}</p>
                    )}
                  </div>

                  <div className="module-header-actions">
                    <button
                      type="button"
                      className="btn-action-small"
                      onClick={() => handleOpenLessonModal(mod)}
                    >
                      + Leçon
                    </button>
                    <button
                      type="button"
                      className="btn-action-small"
                      onClick={() => handleOpenModuleModal(mod)}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="btn-action-small danger"
                      onClick={() => handleDeleteModule(mod)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                {/* Lessons belonging to this module */}
                <div className="builder-lessons-container">
                  {mod.lessons && mod.lessons.length > 0 ? (
                    <ul className="builder-lessons-list">
                      {mod.lessons.map((lesson) => (
                        <li key={lesson.id} className="builder-lesson-row">
                          <div className="lesson-left-meta">
                            <span className="lesson-pos-pill">{lesson.position}</span>
                            <span className="lesson-row-title">{lesson.title}</span>
                            {lesson.video_url && (
                              <span className="lesson-media-indicator">Vidéo</span>
                            )}
                            {lesson.content && (
                              <span className="lesson-media-indicator text">Texte</span>
                            )}
                            {lesson.resource_url && (
                              <span className="lesson-media-indicator file">
                                <FileIcon size={12} /> Support
                              </span>
                            )}
                          </div>

                          <div className="lesson-right-actions">
                            <button
                              type="button"
                              className="btn-table-action edit"
                              onClick={() => handleOpenLessonModal(mod, lesson)}
                            >
                              Éditer
                            </button>
                            <button
                              type="button"
                              className="btn-table-action delete"
                              onClick={() => handleDeleteLesson(lesson)}
                            >
                              Supprimer
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="empty-module-lessons">
                      <span>Ce module ne comporte aucune leçon pour l'instant.</span>
                      <button
                        type="button"
                        className="btn-add-lesson-inline"
                        onClick={() => handleOpenLessonModal(mod)}
                      >
                        + Ajouter une première leçon
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Module Modal (Create / Edit) */}
      {isModuleModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsModuleModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="modal-title">
                {editingModule ? 'Modifier le module' : 'Ajouter un module'}
              </h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setIsModuleModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveModule} className="admin-form">
              <div className="form-group">
                <label className="form-label" htmlFor="mod-title">
                  Titre du module *
                </label>
                <input
                  id="mod-title"
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ex : Fondamentaux & Concepts clés"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="mod-pos">
                  Ordre / Position (numérique)
                </label>
                <input
                  id="mod-pos"
                  type="number"
                  min={1}
                  className="form-input"
                  value={modulePosition}
                  onChange={(e) => setModulePosition(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="mod-desc">
                  Description du module
                </label>
                <textarea
                  id="mod-desc"
                  rows={3}
                  className="form-input"
                  placeholder="Objectif de ce module d'apprentissage..."
                  value={moduleDescription}
                  onChange={(e) => setModuleDescription(e.target.value)}
                />
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn-admin-cta secondary"
                  onClick={() => setIsModuleModalOpen(false)}
                  disabled={savingModule}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-admin-cta primary"
                  disabled={savingModule}
                >
                  {savingModule ? 'Enregistrement...' : 'Enregistrer le module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Modal (Create / Edit) */}
      {isLessonModalOpen && selectedModuleForLesson && (
        <div className="admin-modal-backdrop" onClick={() => !savingLesson && setIsLessonModalOpen(false)}>
          <div className="admin-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="modal-title">
                  {editingLesson ? 'Éditer la leçon' : 'Ajouter une leçon'}
                </h3>
                <span className="modal-sub">
                  Dans le module : <strong>{selectedModuleForLesson.title}</strong>
                </span>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                disabled={savingLesson}
                onClick={() => setIsLessonModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="admin-form">
              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label" htmlFor="lesson-title">
                    Titre de la leçon *
                  </label>
                  <input
                    id="lesson-title"
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ex : Installation & Configuration"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="lesson-pos">
                    Position dans le module
                  </label>
                  <input
                    id="lesson-pos"
                    type="number"
                    min={1}
                    className="form-input"
                    value={lessonPosition}
                    onChange={(e) => setLessonPosition(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lesson-short-desc">
                  Description succincte
                </label>
                <input
                  id="lesson-short-desc"
                  type="text"
                  className="form-input"
                  placeholder="Aperçu rapide du contenu abordé dans cette leçon..."
                  value={lessonShortDesc}
                  onChange={(e) => setLessonShortDesc(e.target.value)}
                />
              </div>

              {/* Video URL */}
              <div className="form-group">
                <label className="form-label" htmlFor="lesson-video">
                  Vidéo ou lien externe (Optionnel)
                </label>
                <input
                  id="lesson-video"
                  type="url"
                  className="form-input"
                  placeholder="https://www.youtube.com/watch?v=... ou https://..."
                  value={lessonVideoUrl}
                  onChange={(e) => setLessonVideoUrl(e.target.value)}
                />
                <span className="form-hint">
                  Intégration automatique de vidéo YouTube/Vimeo ou lien externe sécurisé pour l'apprenant.
                </span>
              </div>

              {/* Lesson Text Content */}
              <div className="form-group">
                <label className="form-label" htmlFor="lesson-content">
                  Contenu texte de la leçon (Optionnel)
                </label>
                <textarea
                  id="lesson-content"
                  rows={6}
                  className="form-input font-lesson-editor"
                  placeholder="Rédigez le cours théorique, les consignes d'exercices, le code d'exemple..."
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                />
              </div>

              {/* Lesson Attachment File (Private Storage) */}
              <LessonAttachmentUploader
                courseId={course.id}
                moduleId={selectedModuleForLesson.id}
                lessonId={editingLesson?.id}
                existingResourceUrl={editingLesson?.resource_url}
                existingResourceName={editingLesson?.resource_name}
                existingResourceType={editingLesson?.resource_type}
                existingResourceSize={editingLesson?.resource_size}
                selectedFile={stagedFile}
                onFileSelect={(file) => setStagedFile(file)}
                onResourceDeleted={() => {
                  fetchCurriculum();
                  if (editingLesson) {
                    setEditingLesson({
                      ...editingLesson,
                      resource_url: null,
                      resource_name: null,
                      resource_type: null,
                      resource_size: null,
                    });
                  }
                }}
              />

              {uploadStatusText && (
                <div className="upload-progress-status">
                  <div className="spinner"></div>
                  <span>{uploadStatusText}</span>
                </div>
              )}

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn-admin-cta secondary"
                  onClick={() => setIsLessonModalOpen(false)}
                  disabled={savingLesson}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-admin-cta primary"
                  disabled={savingLesson}
                >
                  {savingLesson ? (
                    <span className="btn-loading-content">
                      <span className="spinner"></span> {uploadStatusText || 'Enregistrement...'}
                    </span>
                  ) : editingLesson ? (
                    'Enregistrer les modifications'
                  ) : (
                    'Créer la leçon'
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
