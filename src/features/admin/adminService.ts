import { supabase } from '@/lib/supabase';
import type { AdminUserRecord, AdminGlobalStats, UserRoleName } from '@/types';

/**
 * Normalizes roles array from RPC response.
 * Handles string[], object[], or comma-separated string safely.
 */
function normalizeUserRoles(rawRoles: unknown): UserRoleName[] {
  const allowedRoles: UserRoleName[] = [
    'user',
    'academy_admin',
    'marketplace_admin',
    'services_admin',
    'editor',
    'super_admin',
  ];

  let rawList: unknown[] = [];

  if (Array.isArray(rawRoles)) {
    rawList = rawRoles;
  } else if (typeof rawRoles === 'string') {
    rawList = rawRoles.split(',').map((s) => s.trim());
  }

  const result: UserRoleName[] = [];

  for (const item of rawList) {
    let name: string | undefined;
    if (typeof item === 'string') {
      name = item;
    } else if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      name = (obj.name || (obj.roles as Record<string, unknown>)?.name) as string | undefined;
    }

    if (name && allowedRoles.includes(name as UserRoleName)) {
      result.push(name as UserRoleName);
    }
  }

  // Ensure default 'user' role is always present
  if (!result.includes('user')) {
    result.unshift('user');
  }

  return Array.from(new Set(result));
}

/**
 * Translates PostgreSQL or network errors into clean, friendly French messages.
 * Never outputs raw PostgreSQL errors to the user.
 */
function translateAdminError(error: unknown, defaultMessage: string): string {
  if (!error) return defaultMessage;
  const message = (typeof error === 'object' && error !== null && 'message' in error)
    ? String((error as { message: unknown }).message).toLowerCase()
    : String(error).toLowerCase();

  if (message.includes('permission') || message.includes('denied') || message.includes('unauthorized') || message.includes('security definer')) {
    return 'Accès refusé. Privilèges super_admin requis.';
  }
  if (message.includes('already exists') || message.includes('duplicate') || message.includes('already')) {
    return 'Cet utilisateur possède déjà ce rôle.';
  }
  if (message.includes('cannot remove') || message.includes('not found') || message.includes('does not have')) {
    return 'Impossible de retirer ce rôle.';
  }
  if (message.includes('user role') && message.includes('base')) {
    return 'Le rôle utilisateur de base ne peut pas être retiré.';
  }
  if (message.includes('jwt') || message.includes('session') || message.includes('expired')) {
    return 'Session expirée. Veuillez vous reconnecter.';
  }

  return defaultMessage;
}

/**
 * 1. LIST USERS
 * Fetches all users exclusively through the secure PostgreSQL RPC:
 * public.admin_list_users()
 * Client-side querying of auth.users is strictly forbidden.
 */
export async function listUsers(): Promise<{ users: AdminUserRecord[]; error?: string }> {
  if (!supabase) {
    return { users: [], error: 'Client de base de données non initialisé.' };
  }

  try {
    const { data, error } = await supabase.rpc('admin_list_users');

    if (error) {
      console.warn('[DB-Connect Admin] Error in admin_list_users:', error.message);
      return {
        users: [],
        error: translateAdminError(error, 'Impossible de charger les utilisateurs.'),
      };
    }

    if (!Array.isArray(data)) {
      return { users: [] };
    }

    const normalizedUsers: AdminUserRecord[] = data.map((u: Record<string, unknown>) => {
      const id = String(u.id || u.user_id || '');
      const email = String(u.email || '');
      const fullName = (u.full_name || u.name || '') as string;
      const phone = (u.phone || null) as string | null;
      const whatsapp = (u.whatsapp || null) as string | null;
      const avatarUrl = (u.avatar_url || null) as string | null;
      const city = (u.city || null) as string | null;
      const createdAt = (u.created_at || null) as string | null;
      const roles = normalizeUserRoles(u.roles || u.role_names || u.user_roles);

      return {
        id,
        email,
        full_name: fullName,
        phone,
        whatsapp,
        avatar_url: avatarUrl,
        city,
        created_at: createdAt,
        roles,
      };
    });

    return { users: normalizedUsers };
  } catch (err) {
    console.warn('[DB-Connect Admin] Unexpected error in listUsers:', err);
    return {
      users: [],
      error: 'Impossible de charger les utilisateurs.',
    };
  }
}

