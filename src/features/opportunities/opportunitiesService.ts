/**
 * Opportunities Service Module
 * 
 * Handles all database operations for:
 * - public.opportunity_categories
 * - public.opportunities
 * - public.opportunity_applications
 * 
 * Strict Row Level Security (RLS) adherence.
 */

import { supabase } from '@/lib/supabase';
import type {
  Opportunity,
  OpportunityCategory,
  OpportunityApplication,
  OpportunityStatus,
  ApplicationStatus,
} from '@/types';
import { deleteOpportunityCoverImage } from './utils/opportunityStorage';

// ============================================================================
// HELPER UTILITIES
// ============================================================================

/**
 * Checks if a given deadline string is in the past compared to today (midnight).
 */
export function isDeadlinePassed(deadline?: string | null): boolean {
  if (!deadline) return false;
  try {
    const target = new Date(deadline);
    if (isNaN(target.getTime())) return false;
    
    // Set to end of day of deadline for fairness if only date is specified
    if (deadline.length <= 10) {
      target.setHours(23, 59, 59, 999);
    }
    return target.getTime() < Date.now();
  } catch {
    return false;
  }
}

/**
 * Formats a deadline date into human-readable French.
 */
export function formatDeadline(deadline?: string | null): string {
  if (!deadline) return 'Non spécifiée';
  try {
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return deadline;
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return deadline;
  }
}

/**
 * Formats an ISO date into French format with hour.
 */
export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return 'Date inconnue';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

/**
 * French translations for Application Status
 */
export function formatApplicationStatus(status?: string | null): string {
  switch (status) {
    case 'submitted':
      return 'Envoyée';
    case 'reviewing':
      return "En cours d'étude";
    case 'shortlisted':
      return 'Présélectionnée';
    case 'accepted':
      return 'Acceptée';
    case 'rejected':
      return 'Refusée';
    case 'withdrawn':
      return 'Retirée';
    default:
      return status || 'Inconnu';
  }
}

/**
 * CSS class helper for Application Status
 */
export function getApplicationStatusBadgeClass(status?: string | null): string {
  switch (status) {
    case 'submitted':
      return 'app-badge-submitted';
    case 'reviewing':
      return 'app-badge-reviewing';
    case 'shortlisted':
      return 'app-badge-shortlisted';
    case 'accepted':
      return 'app-badge-accepted';
    case 'rejected':
      return 'app-badge-rejected';
    case 'withdrawn':
      return 'app-badge-withdrawn';
    default:
      return 'app-badge-default';
  }
}

