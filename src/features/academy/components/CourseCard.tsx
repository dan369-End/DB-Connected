import React, { useState, useEffect } from 'react';
import type { AcademyCourse } from '@/types';
import { getAcademyCourseImageUrl } from '../utils/academyStorage';
import { AcademyIcon, ArrowRightIcon } from '@/components/icons';

interface CourseCardProps {
  course: AcademyCourse;
  isEnrolled: boolean;
  onView: (courseId: string) => void;
  onContinue?: (courseId: string) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  isEnrolled,
  onView,
  onContinue,
}) => {
  const categoryName = course.academy_categories?.name || course.category?.name;
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    if (course.thumbnail_url) {
      getAcademyCourseImageUrl(course.thumbnail_url).then((url) => {
        if (!isCancelled) {
          setResolvedImageUrl(url);
        }
      });
    } else {
      setResolvedImageUrl(null);
    }

    return () => {
      isCancelled = true;
    };
  }, [course.thumbnail_url]);

  return (
    <div
      className="course-card"
      onClick={() => onView(course.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onView(course.id);
        }
      }}
    >
      {/* Thumbnail or Fallback */}
      <div className="course-card-thumb">
        {resolvedImageUrl ? (
          <img
            src={resolvedImageUrl}
            alt={course.title}
            className="course-thumb-img"
            loading="lazy"
          />
        ) : (
          <div className="course-thumb-fallback">
            <AcademyIcon size={34} />
          </div>
        )}
        {categoryName && (
          <span className="course-category-badge">{categoryName}</span>
        )}
        <span className={`course-tariff-badge ${course.is_paid ? 'paid' : 'free'}`}>
          {course.is_paid
            ? `${Number(course.price || 0).toLocaleString('fr-FR')} FCFA`
            : 'Gratuit'}
        </span>
        {isEnrolled && (
          <span className="course-enrolled-badge">Inscrit</span>
        )}
      </div>

      {/* Content */}
      <div className="course-card-body">
        <h3 className="course-card-title">{course.title}</h3>
        {course.short_description && (
          <p className="course-card-desc">{course.short_description}</p>
        )}
      </div>

      {/* Card Footer: Level, Duration, Platform, View/Continue Button */}
      <div className="course-card-footer">
        <div className="course-meta-tags">
          <span className="course-meta-tag">
            {course.duration_minutes > 0 ? `${course.duration_minutes} min` : 'À son rythme'}
          </span>
          <span className="course-meta-tag level">
            {course.level === 'beginner'
              ? 'Débutant'
              : course.level === 'intermediate'
              ? 'Intermédiaire'
              : 'Avancé'}
          </span>
          {course.delivery_mode === 'external' && course.external_platform && (
            <span className="course-meta-tag platform">
              {course.external_platform}
            </span>
          )}
        </div>

        {isEnrolled && onContinue ? (
          <button
            type="button"
            className="btn-course-action enrolled"
            onClick={(e) => {
              e.stopPropagation();
              onContinue(course.id);
            }}
          >
            <span>Poursuivre</span>
            <ArrowRightIcon size={14} />
          </button>
        ) : (
          <button
            type="button"
            className="btn-course-action"
            onClick={(e) => {
              e.stopPropagation();
              onView(course.id);
            }}
          >
            <span>Détails</span>
            <ArrowRightIcon size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
