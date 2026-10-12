import { supabase } from '@/lib/supabase';
import type { AcademyPaymentRequest } from '@/types';

/**
 * Service for Academy Payment Requests
 * DB-Connect — "Votre passerelle vers le numérique."
 *
 * Enforces strict RLS and database RPC procedures:
 * - Creation: create_academy_payment_request
 * - Approval: approve_academy_payment_request
 * - Rejection: reject_academy_payment_request
 */

export interface CreatePaymentRequestParams {
  courseId: string;
  phone: string;
  whatsapp?: string | null;
  paymentMethod: string;
  paymentReference: string;
}

/**
 * Fetch all academy payment requests for academy_admin / super_admin
 */
export async function fetchAdminPaymentRequests(): Promise<{
  requests: AcademyPaymentRequest[];
  error?: string;
}> {
  if (!supabase) {
    return { requests: [], error: 'Client de base de données non initialisé.' };
  }

  try {
    const { data, error } = await supabase
      .from('academy_payment_requests')
      .select(`
        *,
        academy_courses (
          id,
          title,
          price,
          currency,
          thumbnail_url,
          delivery_mode
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[DB-Connect Academy] Error fetching admin payment requests:', error.message);
      return { requests: [], error: 'Impossible de charger les demandes de paiement.' };
    }

    const rawRequests = (data as AcademyPaymentRequest[]) || [];

    // Fetch user profiles for display (without querying auth.users)
    const userIds = Array.from(new Set(rawRequests.map((r) => r.user_id).filter(Boolean)));
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, phone, whatsapp')
        .in('id', userIds);

      if (profilesData && Array.isArray(profilesData)) {
        const profileMap = new Map<string, { id: string; full_name?: string | null; avatar_url?: string | null; phone?: string | null; whatsapp?: string | null }>();
        for (const p of profilesData) {
          profileMap.set(p.id, p);
        }

        for (const req of rawRequests) {
          req.user_profile = profileMap.get(req.user_id) || null;
        }
      }
    }

    return { requests: rawRequests };
  } catch (err) {
    console.warn('[DB-Connect Academy] Unexpected error in fetchAdminPaymentRequests:', err);
    return { requests: [], error: 'Erreur inattendue lors du chargement des paiements.' };
  }
}

/**
 * Fetch learner's own payment requests
 */
export async function fetchUserPaymentRequests(userId: string): Promise<{
  requests: AcademyPaymentRequest[];
  error?: string;
}> {
  if (!supabase || !userId) {
    return { requests: [] };
  }

  try {
    const { data, error } = await supabase
      .from('academy_payment_requests')
      .select(`
        *,
        academy_courses (
          id,
          title,
          price,
          currency,
          thumbnail_url,
          delivery_mode
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[DB-Connect Academy] Error fetching user payment requests:', error.message);
      return { requests: [], error: 'Impossible de charger vos demandes de paiement.' };
    }

    return { requests: (data as AcademyPaymentRequest[]) || [] };
  } catch (err) {
    console.warn('[DB-Connect Academy] Unexpected error in fetchUserPaymentRequests:', err);
    return { requests: [], error: 'Erreur inattendue lors du chargement de vos paiements.' };
  }
}

/**
 * Submit an academy payment request strictly via the PostgreSQL RPC:
 * public.create_academy_payment_request(
 *   p_course_id,
 *   p_participant_phone,
 *   p_participant_whatsapp,
 *   p_payment_method,
 *   p_payment_reference
 * )
 */
export async function createAcademyPaymentRequest(
  params: CreatePaymentRequestParams
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Client de base de données non initialisé.' };
  }

  if (!params.courseId) {
    return { success: false, error: 'Identifiant de formation manquant.' };
  }

  if (!params.phone?.trim()) {
    return { success: false, error: 'Le numéro de téléphone est obligatoire.' };
  }

  if (!params.paymentMethod?.trim()) {
    return { success: false, error: 'Le mode de paiement est obligatoire.' };
  }

  if (!params.paymentReference?.trim()) {
    return { success: false, error: 'La référence de transaction ou reçu de paiement est obligatoire.' };
  }

  try {
    const { data, error } = await supabase.rpc('create_academy_payment_request', {
      p_course_id: params.courseId,
      p_participant_phone: params.phone.trim(),
      p_participant_whatsapp: params.whatsapp?.trim() || null,
      p_payment_method: params.paymentMethod.trim(),
      p_payment_reference: params.paymentReference.trim(),
    });

    if (error) {
      console.warn('[DB-Connect Academy] Error in create_academy_payment_request:', error.message);
      let userMsg = 'Impossible de soumettre votre demande de paiement.';
      const lower = error.message.toLowerCase();
      if (lower.includes('authentifié') || lower.includes('auth')) {
        userMsg = 'Vous devez être connecté pour soumettre un paiement.';
      } else if (lower.includes('already') || lower.includes('en cours') || lower.includes('pending')) {
        userMsg = 'Une demande de paiement est déjà en cours pour cette formation.';
      } else if (lower.includes('non trouvée') || lower.includes('not found')) {
        userMsg = 'Formation introuvable.';
      }
      return { success: false, error: userMsg };
    }

    return { success: true, data };
  } catch (err) {
    console.warn('[DB-Connect Academy] Unexpected error in createAcademyPaymentRequest:', err);
    return { success: false, error: 'Erreur inattendue lors de la création de la demande.' };
  }
}