/**
 * 2. ADD USER ROLE
 * Adds a role to a user exclusively through the secure PostgreSQL RPC:
 * public.admin_add_user_role(p_user_id, p_role_name)
 * Direct inserts into public.user_roles are strictly forbidden.
 */
export async function addUserRole(
  userId: string,
  roleName: UserRoleName
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Client de base de données non initialisé.' };
  }

  if (!userId || !roleName) {
    return { success: false, error: 'Identifiant utilisateur ou rôle manquant.' };
  }

  try {
    const { error } = await supabase.rpc('admin_add_user_role', {
      p_user_id: userId,
      p_role_name: roleName,
    });

    if (error) {
      console.warn('[DB-Connect Admin] Error in admin_add_user_role:', error.message);
      return {
        success: false,
        error: translateAdminError(error, 'Impossible de modifier ce rôle.'),
      };
    }

    return { success: true };
  } catch (err) {
    console.warn('[DB-Connect Admin] Unexpected error in addUserRole:', err);
    return {
      success: false,
      error: 'Impossible de modifier ce rôle.',
    };
  }
}

/**
 * 3. REMOVE USER ROLE
 * Removes a role from a user exclusively through the secure PostgreSQL RPC:
 * public.admin_remove_user_role(p_user_id, p_role_name)
 * Direct deletes from public.user_roles are strictly forbidden.
 */
export async function removeUserRole(
  userId: string,
  roleName: UserRoleName
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Client de base de données non initialisé.' };
  }

  if (roleName === 'user') {
    return { success: false, error: 'Le rôle utilisateur de base ne peut pas être retiré.' };
  }

  if (!userId || !roleName) {
    return { success: false, error: 'Identifiant utilisateur ou rôle manquant.' };
  }

  try {
    const { error } = await supabase.rpc('admin_remove_user_role', {
      p_user_id: userId,
      p_role_name: roleName,
    });

    if (error) {
      console.warn('[DB-Connect Admin] Error in admin_remove_user_role:', error.message);
      return {
        success: false,
        error: translateAdminError(error, 'Impossible de modifier ce rôle.'),
      };
    }

    return { success: true };
  } catch (err) {
    console.warn('[DB-Connect Admin] Unexpected error in removeUserRole:', err);
    return {
      success: false,
      error: 'Impossible de modifier ce rôle.',
    };
  }
}

/**
 * 4. GET GLOBAL ADMIN STATS
 * Aggregates real metrics across DB-Connect modules based on real tables and RLS:
 * - Users via admin_list_users()
 * - Academy: courses, published, enrollments
 * - Marketplace: products, published, orders (pending, delivered)
 * - Services: services, published, requests
 * - Opportunities: opportunities, published, applications
 * - Messages & Devis: contact requests by status
 */
