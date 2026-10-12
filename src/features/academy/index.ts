export { AcademyPage } from './AcademyPage';
export { AcademyAdminPage } from './AcademyAdminPage';
export { CourseCard } from './components/CourseCard';
export { CourseDetail } from './components/CourseDetail';
export { CoursePlayer } from './components/CoursePlayer';
export { MyCourses } from './components/MyCourses';
export { ProgressBar } from './components/ProgressBar';

// Admin components
export { AcademyAdminOverview } from './admin/AcademyAdminOverview';
export { CategoryManager } from './admin/CategoryManager';
export { CourseManager } from './admin/CourseManager';
export { CourseForm } from './admin/CourseForm';
export { CourseContentBuilder } from './admin/CourseContentBuilder';

// Storage helpers
export {
  ACADEMY_STORAGE_BUCKET,
  buildCourseCoverStoragePath,
  getAcademyCourseImageUrl,
  uploadCourseCoverImage,
  deleteCourseCoverImage,
  validateImageFile,
} from './utils/academyStorage';
