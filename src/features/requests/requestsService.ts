import { supabase } from '@/lib/supabase';
import type {
  ContactRequest,
  ContactRequestType,
  ContactRequestSource,
  ContactRequestStatus,
} from '@/types';

export interface CreateContactRequestInput {
  requestType: ContactRequestType;
  sourceType: ContactRequestSource;
  serviceId?: string | null;
  courseId?: string | null;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  subject?: string | null;
  message: string;
  budget?: string | null;
  preferredDate?: string | null;
}

/**
 * Submit a contact or quote request into public.contact_requests.
 * RLS enforces user_id = auth.uid().
 */
export async function createContactRequest(
  input: CreateContactRequestInput,
  userId: string
): Promise<{ success: boolean; data?: ContactRequest; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Client de base de données non disponible.' };
  }

  if (!userId) {
    return { success: false, error: 'Vous devez être connecté pour envoyer une demande.' };
  }

  if (!input.fullName.trim()) {
    return { success: false, error: 'Le nom complet est obligatoire.' };
  }

  if (!input.message.trim()) {
    return { success: false, error: 'Veuillez saisir votre message ou description de besoin.' };
  }

  if (input.requestType === 'quote' && (!input.phone || !input.phone.trim())) {
    return { success: false, error: 'Le numéro de téléphone est obligatoire pour une demande de devis.' };
  }

  try {
    const payload = {
      user_id: userId,
      request_type: input.requestType,
      source_type: input.sourceType,
      service_id: input.serviceId || null,
      course_id: input.courseId || null,
      full_name: input.fullName.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      subject: input.subject?.trim() || null,
      message: input.message.trim(),
      budget: input.budget?.trim() || null,
      preferred_date: input.preferredDate || null,
      status: 'new',
    };

    const { data, error } = await supabase
      .from('contact_requests')
      .insert(payload)
      .select(`
        *,
        academy_courses ( id, title ),
        services ( id, title )
      `)
      .single();

    if (error) {
      console.warn('[DB-Connect Requests] Error inserting contact request:', error);
      return { success: false, error: error.message || 'Impossible d\'enregistrer votre demande.' };
    }

    return { success: true, data: data as ContactRequest };
  } catch (err) {
    console.warn('[DB-Connect Requests] Unexpected error:', err);
    return { success: false, error: 'Une erreur imprévue est survenue lors de l\'envoi.' };
  }
}

/**
 * Fetch contact & quote requests for the current authenticated user (governed by RLS).
 */
export async function fetchMyContactRequests(): Promise<{
  requests: ContactRequest[];
  error?: string;
}> {
  if (!supabase) return { requests: [] };

  try {
    const { data, error } = await supabase
      .from('contact_requests')
      .select(`
        *,
        academy_courses ( id, title ),
        services ( id, title )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[DB-Connect Requests] Error fetching user requests:', error);
      return { requests: [], error: error.message };
    }

    return { requests: (data as ContactRequest[]) || [] };
  } catch (err) {
    console.warn('[DB-Connect Requests] Unexpected fetch error:', err);
    return { requests: [], error: 'Erreur lors de la récupération de vos demandes.' };
  }
}

/**
 * Fetch all contact & quote requests for authorized admins (governed by RLS).
 * Authorized roles: academy_admin, services_admin, super_admin.
 */
export async function fetchAdminContactRequests(): Promise<{
  requests: ContactRequest[];
  error?: string;
}> {
  if (!supabase) return { requests: [] };

  try {
    const { data, error } = await supabase
      .from('contact_requests')
      .select(`
        *,
        academy_courses ( id, title ),
        services ( id, title )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[DB-Connect Requests] Error fetching admin requests:', error);
      return { requests: [], error: error.message };
    }

    return { requests: (data as ContactRequest[]) || [] };
  } catch (err) {
    console.warn('[DB-Connect Requests] Unexpected fetch error:', err);
    return { requests: [], error: 'Erreur lors de la récupération des demandes.' };
  }
}

/**
 * Update request status and/or admin response (admin operation governed by RLS).
 */
export async function updateAdminContactRequest(
  requestId: string,
  params: {
    status?: ContactRequestStatus;
    adminResponse?: string | null;
  }
): Promise<{ success: boolean; data?: ContactRequest; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Client de base de données non disponible.' };
  }

  try {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (params.status) {
      updatePayload.status = params.status;
    }

    if (params.adminResponse !== undefined) {
      updatePayload.admin_response = params.adminResponse?.trim() || null;
    }

    const { data, error } = await supabase
      .from('contact_requests')
      .update(updatePayload)
      .eq('id', requestId)
      .select(`
        *,
        academy_courses ( id, title ),
        services ( id, title )
      `)
      .single();

    if (error) {
      console.warn('[DB-Connect Requests] Update request error:', error);
      return { success: false, error: error.message || 'Impossible de mettre à jour la demande.' };
    }

    return { success: true, data: data as ContactRequest };
  } catch (err) {
    console.warn('[DB-Connect Requests] Unexpected update error:', err);
    return { success: false, error: 'Une erreur imprévue est survenue.' };
  }
}