/**
 * Approve an academy payment request strictly via the PostgreSQL RPC:
 * public.approve_academy_payment_request(p_request_id, p_admin_note)
 */
export async function approveAcademyPaymentRequest(
  requestId: string,
  adminNote?: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Client de base de données non initialisé.' };
  }

  if (!requestId) {
    return { success: false, error: 'Identifiant de la demande manquant.' };
  }

  try {
    const { data, error } = await supabase.rpc('approve_academy_payment_request', {
      p_request_id: requestId,
      p_admin_note: adminNote?.trim() || null,
    });

    if (error) {
      console.warn('[DB-Connect Academy] Error in approve_academy_payment_request:', error.message);
      let msg = 'Impossible de valider le paiement.';
      if (error.message.toLowerCase().includes('accès') || error.message.toLowerCase().includes('refusé')) {
        msg = 'Accès refusé. Privilèges administrateur requis.';
      }
      return { success: false, error: msg };
    }

    return { success: true };
  } catch (err) {
    console.warn('[DB-Connect Academy] Unexpected error in approveAcademyPaymentRequest:', err);
    return { success: false, error: 'Erreur inattendue lors de la validation du paiement.' };
  }
}

/**
 * Reject an academy payment request strictly via the PostgreSQL RPC:
 * public.reject_academy_payment_request(p_request_id, p_admin_note)
 */
export async function rejectAcademyPaymentRequest(
  requestId: string,
  adminNote?: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Client de base de données non initialisé.' };
  }

  if (!requestId) {
    return { success: false, error: 'Identifiant de la demande manquant.' };
  }

  try {
    const { data, error } = await supabase.rpc('reject_academy_payment_request', {
      p_request_id: requestId,
      p_admin_note: adminNote?.trim() || null,
    });

    if (error) {
      console.warn('[DB-Connect Academy] Error in reject_academy_payment_request:', error.message);
      let msg = 'Impossible de refuser cette demande.';
      if (error.message.toLowerCase().includes('accès') || error.message.toLowerCase().includes('refusé')) {
        msg = 'Accès refusé. Privilèges administrateur requis.';
      }
      return { success: false, error: msg };
    }

    return { success: true };
  } catch (err) {
    console.warn('[DB-Connect Academy] Unexpected error in rejectAcademyPaymentRequest:', err);
    return { success: false, error: 'Erreur inattendue lors du rejet de la demande.' };
  }
}
