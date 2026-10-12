import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { useNavigation } from '@/hooks/useNavigation';
import { CourseCard } from './components/CourseCard';
import { MyCourses } from './components/MyCourses';
import { MyAcademyPayments } from './components/MyAcademyPayments';
import { fetchUserPaymentRequests } from './academyPaymentService';
import { SearchIcon, AcademyIcon } from '@/components/icons';
import type { AcademyCategory, AcademyCourse, AcademyPaymentRequest } from '@/types';

export const AcademyPage: React.FC = () => {
  const { user, hasAnyRole } = useAuth();
  const { navigate, routeParams } = useNavigation();

  const [activeTab, setActiveTab] = useState<'catalog' | 'my-courses' | 'my-payments'>(() => {
    return routeParams.tab === 'payments' ? 'my-payments' : 'catalog';
  });
  const [categories, setCategories] = useState<AcademyCategory[]>([]);
  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [userPayments, setUserPayments] = useState<AcademyPaymentRequest[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [enrolledLoading, setEnrolledLoading] = useState<boolean>(false);
  const [paymentsLoading, setPaymentsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync tab if routeParams changes
  useEffect(() => {
    if (routeParams.tab === 'payments') {
      setActiveTab('my-payments');
    }
  }, [routeParams.tab]);

  // Check admin rights for discrete access link
  const canAccessAdmin = hasAnyRole(['academy_admin', 'super_admin']);

  // Fetch categories and published courses
  const fetchAcademyData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Fetch categories
      const { data: catData, error: catError } = await supabase
        .from('academy_categories')
        .select('*')
        .order('name', { ascending: true });

      if (catError) {
        console.warn('[DB-Connect Academy] Note on categories:', catError.message);
      } else {
        setCategories((catData as AcademyCategory[]) || []);
      }

      // 2. Fetch courses respecting RLS
      const { data: coursesData, error: coursesError } = await supabase
        .from('academy_courses')
        .select(`
          *,
          academy_categories ( id, name )
        `)
        .order('created_at', { ascending: false });

      if (coursesError) {
        console.warn('[DB-Connect Academy] Error loading courses:', coursesError.message);
        setErrorMsg("Impossible de charger les formations pour le moment.");
      } else {
        setCourses((coursesData as AcademyCourse[]) || []);
      }

      // 3. Fetch user enrollments and payments
      if (user?.id) {
        setEnrolledLoading(true);
        setPaymentsLoading(true);

        const [enrollRes, payRes] = await Promise.all([
          supabase.from('academy_enrollments').select('course_id').eq('user_id', user.id),
          fetchUserPaymentRequests(user.id),
        ]);

        if (enrollRes.data) {
          setEnrolledCourseIds(new Set(enrollRes.data.map((e) => e.course_id)));
        }
        setUserPayments(payRes.requests || []);

        setEnrolledLoading(false);
        setPaymentsLoading(false);
      }
    } catch (err) {
      console.warn('[DB-Connect Academy] Fetch error:', err);
      setErrorMsg("Une erreur est survenue lors de la communication avec le serveur.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchUserPaymentsOnly = useCallback(async () => {
    if (!user?.id) return;
    setPaymentsLoading(true);
    const res = await fetchUserPaymentRequests(user.id);
    setUserPayments(res.requests || []);
    setPaymentsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchAcademyData();
  }, [fetchAcademyData]);

  // Filtered courses based on category and local search query
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesCategory =
        selectedCategoryId === 'all' ||
        (c.category_id != null && String(c.category_id) === String(selectedCategoryId)) ||
        (c.academy_categories?.id != null && String(c.academy_categories.id) === String(selectedCategoryId));

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.short_description && c.short_description.toLowerCase().includes(q)) ||
        (c.academy_categories?.name && c.academy_categories.name.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [courses, selectedCategoryId, searchQuery]);

  // User's enrolled courses list
  const enrolledCoursesList = useMemo(() => {
    return courses.filter((c) => enrolledCourseIds.has(c.id));
  }, [courses, enrolledCourseIds]);

  const handleViewCourse = (courseId: string) => {
    navigate('academy_course', { courseId });
  };

  const handleContinueCourse = (courseId: string) => {
    navigate('academy_player', { courseId });
  };

  return (
    <div className="academy-page-container">
      {/* Academy Top Header */}
      <div className="academy-header-banner">
        <div className="academy-title-group">
          <div className="academy-chip">
            <span className="chip-dot" />
            <span>Pôle Formation Numérique</span>
          </div>
          <h1 className="academy-title">Académie</h1>
          <p className="academy-tagline">
            « Développez vos compétences avec DB-Connect »
          </p>
        </div>

        {/* Discrete Admin Link if user is academy_admin or super_admin */}
        {canAccessAdmin && (
          <div className="academy-admin-link-wrapper">
            <button
              type="button"
              className="btn-admin-access"
              onClick={() => navigate('academy_admin')}
              title="Accès réservé aux administrateurs"
            >
              Administration Académie &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Tabs navigation: Découvrir / Mes formations */}
      <div className="academy-tabs-bar">
        <button
          type="button"
          className={`academy-tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          Découvrir le catalogue
          <span className="tab-count">{courses.length}</span>
        </button>

        <button
          type="button"
          className={`academy-tab-btn ${activeTab === 'my-courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-courses')}
        >
          Mes formations
          <span className="tab-count">{enrolledCourseIds.size}</span>
        </button>

        {user && (
          <button
            type="button"
            className={`academy-tab-btn ${activeTab === 'my-payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-payments')}
          >
            Mes paiements
            {userPayments.length > 0 && <span className="tab-count">{userPayments.length}</span>}
          </button>
        )}
      </div>

      {/* Main Tab Content */}
      {activeTab === 'catalog' ? (
        <div className="academy-catalog-view">
          {/* Search & Categories Bar */}
          <div className="academy-toolbar">
            <div className="academy-search-box">
              <SearchIcon className="search-icon" size={17} />
              <input
                type="search"
                className="academy-search-input"
                placeholder="Rechercher par titre ou mot-clé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Rechercher une formation"
              />
            </div>

            {/* Categories Pills */}
            <div className="academy-categories-scroll">
              <button
                type="button"
                className={`cat-pill ${selectedCategoryId === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategoryId('all')}
              >
                Toutes
              </button>
              {categories.map((cat) => (
                <button
                  key={String(cat.id)}
                  type="button"
                  className={`cat-pill ${selectedCategoryId === String(cat.id) ? 'active' : ''}`}
                  onClick={() => setSelectedCategoryId(String(cat.id))}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Loading, Error or Catalog Grid */}
          {loading ? (
            <div className="academy-loading-box">
              <div className="spinner large"></div>
              <p>Chargement des formations disponibles...</p>
            </div>
          ) : errorMsg ? (
            <div className="academy-error-box">
              <p>{errorMsg}</p>
              <button
                type="button"
                className="btn-retry-action"
                onClick={fetchAcademyData}
              >
                Réessayer
              </button>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="empty-catalog-state">
              <div className="empty-icon-circle">
                <AcademyIcon size={38} />
              </div>
              <h3 className="empty-title">Aucune formation disponible pour le moment.</h3>
              <p className="empty-subtitle">
                {searchQuery || selectedCategoryId !== 'all'
                  ? 'Aucun résultat ne correspond à vos filtres de recherche.'
                  : 'Les premières formations de DB-Connect seront publiées très prochainement.'}
              </p>
              {(searchQuery || selectedCategoryId !== 'all') && (
                <button
                  type="button"
                  className="btn-reset-filters"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategoryId('all');
                  }}
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <div className="courses-grid">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isEnrolled={enrolledCourseIds.has(course.id)}
                  onView={handleViewCourse}
                  onContinue={handleContinueCourse}
                />
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'my-courses' ? (
        <MyCourses
          enrolledCourses={enrolledCoursesList}
          loading={enrolledLoading}
          onViewCourse={handleViewCourse}
          onContinueCourse={handleContinueCourse}
          onBrowseCatalog={() => setActiveTab('catalog')}
        />
      ) : (
        <MyAcademyPayments
          requests={userPayments}
          loading={paymentsLoading}
          onRefresh={fetchUserPaymentsOnly}
        />
      )}
    </div>
  );
};