/**
 * Generates an SEO friendly slug from a string.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ============================================================================
// OPPORTUNITY CATEGORIES
// ============================================================================

export async function fetchOpportunityCategories(): Promise<{
  categories: OpportunityCategory[];
  error?: string;
}> {
  if (!supabase) return { categories: [] };

  try {
    const { data, error } = await supabase
      .from('opportunity_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('[DB-Connect Opportunities] Category fetch error:', error.message);
      return { categories: [], error: error.message };
    }

    return { categories: (data as OpportunityCategory[]) || [] };
  } catch (err: unknown) {
    return { categories: [], error: 'Erreur inattendue.' };
  }
}

export async function createOpportunityCategory(params: {
  name: string;
  slug?: string | null;
  description?: string | null;
}): Promise<{ success: boolean; category?: OpportunityCategory; error?: string }> {
  if (!supabase) return { success: false, error: 'Client indisponible.' };

  try {
    const finalSlug = (params.slug?.trim() || generateSlug(params.name)).toLowerCase();

    const { data, error } = await supabase
      .from('opportunity_categories')
      .insert({
        name: params.name.trim(),
        slug: finalSlug,
        description: params.description?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Une catégorie avec ce nom ou ce slug existe déjà.' };
      }
      return { success: false, error: error.message };
    }

    return { success: true, category: data as OpportunityCategory };
  } catch (err: unknown) {
    return { success: false, error: 'Erreur inattendue.' };
  }
}

export async function updateOpportunityCategory(
  id: string | number,
  params: {
    name: string;
    slug?: string | null;
    description?: string | null;
  }
): Promise<{ success: boolean; category?: OpportunityCategory; error?: string }> {
  if (!supabase) return { success: false, error: 'Client indisponible.' };

  try {
    const finalSlug = (params.slug?.trim() || generateSlug(params.name)).toLowerCase();

    const { data, error } = await supabase
      .from('opportunity_categories')
      .update({
        name: params.name.trim(),
        slug: finalSlug,
        description: params.description?.trim() || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Une catégorie avec ce nom ou ce slug existe déjà.' };
      }
      return { success: false, error: error.message };
    }

    return { success: true, category: data as OpportunityCategory };
  } catch (err: unknown) {
    return { success: false, error: 'Erreur inattendue.' };
  }
}

export async function deleteOpportunityCategory(
  id: string | number
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Client indisponible.' };

  try {
    const { error } = await supabase
      .from('opportunity_categories')
      .delete()
      .eq('id', id);

    if (error) {
      return {
        success: false,
        error: 'Impossible de supprimer la catégorie (des opportunités y sont peut-être rattachées).',
      };
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: 'Erreur inattendue.' };
  }
}

// ============================================================================
// OPPORTUNITIES (USER & ADMIN)
// ============================================================================

/**
 * Fetch all published opportunities for standard user view.
 * RLS ensures only published records are accessible to regular users.
 */
export async function fetchPublishedOpportunities(): Promise<{
  opportunities: Opportunity[];
  error?: string;
}> {
  if (!supabase) return { opportunities: [] };

  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select(`
        *,
        opportunity_categories ( id, name, slug )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[DB-Connect Opportunities] Fetch error:', error.message);
      return { opportunities: [], error: 'Impossible de charger les opportunités.' };
    }

    return { opportunities: (data as Opportunity[]) || [] };
  } catch (err: unknown) {
    return { opportunities: [], error: 'Erreur inattendue.' };
  }
}

/**
 * Fetch single opportunity by ID.
 */
export async function fetchOpportunityById(id: string): Promise<{
  opportunity?: Opportunity | null;
  error?: string;
}> {
  if (!supabase) return { opportunity: null };

  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select(`
        *,
        opportunity_categories ( id, name, slug )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.warn('[DB-Connect Opportunities] Detail error:', error.message);
      return { opportunity: null, error: error.message };
    }

    return { opportunity: (data as Opportunity) || null };
  } catch (err: unknown) {
    return { opportunity: null, error: 'Erreur inattendue.' };
  }
}

/**
 * Fetch all opportunities for admin view (editor / super_admin).
 */
