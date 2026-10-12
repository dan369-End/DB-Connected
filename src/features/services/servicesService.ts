import { supabase } from '@/lib/supabase';
import type {
  ServiceRecord,
  ServiceCategory,
  ServiceRequestRecord,
  ServiceStatus,
  ServiceRequestStatus,
} from '@/types';

/**
 * ============================================================================
 * PUBLIC / USER-FACING QUERIES (Governed by RLS)
 * ============================================================================
 */

/**
 * Fetch all service categories
 */
export async function fetchServiceCategories(): Promise<{
  categories: ServiceCategory[];
  error?: string;
}> {
  if (!supabase) return { categories: [] };

  try {
    const { data, error } = await supabase
      .from('services_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('[DB-Connect Services] Categories fetch note:', error.message);
      return { categories: [], error: 'Impossible de charger les catégories.' };
    }

    return { categories: (data as ServiceCategory[]) || [] };
  } catch (err: unknown) {
    return { categories: [], error: 'Erreur réseau inattendue.' };
  }
}

/**
 * Fetch services for user view (RLS returns published services)
 */
export async function fetchPublishedServices(): Promise<{
  services: ServiceRecord[];
  error?: string;
}> {
  if (!supabase) return { services: [] };

  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        services_categories ( id, name, slug )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[DB-Connect Services] Services fetch note:', error.message);
      return { services: [], error: 'Impossible de charger les services pour le moment.' };
    }

    return { services: (data as ServiceRecord[]) || [] };
  } catch (err: unknown) {
    return { services: [], error: 'Erreur réseau inattendue.' };
  }
}

/**
 * Fetch single service detail by ID
 */
export async function fetchServiceById(id: string): Promise<{
  service: ServiceRecord | null;
  error?: string;
}> {
  if (!supabase) return { service: null };

  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        services_categories ( id, name, slug, description )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.warn('[DB-Connect Services] Service detail note:', error.message);
      return { service: null, error: 'Impossible de charger ce service.' };
    }

    return { service: (data as ServiceRecord) || null };
  } catch (err: unknown) {
    return { service: null, error: 'Erreur réseau inattendue.' };
  }
}

/**
 * Submit a service request (creates a record in public.service_requests)
 * RLS ensures user_id must equal auth.uid()
 */
export interface CreateServiceRequestParams {
  serviceId: string;
  userId: string;
  fullName: string;
  phone: string;
  email?: string;
  message: string;
  preferredDate?: string | null;
}

export async function createServiceRequest(params: CreateServiceRequestParams): Promise<{
  success: boolean;
  requestId?: string;
  error?: string;
}> {
  if (!supabase) {
    return { success: false, error: 'Client de base de données indisponible.' };
  }

  try {
    const { data, error } = await supabase
      .from('service_requests')
      .insert({
        service_id: params.serviceId,
        user_id: params.userId,
        full_name: params.fullName.trim(),
        phone: params.phone.trim(),
        email: params.email ? params.email.trim() : null,
        message: params.message.trim(),
        preferred_date: params.preferredDate || null,
        // Status defaults to 'pending' in PostgreSQL schema
      })
      .select('id')
      .single();

    if (error) {
      console.warn('[DB-Connect Services] Create request error:', error.message);
      return {
        success: false,
        error: error.message || 'Impossible d\'enregistrer votre demande pour le moment.',
      };
    }

    return { success: true, requestId: data?.id };
  } catch (err: unknown) {
    return {
      success: false,
      error: 'Une erreur de communication est survenue lors de l\'envoi de la demande.',
    };
  }
}

/**
 * Fetch current user's service requests (governed by RLS)
 */
export async function fetchUserServiceRequests(): Promise<{
  requests: ServiceRequestRecord[];
  error?: string;
}> {
  if (!supabase) return { requests: [] };

  try {
    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        *,
        services (
          id,
          title,
          price_from,
          currency,
          image_url,
          category_id,
          services_categories ( id, name )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[DB-Connect Services] User requests error:', error.message);
      return { requests: [], error: 'Impossible de charger vos demandes.' };
    }

    return { requests: (data as ServiceRequestRecord[]) || [] };
  } catch (err: unknown) {
    return { requests: [], error: 'Erreur réseau inattendue.' };
  }
}

/**
 * ============================================================================
 * ADMIN QUERIES & MUTATIONS (services_admin / super_admin via RLS)
 * ============================================================================
 */

/**
 * Fetch all services for admin (includes draft, published, archived)
 */
export async function fetchAdminServices(): Promise<{
  services: ServiceRecord[];
  error?: string;
}> {
  if (!supabase) return { services: [] };

  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        services_categories ( id, name, slug )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[DB-Connect Services Admin] Fetch error:', error.message);
      return { services: [], error: 'Impossible de charger les services.' };
    }

    return { services: (data as ServiceRecord[]) || [] };
  } catch (err: unknown) {
    return { services: [], error: 'Erreur inattendue.' };
  }
}