export async function getGlobalAdminStats(): Promise<{
  stats: AdminGlobalStats;
  error?: string;
}> {
  const fallbackStats: AdminGlobalStats = {
    users: { total: 0, superAdmins: 0, moduleAdmins: 0, standardUsers: 0 },
    academy: { totalCourses: 0, publishedCourses: 0, draftCourses: 0, totalEnrollments: 0 },
    marketplace: { totalProducts: 0, publishedProducts: 0, pendingOrders: 0, deliveredOrders: 0, totalOrders: 0 },
    services: { totalServices: 0, publishedServices: 0, pendingRequests: 0, totalRequests: 0 },
    opportunities: { totalOpportunities: 0, publishedOpportunities: 0, totalApplications: 0 },
    requests: { totalRequests: 0, newRequests: 0, inReviewRequests: 0, quotedRequests: 0, closedRequests: 0 },
  };

  if (!supabase) {
    return { stats: fallbackStats, error: 'Client de base de données non disponible.' };
  }

  try {
    // 1. Fetch Users
    const usersResult = await listUsers();
    const users = usersResult.users;

    const superAdmins = users.filter((u) => u.roles.includes('super_admin')).length;
    const moduleAdmins = users.filter((u) =>
      u.roles.some((r) => ['academy_admin', 'marketplace_admin', 'services_admin', 'editor'].includes(r))
    ).length;
    const standardUsers = users.filter((u) => !u.roles.some((r) => r !== 'user')).length;

    // 2. Fetch Academy Data
    const [coursesRes, enrollmentsRes] = await Promise.all([
      supabase.from('academy_courses').select('status'),
      supabase.from('academy_enrollments').select('*', { count: 'exact', head: true }),
    ]);

    const courses = coursesRes.data || [];
    const totalCourses = courses.length;
    const publishedCourses = courses.filter((c: { status: string }) => c.status === 'published').length;
    const draftCourses = courses.filter((c: { status: string }) => c.status === 'draft').length;
    const totalEnrollments = enrollmentsRes.count || 0;

    // 3. Fetch Marketplace Data
    const [productsRes, ordersRes] = await Promise.all([
      supabase.from('marketplace_products').select('status'),
      supabase.from('marketplace_orders').select('status'),
    ]);

    const products = productsRes.data || [];
    const orders = ordersRes.data || [];
    const totalProducts = products.length;
    const publishedProducts = products.filter((p: { status: string }) => p.status === 'published').length;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o: { status: string }) => o.status === 'pending').length;
    const deliveredOrders = orders.filter((o: { status: string }) => o.status === 'delivered').length;

    // 4. Fetch Services Data
    const [servicesRes, serviceReqsRes] = await Promise.all([
      supabase.from('services').select('status'),
      supabase.from('service_requests').select('status'),
    ]);

    const services = servicesRes.data || [];
    const srvRequests = serviceReqsRes.data || [];
    const totalServices = services.length;
    const publishedServices = services.filter((s: { status: string }) => s.status === 'published').length;
    const totalServiceRequests = srvRequests.length;
    const pendingServiceRequests = srvRequests.filter((r: { status: string }) => r.status === 'pending').length;

    // 5. Fetch Opportunities Data
    const [oppsRes, oppAppsRes] = await Promise.all([
      supabase.from('opportunities').select('status'),
      supabase.from('opportunity_applications').select('*', { count: 'exact', head: true }),
    ]);

    const opportunities = oppsRes.data || [];
    const totalOpportunities = opportunities.length;
    const publishedOpportunities = opportunities.filter((o: { status: string }) => o.status === 'published').length;
    const totalApplications = oppAppsRes.count || 0;

    // 6. Fetch Contact & Quote Requests Data
    const { data: contactReqs } = await supabase.from('contact_requests').select('status');
    const cRequests = contactReqs || [];
    const totalContactRequests = cRequests.length;
    const newContactRequests = cRequests.filter((r: { status: string }) => r.status === 'new').length;
    const inReviewContactRequests = cRequests.filter((r: { status: string }) => r.status === 'in_review').length;
    const quotedContactRequests = cRequests.filter((r: { status: string }) => r.status === 'quoted').length;
    const closedContactRequests = cRequests.filter(
      (r: { status: string }) => r.status === 'closed' || r.status === 'accepted'
    ).length;

    const stats: AdminGlobalStats = {
      users: {
        total: users.length,
        superAdmins,
        moduleAdmins,
        standardUsers,
      },
      academy: {
        totalCourses,
        publishedCourses,
        draftCourses,
        totalEnrollments,
      },
      marketplace: {
        totalProducts,
        publishedProducts,
        pendingOrders,
        deliveredOrders,
        totalOrders,
      },
      services: {
        totalServices,
        publishedServices,
        pendingRequests: pendingServiceRequests,
        totalRequests: totalServiceRequests,
      },
      opportunities: {
        totalOpportunities,
        publishedOpportunities,
        totalApplications,
      },
      requests: {
        totalRequests: totalContactRequests,
        newRequests: newContactRequests,
        inReviewRequests: inReviewContactRequests,
        quotedRequests: quotedContactRequests,
        closedRequests: closedContactRequests,
      },
    };

    return { stats };
  } catch (err) {
    console.warn('[DB-Connect Admin] Error fetching global admin stats:', err);
    return {
      stats: fallbackStats,
      error: 'Impossible de calculer les statistiques globales.',
    };
  }
}