export async function fetchAdminOpportunities(): Promise<{
  opportunities: Opportunity[];
  error?: string;
}> {
  if (!supabase) return { opportunities: [] };

  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select(`
        *,
        opportunity_categories ( id, name, slug )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[DB-Connect Opportunities Admin] Fetch error:', error.message);
      return { opportunities: [], error: 'Impossible de charger les opportunités.' };
    }

    return { opportunities: (data as Opportunity[]) || [] };
  } catch (err: unknown) {
    return { opportunities: [], error: 'Erreur inattendue.' };
  }
}

export interface UpsertOpportunityParams {
  id?: string;
  categoryId?: string | number | null;
  title: string;
  slug?: string | null;
  organizationName: string;
  location?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  applicationUrl?: string | null;
  deadline?: string | null;
  status: OpportunityStatus;
  userId: string;
}

export async function upsertOpportunity(params: UpsertOpportunityParams): Promise<{
  success: boolean;
  opportunity?: Opportunity;
  error?: string;
}> {
  if (!supabase) return { success: false, error: 'Client indisponible.' };

  const finalSlug = (params.slug?.trim() || generateSlug(params.title)).toLowerCase();

  // Normalize categoryId
  let safeCategoryId: string | number | null = null;
  if (params.categoryId !== null && params.categoryId !== undefined && params.categoryId !== '') {
    const num = Number(params.categoryId);
    safeCategoryId = Number.isFinite(num) ? num : String(params.categoryId);
  }

  try {
    if (params.id) {
      // UPDATE
      const updateData: Record<string, unknown> = {
        category_id: safeCategoryId,
        title: params.title.trim(),
        slug: finalSlug,
        organization_name: params.organizationName.trim(),
        location: params.location?.trim() || null,
        short_description: params.shortDescription?.trim() || null,
        description: params.description?.trim() || null,
        application_url: params.applicationUrl?.trim() || null,
        deadline: params.deadline || null,
        status: params.status,
        updated_at: new Date().toISOString(),
      };

      if (params.imageUrl !== undefined) {
        updateData.image_url = params.imageUrl;
      }

      const { data, error } = await supabase
        .from('opportunities')
        .update(updateData)
        .eq('id', params.id)
        .select(`
          *,
          opportunity_categories ( id, name, slug )
        `)
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'Une opportunité avec ce slug existe déjà.' };
        }
        return { success: false, error: error.message };
      }

      return { success: true, opportunity: data as Opportunity };
    } else {
      // INSERT
      const { data, error } = await supabase
        .from('opportunities')
        .insert({
          category_id: safeCategoryId,
          title: params.title.trim(),
          slug: finalSlug,
          organization_name: params.organizationName.trim(),
          location: params.location?.trim() || null,
          short_description: params.shortDescription?.trim() || null,
          description: params.description?.trim() || null,
          image_url: params.imageUrl || null,
          application_url: params.applicationUrl?.trim() || null,
          deadline: params.deadline || null,
          status: params.status,
          created_by: params.userId,
        })
        .select(`
          *,
          opportunity_categories ( id, name, slug )
        `)
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'Une opportunité avec ce slug existe déjà.' };
        }
        return { success: false, error: error.message };
      }

      return { success: true, opportunity: data as Opportunity };
    }
  } catch (err: unknown) {
    return { success: false, error: 'Erreur inattendue.' };
  }
}

export async function updateOpportunityImageUrl(
  id: string,
  imageUrl: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Client indisponible.' };

  try {
    const { error } = await supabase
      .from('opportunities')
      .update({
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Erreur inattendue.' };
  }
}

export async function deleteOpportunity(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Client indisponible.' };

  try {
    // 1. Fetch current image_url first to clean up storage object
    const { data: opp } = await supabase
      .from('opportunities')
      .select('image_url')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    // 2. Clean up storage image if present
    if (opp?.image_url) {
      deleteOpportunityCoverImage(opp.image_url).catch((err) => {
        console.warn('[DB-Connect Opportunities] Cover cleanup error on delete:', err);
      });
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: 'Erreur inattendue.' };
  }
}

export async function updateOpportunityStatus(
  id: string,
  status: OpportunityStatus
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Client indisponible.' };

  try {
    const { error } = await supabase
      .from('opportunities')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: 'Erreur inattendue.' };
  }
}

// ============================================================================
// APPLICATIONS (CANDIDATURES)
// ============================================================================

/**
 * Check if the current user has already applied to an opportunity.
 */
export async function checkUserApplied(
  opportunityId: string,
  userId: string
): Promise<{ applied: boolean; application?: OpportunityApplication | null }> {
  if (!supabase || !userId || !opportunityId) return { applied: false };

  try {
    const { data, error } = await supabase
      .from('opportunity_applications')
      .select('id, status, created_at')
      .eq('opportunity_id', opportunityId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return { applied: false, application: null };
    }

    return { applied: true, application: data as OpportunityApplication };
  } catch {
    return { applied: false, application: null };
  }
}

export interface SubmitApplicationParams {
  opportunityId: string;
  userId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  coverMessage?: string | null;
}

/**
 * Submits an internal opportunity application.
 * Status is permanently locked to 'submitted' on creation.
 * Double submission is protected both via client-side check and database unique(user_id, opportunity_id) constraint.
 */
export async function submitOpportunityApplication(params: SubmitApplicationParams): Promise<{
  success: boolean;
  application?: OpportunityApplication;
  error?: string;
  alreadyApplied?: boolean;
}> {
  if (!supabase) return { success: false, error: 'Client indisponible.' };

  try {
    const { data, error } = await supabase
      .from('opportunity_applications')
      .insert({
        opportunity_id: params.opportunityId,
        user_id: params.userId,
        full_name: params.fullName.trim(),
        email: params.email?.trim() || null,
        phone: params.phone?.trim() || null,
        cover_message: params.coverMessage?.trim() || null,
        status: 'submitted',
      })
      .select()
      .single();

    if (error) {
      // 23505 is PostgreSQL unique constraint violation on (user_id, opportunity_id)
      if (error.code === '23505') {
        return {
          success: false,
          alreadyApplied: true,
          error: 'Vous avez déjà postulé à cette opportunité.',
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true, application: data as OpportunityApplication };
  } catch (err: unknown) {
    return { success: false, error: 'Erreur inattendue lors de la candidature.' };
  }
}

/**
 * Fetch all applications submitted by the logged-in user.
 */
export async function fetchUserApplications(userId: string): Promise<{
  applications: OpportunityApplication[];
  error?: string;
}> {
  if (!supabase || !userId) return { applications: [] };

  try {
    const { data, error } = await supabase
      .from('opportunity_applications')
      .select(`
        *,
        opportunities (
          id,
          title,
          organization_name,
          location,
          deadline,
          status,
          category_id,
          opportunity_categories ( id, name )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[DB-Connect Applications] User fetch error:', error.message);
      return { applications: [], error: 'Impossible de charger vos candidatures.' };
    }

    return { applications: (data as OpportunityApplication[]) || [] };
  } catch (err: unknown) {
    return { applications: [], error: 'Erreur inattendue.' };
  }
}

