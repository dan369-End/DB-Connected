import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { useNavigation } from '@/hooks/useNavigation';
import { ProgressBar } from './ProgressBar';
import {
  formatFileSize,
  getFriendlyFileFormat,
  getPrivateResourceSignedUrl,
  downloadPrivateResourceBlob,
} from '../utils/storage';
import {
  FileIcon,
  DownloadIcon,
  ExternalLinkIcon,
} from '@/components/icons';
import type { AcademyCourse, AcademyModule, AcademyLesson } from '@/types';

interface CoursePlayerProps {
  courseId: string;
}

export const CoursePlayer: React.FC<CoursePlayerProps> = ({ courseId }) => {
  const { user } = useAuth();
  const { navigate } = useNavigation();

  const [course, setCourse] = useState<AcademyCourse | null>(null);
  const [modules, setModules] = useState<AcademyModule[]>([]);
  const [activeLesson, setActiveLesson] = useState<AcademyLesson | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [savingProgress, setSavingProgress] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Attachment action states
  const [downloadingResource, setDownloadingResource] = useState<boolean>(false);
  const [consultingResource, setConsultingResource] = useState<boolean>(false);

  // Flattened list of accessible lessons for sequential navigation
  const allLessons = useMemo(() => {
    const list: AcademyLesson[] = [];
    modules.forEach((mod) => {
      if (mod.lessons) {
        list.push(...mod.lessons);
      }
    });
    return list;
  }, [modules]);

  const totalLessons = allLessons.length;
  const completedCount = completedLessonIds.size;

  const loadPlayerData = useCallback(async () => {
    if (!supabase || !user?.id) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Verify user enrollment
      const { data: enrollData, error: enrollError } = await supabase
        .from('academy_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (enrollError || !enrollData) {
        // If not enrolled yet, redirect to course detail
        navigate('academy_course', { courseId });
        return;
      }

      // 2. Fetch course info
      const { data: courseData, error: courseError } = await supabase
        .from('academy_courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle();

      if (courseError || !courseData) {
        setErrorMessage("Formation introuvable.");
        setLoading(false);
        return;
      }
      setCourse(courseData as AcademyCourse);

      // 3. Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('academy_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('position', { ascending: true });

      if (modulesError) throw modulesError;
      const moduleList = (modulesData as AcademyModule[]) || [];

      if (moduleList.length > 0) {
        const moduleIds = moduleList.map((m) => m.id);
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('academy_lessons')
          .select('*')
          .in('module_id', moduleIds)
          .order('position', { ascending: true });

        if (lessonsError) throw lessonsError;

        const lessons = (lessonsData as AcademyLesson[]) || [];
        const populatedModules = moduleList.map((m) => ({
          ...m,
          lessons: lessons.filter((l) => l.module_id === m.id),
        }));
        setModules(populatedModules);

        // Set default active lesson to first lesson
        if (lessons.length > 0) {
          setActiveLesson(lessons[0]);

          // 4. Fetch user completed lessons from public.academy_lesson_progress
          const lessonIds = lessons.map((l) => l.id);
          const { data: progressData } = await supabase
            .from('academy_lesson_progress')
            .select('lesson_id, completed')
            .eq('user_id', user.id)
            .in('lesson_id', lessonIds)
            .eq('completed', true);

          if (progressData && progressData.length > 0) {
            const completedSet = new Set(progressData.map((p) => p.lesson_id));
            setCompletedLessonIds(completedSet);

            // Optional: Jump to first uncompleted lesson
            const firstUncompleted = lessons.find((l) => !completedSet.has(l.id));
            if (firstUncompleted) {
              setActiveLesson(firstUncompleted);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[DB-Connect Academy Player] Error loading lessons:', err);
      setErrorMessage("Impossible d'accéder au lecteur de cours pour le moment.");
    } finally {
      setLoading(false);
    }
  }, [courseId, user?.id, navigate]);

  useEffect(() => {
    loadPlayerData();
  }, [loadPlayerData]);

  // Mark lesson as completed / toggle completed
  const handleToggleComplete = async () => {
    if (!supabase || !user?.id || !activeLesson || savingProgress) return;

    const lessonId = activeLesson.id;
    const isCurrentlyCompleted = completedLessonIds.has(lessonId);
    const newStatus = !isCurrentlyCompleted;

    setSavingProgress(true);
    try {
      const { error } = await supabase
        .from('academy_lesson_progress')
        .upsert(
          {
            user_id: user.id,
            lesson_id: lessonId,
            completed: newStatus,
            completed_at: newStatus ? new Date().toISOString() : null,
          },
          { onConflict: 'user_id,lesson_id' }
        );

      if (error) {
        console.warn('[DB-Connect Academy] Progress update error:', error.message);
      } else {
        setCompletedLessonIds((prev) => {
          const next = new Set(prev);
          if (newStatus) {
            next.add(lessonId);
          } else {
            next.delete(lessonId);
          }
          return next;
        });

        // If completed and there's a next lesson, automatically proceed
        if (newStatus) {
          const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
          if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
            setActiveLesson(allLessons[currentIndex + 1]);
          }
        }
      }
    } catch (err) {
      console.warn('[DB-Connect Academy] Error updating progress:', err);
    } finally {
      setSavingProgress(false);
    }
  };

  /**
   * Safe video player / external link renderer
   */
  const renderVideoPlayer = (url: string) => {
    try {
      let isEmbed = false;
      let embedUrl = url;

      if (url.includes('youtube.com/watch?v=')) {
        const videoId = new URL(url).searchParams.get('v');
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
          isEmbed = true;
        }
      } else if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0];
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
          isEmbed = true;
        }
      } else if (url.includes('vimeo.com/')) {
        const vimeoId = url.split('vimeo.com/')[1]?.split('?')[0];
        if (vimeoId) {
          embedUrl = `https://player.vimeo.com/video/${vimeoId}`;
          isEmbed = true;
        }
      } else if (url.endsWith('.mp4') || url.endsWith('.webm')) {
        return (
          <div className="video-player-container">
            <video controls className="video-player-iframe" src={url}>
              Votre navigateur ne prend pas en charge la balise vidéo.
            </video>
          </div>
        );
      }

      if (isEmbed) {
        return (
          <div className="video-player-container">
            <iframe
              src={embedUrl}
              title={activeLesson?.title || 'Vidéo de la leçon'}
              className="video-player-iframe"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }

      // If not an embeddable video, display secure external link action
      return (
        <div className="video-fallback-box">
          <div className="fallback-text-group">
            <span className="fallback-title">Lien / Ressource externe associée</span>
            <span className="fallback-url">{url}</span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-external-resource"
          >
            <span>Ouvrir la ressource</span>
            <ExternalLinkIcon size={14} />
          </a>
        </div>
      );
    } catch {
      return null;
    }
  };

  /**
   * Consult private file: generate ephemeral signed URL (600s) on-demand
   */
  const handleConsultAttachment = async () => {
    if (!activeLesson?.resource_url) return;
    setConsultingResource(true);
    try {
      const { signedUrl, error } = await getPrivateResourceSignedUrl(activeLesson.resource_url, 600);
      if (error || !signedUrl) {
        alert("Impossible d'accéder au support de cours. Veuillez réessayer.");
      } else {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      alert("Erreur lors de l'accès au support.");
    } finally {
      setConsultingResource(false);
    }
  };

  /**
   * Download private file: request signed download URL or blob download
   */
  const handleDownloadAttachment = async () => {
    if (!activeLesson?.resource_url) return;
    setDownloadingResource(true);
    const filename = activeLesson.resource_name || 'support-de-cours';

    try {
      // 1. Try Signed URL with download trigger
      const { signedUrl, error } = await getPrivateResourceSignedUrl(
        activeLesson.resource_url,
        600,
        filename
      );

      if (!error && signedUrl) {
        const link = document.createElement('a');
        link.href = signedUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDownloadingResource(false);
        return;
      }

      // 2. Fallback to direct authenticated Blob download
      const { blob, error: blobError } = await downloadPrivateResourceBlob(activeLesson.resource_url);
      if (blobError || !blob) {
        throw blobError || new Error("Échec du téléchargement");
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn('[DB-Connect Academy] Download error:', err);
      alert("Erreur lors du téléchargement du support.");
    } finally {
      setDownloadingResource(false);
    }
  };

  if (loading) {
    return (
      <div className="academy-loading-box">
        <div className="spinner large"></div>
        <p>Préparation de votre session d'apprentissage...</p>
      </div>
    );
  }

  if (errorMessage || !course) {
    return (
      <div className="academy-error-box">
        <p>{errorMessage || 'Contenu pédagogique indisponible.'}</p>
        <button
          type="button"
          className="btn-back-catalog"
          onClick={() => navigate('academy')}
        >
          Retour à l'Académie
        </button>
      </div>
    );
  }

  const isCurrentLessonCompleted = activeLesson ? completedLessonIds.has(activeLesson.id) : false;

  return (
    <div className="course-player-container">
      {/* Player Header */}
      <div className="player-top-header">
        <button
          type="button"
          className="btn-exit-player"
          onClick={() => navigate('academy_course', { courseId })}
          title="Quitter le lecteur"
        >
          &larr; Retour à la fiche du cours
        </button>
        <div className="player-header-title">
          <span className="player-course-label">{course.title}</span>
        </div>
        <div className="player-header-progress">
          <ProgressBar completed={completedCount} total={totalLessons} showDetails={true} />
        </div>
      </div>

      <div className="player-main-layout">
        {/* Main Lesson Content Column */}
        <div className="player-content-pane">
          {activeLesson ? (
            <div className="lesson-display-card">
              <div className="lesson-display-header">
                <span className="lesson-badge">Leçon en cours</span>
                <h1 className="lesson-main-title">{activeLesson.title}</h1>
                {activeLesson.short_description && (
                  <p className="lesson-short-desc">{activeLesson.short_description}</p>
                )}
              </div>

              {/* Video Player if video_url exists */}
              {activeLesson.video_url && renderVideoPlayer(activeLesson.video_url)}

              {/* Lesson Text Content if exists */}
              {activeLesson.content && (
                <div className="lesson-text-body">
                  <div className="lesson-text-content">
                    {activeLesson.content.split('\n\n').map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Lesson Downloadable Resource Card (if uploaded to private Storage) */}
              {activeLesson.resource_url && (
                <div className="lesson-resource-apprenant-card">
                  <div className="resource-apprenant-left">
                    <div className="resource-apprenant-icon">
                      <FileIcon size={24} />
                    </div>
                    <div className="resource-apprenant-info">
                      <span className="resource-apprenant-tag">Support de cours</span>
                      <h4 className="resource-apprenant-title">
                        {activeLesson.resource_name || 'Document pédagogique'}
                      </h4>
                      <span className="resource-apprenant-meta">
                        {getFriendlyFileFormat(activeLesson.resource_name, activeLesson.resource_type)} &bull; {formatFileSize(activeLesson.resource_size)}
                      </span>
                    </div>
                  </div>

                  <div className="resource-apprenant-actions">
                    <button
                      type="button"
                      className="btn-resource-learner consult"
                      onClick={handleConsultAttachment}
                      disabled={consultingResource}
                    >
                      <span>{consultingResource ? 'Ouverture...' : 'Consulter'}</span>
                      <ExternalLinkIcon size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-resource-learner download"
                      onClick={handleDownloadAttachment}
                      disabled={downloadingResource}
                    >
                      <DownloadIcon size={15} />
                      <span>{downloadingResource ? 'Téléchargement...' : 'Télécharger'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Footer action: Mark as completed */}
              <div className="lesson-actions-bar">
                <button
                  type="button"
                  className={`btn-complete-lesson ${isCurrentLessonCompleted ? 'completed' : ''}`}
                  onClick={handleToggleComplete}
                  disabled={savingProgress}
                >
                  {savingProgress ? (
                    <span className="btn-loading-content">
                      <span className="spinner"></span> Enregistrement...
                    </span>
                  ) : isCurrentLessonCompleted ? (
                    <>
                      <span className="check-icon">&#10003;</span>
                      <span>Leçon terminée (Cliquer pour annuler)</span>
                    </>
                  ) : (
                    <span>Marquer comme terminée</span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="no-lesson-selected">
              <p>Sélectionnez une leçon dans le menu latéral pour commencer.</p>
            </div>
          )}
        </div>

        {/* Sidebar: Modules and Lessons index */}
        <aside className="player-curriculum-sidebar">
          <div className="curriculum-sidebar-header">
            <h3 className="curriculum-title">Plan de cours</h3>
            <span className="curriculum-count">{completedCount} / {totalLessons} terminées</span>
          </div>

          <div className="curriculum-modules-scroll">
            {modules.map((mod, modIdx) => (
              <div key={mod.id} className="player-module-group">
                <div className="player-module-title">
                  <span className="mod-idx">Module {modIdx + 1}</span>
                  <span className="mod-name">{mod.title}</span>
                </div>

                {mod.lessons && mod.lessons.length > 0 && (
                  <ul className="player-lessons-list">
                    {mod.lessons.map((lesson) => {
                      const isSelected = activeLesson?.id === lesson.id;
                      const isDone = completedLessonIds.has(lesson.id);

                      return (
                        <li key={lesson.id}>
                          <button
                            type="button"
                            className={`player-lesson-btn ${isSelected ? 'active' : ''} ${isDone ? 'done' : ''}`}
                            onClick={() => setActiveLesson(lesson)}
                          >
                            <span className="status-marker">
                              {isDone ? '✓' : '•'}
                            </span>
                            <span className="lesson-btn-title">{lesson.title}</span>
                            <div className="lesson-btn-tags">
                              {lesson.video_url && (
                                <span className="btn-media-tag">Vidéo</span>
                              )}
                              {lesson.resource_url && (
                                <span className="btn-media-tag resource">Fichier</span>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};
