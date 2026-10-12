import React from 'react';
import type { AcademyCourse } from '@/types';
import { CourseCard } from './CourseCard';
import { AcademyIcon } from '@/components/icons';

interface MyCoursesProps {
  enrolledCourses: AcademyCourse[];
  loading: boolean;
  onViewCourse: (courseId: string) => void;
  onContinueCourse: (courseId: string) => void;
  onBrowseCatalog: () => void;
}

export const MyCourses: React.FC<MyCoursesProps> = ({
  enrolledCourses,
  loading,
  onViewCourse,
  onContinueCourse,
  onBrowseCatalog,
}) => {
  if (loading) {
    return (
      <div className="academy-loading-box">
        <div className="spinner large"></div>
        <p>Récupération de vos inscriptions...</p>
      </div>
    );
  }

  if (enrolledCourses.length === 0) {
    return (
      <div className="empty-catalog-state">
        <div className="empty-icon-circle">
          <AcademyIcon size={38} />
        </div>
        <h3 className="empty-title">Vous n'êtes inscrit à aucune formation</h3>
        <p className="empty-subtitle">
          Parcourez notre catalogue pour découvrir nos cours et débuter votre apprentissage dès maintenant.
        </p>
        <button
          type="button"
          className="btn-discover-catalog"
          onClick={onBrowseCatalog}
        >
          Découvrir les formations
        </button>
      </div>
    );
  }

  return (
    <div className="my-courses-container">
      <div className="courses-grid">
        {enrolledCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            isEnrolled={true}
            onView={onViewCourse}
            onContinue={onContinueCourse}
          />
        ))}
      </div>
    </div>
  );
};