/**
 * Allows a candidate to withdraw their pending application.
 * Only permitted if status is not 'accepted', 'rejected', or 'withdrawn'.
 */
export async function withdrawApplication(
  applicationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !userId) return { success: false, error: 'Client indisponible.' };

  try {
    // Check current status before withdrawing
    const { data: current, error: checkErr } = await supabase
      .from('opportunity_applications')
      .select('status')
      .eq('id', applicationId)
      .eq('user_id', userId)
      .single();

    if (checkErr || !current) {
      return { success: false, error: 'Candidature introuvable.' };
    }

    if (['accepted', 'rejected', 'withdrawn'].includes(current.status)) {
      return {
        success: false,
        error: 'Cette candidature ne peut plus être retirée compte tenu de son statut actuel.',
      };
    }

    const { error } = await supabase
      .from('opportunity_applications')
      .update({
        status: 'withdrawn',
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: 'Erreur inattendue.' };
  }
}

/**
 * Fetch all applications for admin view (editor / super_admin).
 */
export async function fetchAdminApplications(): Promise<{
  applications: OpportunityApplication[];
  error?: string;
}> {
  if (!supabase) return { applications: [] };

  try {
    const { data, error } = await supabase
      .from('opportunity_applications')
      .select(`
        *,
        opportunities (
          id,
          title,
          organization_name,
          location,
          deadline,
          status,
          opportunity_categories ( id, name )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[DB-Connect Applications Admin] Fetch error:', error.message);
      return { applications: [], error: 'Impossible de charger les candidatures.' };
    }

    return { applications: (data as OpportunityApplication[]) || [] };
  } catch (err: unknown) {
    return { applications: [], error: 'Erreur inattendue.' };
  }
}

/**
 * Updates application status by an administrator (editor / super_admin).
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Client indisponible.' };

  try {
    const { error } = await supabase
      .from('opportunity_applications')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: 'Erreur inattendue.' };
  }
}