/**
 * Create a new service record (admin)
 */
export interface UpsertServiceParams {
  id?: string;
  categoryId?: string | null;
  title: string;
  slug?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  priceFrom?: number | null;
  currency?: string | null;
  imageUrl?: string | null;
  status: ServiceStatus;
  userId: string;
}

export async function upsertService(params: UpsertServiceParams): Promise<{
  success: boolean;
  service?: ServiceRecord;
  error?: string;
}> {
  if (!supabase) return { success: false, error: 'Client indisponible.' };

  try {
    if (params.id) {
      // Update
      const { data, error } = await supabase
        .from('services')
        .update({
          category_id: params.categoryId || null,
          title: params.title.trim(),
          slug: params.slug?.trim() || null,
          short_description: params.shortDescription?.trim() || null,
          description: params.description?.trim() || null,
          price_from: params.priceFrom ?? null,
          currency: params.currency || 'XAF',
          image_url: params.imageUrl?.trim() || null,
          status: params.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, service: data as ServiceRecord };
    } else {
      // Insert
      const { data, error } = await supabase
        .from('services')
        .insert({
          category_id: params.categoryId || null,
          title: params.title.trim(),
          slug: params.slug?.trim() || null,
          short_description: params.shortDescription?.trim() || null,
          description: params.description?.trim() || null,
          price_from: params.priceFrom ?? null,
          currency: params.currency || 'XAF',
          image_url: params.imageUrl?.trim() || null,
          status: params.status,
          created_by: params.userId,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, service: data as ServiceRecord };
    }
  } catch (err: unknown) {
    return { success: false, error: 'Erreur inattendue lors de l\'enregistrement.' };
  }
}

/**
 * Delete a service (admin)
 */
export async function deleteService(serviceId: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Client indisponible.' };

  try {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: 'Erreur inattendue lors de la suppression.' };
  }
}

/**
 * Quick status update on a service
 */
export async function updateServiceStatus(
  serviceId: string,
  newStatus: ServiceStatus
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Client indisponible.' };

  try {
    const { error } = await supabase
      .from('services')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', serviceId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: 'Erreur inattendue.' };
  }
}

/**
 * ============================================================================
 * CATEGORIES CRUD (admin)
 * ============================================================================
 */

export async function upsertServiceCategory(params: {
  id?: string;
  name: string;
  slug?: string;
  description?: string;
}): Promise<{ success: boolean; category?: ServiceCategory; error?: string }> {
  if (!supabase) return { success: false, error: 'Client indisponible.' };

  try {
    if (params.id) {
      const { data, error } = await supabase
        .from('services_categories')
        .update({
          name: params.name.trim(),
          slug: params.slug?.trim() || null,
          description: params.description?.trim() || null,
        })
        .eq('id', params.id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, category: data as ServiceCategory };
    } else {
      const { data, error } = await supabase
        .from('services_categories')
        .insert({
          name: params.name.trim(),
          slug: params.slug?.trim() || null,
          description: params.description?.trim() || null,
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, category: data as ServiceCategory };
    }
  } catch (err: unknown) {
    return { success: false, error: 'Erreur inattendue.' };
  }
}

export async function deleteServiceCategory(categoryId: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Client indisponible.' };

  try {
    const { error } = await supabase
      .from('services_categories')
      .delete()
      .eq('id', categoryId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: 'Erreur inattendue lors de la suppression.' };
  }
}

/**
 * ============================================================================
 * ADMIN SERVICE REQUESTS
 * ============================================================================
 */

export async function fetchAdminServiceRequests(): Promise<{
  requests: ServiceRequestRecord[];
  error?: string;
}> {
  if (!supabase) return { requests: [] };

  try {
    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        *,
        services (
          id,
          title,
          price_from,
          currency,
          image_url,
          category_id,
          services_categories ( id, name )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[DB-Connect Services Admin] Requests fetch error:', error.message);
      return { requests: [], error: 'Impossible de charger les demandes de services.' };
    }

    return { requests: (data as ServiceRequestRecord[]) || [] };
  } catch (err: unknown) {
    return { requests: [], error: 'Erreur inattendue.' };
  }
}

export async function updateServiceRequestStatus(
  requestId: string,
  newStatus: ServiceRequestStatus
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Client indisponible.' };

  try {
    const { error } = await supabase
      .from('service_requests')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      console.warn('[DB-Connect Services Admin] Status update error:', error.message);
      return { success: false, error: 'Impossible de modifier le statut de la demande.' };
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: 'Erreur inattendue.' };
  }
}
