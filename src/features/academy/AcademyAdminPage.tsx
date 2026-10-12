import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth, RoleGuard } from '@/features/auth';
import { useNavigation } from '@/hooks/useNavigation';
import { AcademyAdminOverview } from './admin/AcademyAdminOverview';
import { CategoryManager } from './admin/CategoryManager';
import { CourseManager } from './admin/CourseManager';
import { PaymentRequestsAdmin } from './admin/PaymentRequestsAdmin';
import { fetchAdminPaymentRequests } from './academyPaymentService';
import type { AcademyCategory, AcademyCourse, AcademyPaymentRequest } from '@/types';

type AdminTab = 'overview' | 'categories' | 'courses' | 'payments';

export const AcademyAdminPage: React.FC = () => {
  const { hasAnyRole } = useAuth();
  const { navigate } = useNavigation();

  // Internal Navigation Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Shared Data
  const [categories, setCategories] = useState<AcademyCategory[]>([]);
  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<AcademyPaymentRequest[]>([]);
  const [enrollmentTotal, setEnrollmentTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Authority check: academy_admin or super_admin
  const isAuthorized = hasAnyRole(['academy_admin', 'super_admin']);

  // Fetch full data for admin
  const fetchAllData = useCallback(async () => {
    if (!supabase || !isAuthorized) return;
    setLoading(true);

    try {
      // 1. Categories
      const { data: catData } = await supabase
        .from('academy_categories')
        .select('*')
        .order('name', { ascending: true });

      setCategories((catData as AcademyCategory[]) || []);

      // 2. All Courses (draft, published, archived)
      const { data: coursesData } = await supabase
        .from('academy_courses')
        .select(`
          *,
          academy_categories ( id, name )
        `)
        .order('created_at', { ascending: false });

      setCourses((coursesData as AcademyCourse[]) || []);

      // 3. Count total enrollments
      const { count: enrollCount } = await supabase
        .from('academy_enrollments')
        .select('*', { count: 'exact', head: true });

      setEnrollmentTotal(enrollCount || 0);

      // 4. Fetch payment requests
      const payRes = await fetchAdminPaymentRequests();
      setPaymentRequests(payRes.requests || []);
    } catch (err) {
      console.warn('[DB-Connect Academy Admin] Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (isAuthorized) {
      fetchAllData();
    }
  }, [isAuthorized, fetchAllData]);

  const pendingPaymentsCount = paymentRequests.filter((r) => r.status === 'pending').length;
  const approvedPaymentsCount = paymentRequests.filter((r) => r.status === 'approved').length;

  // Calculated Real Statistics
  const stats = {
    totalCourses: courses.length,
    publishedCourses: courses.filter((c) => c.status === 'published').length,
    draftCourses: courses.filter((c) => c.status === 'draft').length,
    archivedCourses: courses.filter((c) => c.status === 'archived').length,
    totalCategories: categories.length,
    totalEnrollments: enrollmentTotal,
    pendingPayments: pendingPaymentsCount,
    approvedPayments: approvedPaymentsCount,
  };

  return (
    <RoleGuard
      allowedRoles={['academy_admin', 'super_admin']}
      fallback={
        <div className="module-page-container">
          <div className="academy-error-box">
            <h3 className="empty-title">Accès non autorisé</h3>
            <p>
              Cette section est strictement réservée aux administrateurs de l'Académie (<code>academy_admin</code> ou <code>super_admin</code>).
            </p>
            <button
              type="button"
              className="btn-back-catalog"
              onClick={() => navigate('academy')}
            >
              Retour à l'Académie
            </button>
          </div>
        </div>
      }
    >
      <div className="admin-page-container">
        {/* Top Header */}
        <div className="admin-header-strip">
          <div className="admin-title-group">
            <div className="admin-breadcrumb-line">
              <button
                type="button"
                className="btn-back-breadcrumb"
                onClick={() => navigate('academy')}
              >
                &larr; Académie
              </button>
              <span className="crumb-sep">/</span>
              <span className="crumb-current">Back-office</span>
            </div>
            <h1 className="admin-main-title">Administration Académie</h1>
            <p className="admin-subline">
              Gestion centralisée des formations, modules, leçons et catégories
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="admin-subnav-tabs">
          <button
            type="button"
            className={`admin-nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Vue d'ensemble
          </button>
          <button
            type="button"
            className={`admin-nav-tab ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            Formations ({courses.length})
          </button>
          <button
            type="button"
            className={`admin-nav-tab ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Catégories ({categories.length})
          </button>
          <button
            type="button"
            className={`admin-nav-tab ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            Paiements{pendingPaymentsCount > 0 ? ` (${pendingPaymentsCount})` : ''}
          </button>
        </div>

        {/* Active Content View */}
        <div className="admin-view-content">
          {activeTab === 'overview' && (
            <AcademyAdminOverview
              stats={stats}
              loading={loading}
              onNewCourse={() => setActiveTab('courses')}
              onNewCategory={() => setActiveTab('categories')}
              onNavigatePayments={() => setActiveTab('payments')}
            />
          )}

          {activeTab === 'courses' && (
            <CourseManager
              courses={courses}
              categories={categories}
              loading={loading}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === 'categories' && (
            <CategoryManager
              categories={categories}
              loading={loading}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentRequestsAdmin
              requests={paymentRequests}
              loading={loading}
              onRefresh={fetchAllData}
            />
          )}
        </div>
      </div>
    </RoleGuard>
  );
};
