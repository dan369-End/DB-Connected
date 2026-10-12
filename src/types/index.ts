/**
 * Global Application Type Definitions
 * DB-Connect — "Votre passerelle vers le numérique."
 */

export type UserRoleName =
  | 'super_admin'
  | 'editor'
  | 'academy_admin'
  | 'marketplace_admin'
  | 'services_admin'
  | 'user';

export interface UserRole {
  id: string;
  name: UserRoleName;
  description?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  city?: string | null;
  bio?: string | null;
  company?: string | null;
  job_title?: string | null;
  website?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  features: string[];
  ctaText: string;
  category: 'web' | 'mobile' | 'cloud' | 'training' | 'consulting';
  priceStartingAt?: string;
}

export interface StatMetric {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface NavItemConfig {
  id: string;
  label: string;
  path: string;
  icon: string;
  description?: string;
}

export type DashboardRoute =
  | 'home'
  | 'login'
  | 'register'
  | 'forgot_password'
  | 'reset_password'
  | 'academy'
  | 'academy_course'
  | 'academy_player'
  | 'academy_admin'
  | 'marketplace'
  | 'marketplace_product'
  | 'marketplace_cart'
  | 'marketplace_checkout'
  | 'marketplace_orders'
  | 'marketplace_order_detail'
  | 'marketplace_admin'
  | 'services'
  | 'services_detail'
  | 'services_requests'
  | 'services_admin'
  | 'opportunities'
  | 'opportunities_detail'
  | 'opportunities_applications'
  | 'opportunities_admin'
  | 'requests'
  | 'request_detail'
  | 'requests_admin'
  | 'admin'
  | 'community'
  | 'profile'
  | 'admin_settings';

/**
 * Super Admin Management Types
 */
export interface AdminUserRecord {
  id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  created_at?: string | null;
  roles: UserRoleName[];
}

export interface AdminGlobalStats {
  users: {
    total: number;
    superAdmins: number;
    moduleAdmins: number;
    standardUsers: number;
  };
  academy: {
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    totalEnrollments: number;
  };
  marketplace: {
    totalProducts: number;
    publishedProducts: number;
    pendingOrders: number;
    deliveredOrders: number;
    totalOrders: number;
  };
  services: {
    totalServices: number;
    publishedServices: number;
    pendingRequests: number;
    totalRequests: number;
  };
  opportunities: {
    totalOpportunities: number;
    publishedOpportunities: number;
    totalApplications: number;
  };
  requests: {
    totalRequests: number;
    newRequests: number;
    inReviewRequests: number;
    quotedRequests: number;
    closedRequests: number;
  };
}

/**
 * Contact and Quote Requests (public.contact_requests)
 */
export type ContactRequestType = 'contact' | 'quote';
export type ContactRequestSource = 'general' | 'service' | 'academy';
export type ContactRequestStatus =
  | 'new'
  | 'in_review'
  | 'quoted'
  | 'accepted'
  | 'rejected'
  | 'closed';

export interface ContactRequest {
  id: string;
  user_id: string;
  request_type: ContactRequestType;
  source_type: ContactRequestSource;
  service_id?: string | null;
  course_id?: string | null;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  subject?: string | null;
  message: string;
  budget?: string | null;
  preferred_date?: string | null;
  status: ContactRequestStatus;
  admin_response?: string | null;
  created_at?: string;
  updated_at?: string;
  academy_courses?: { id: string; title: string } | null;
  services?: { id: string; title: string } | null;
}

/**
 * Supabase Academy Database Types
 */
export type CourseStatus = 'draft' | 'published' | 'archived';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type AcademyDeliveryMode = 'external' | 'dbconnect';
export type AcademyEnrollmentStatus = 'pending_payment' | 'enrolled' | 'cancelled';
export type AcademyPaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface AcademyPaymentRequest {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_reference: string;
  participant_phone: string;
  participant_whatsapp?: string | null;
  status: AcademyPaymentStatus;
  admin_note?: string | null;
  created_at: string;
  updated_at?: string;
  academy_courses?: {
    id: string;
    title: string;
    price?: number | null;
    currency?: string | null;
    thumbnail_url?: string | null;
    delivery_mode?: AcademyDeliveryMode;
  } | null;
  user_profile?: {
    id: string;
    full_name?: string | null;
    avatar_url?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
  } | null;
}

export interface AcademyCategory {
  id: string | number;
  name: string;
  slug?: string | null;
  description?: string | null;
  created_at?: string;
}

export interface AcademyCourse {
  id: string;
  category_id?: number | string | null;
  title: string;
  slug?: string | null;
  short_description?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  level: CourseLevel;
  duration_minutes: number;
  status: CourseStatus;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  category?: AcademyCategory | null;
  academy_categories?: AcademyCategory | null;
  modules?: AcademyModule[];
  // Pricing & Delivery Fields
  is_paid?: boolean;
  price?: number | null;
  currency?: string | null;
  delivery_mode?: AcademyDeliveryMode;
  external_platform?: string | null;
  external_link?: string | null;
  organizer_contact_phone?: string | null;
  access_instructions?: string | null;
}

export interface AcademyModule {
  id: string;
  course_id: string;
  title: string;
  description?: string | null;
  position: number;
  created_at?: string;
  lessons?: AcademyLesson[];
}

export interface AcademyLesson {
  id: string;
  module_id: string;
  title: string;
  short_description?: string | null;
  content?: string | null;
  video_url?: string | null;
  position: number;
  resource_url?: string | null;
  resource_name?: string | null;
  resource_type?: string | null;
  resource_size?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface AcademyEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at?: string;
  status?: AcademyEnrollmentStatus | string;
  participant_phone?: string | null;
  participant_whatsapp?: string | null;
  created_at?: string;
  course?: AcademyCourse | null;
}

export interface AcademyLessonProgress {
  id?: string;
  user_id: string;
  lesson_id: string;
  completed?: boolean;
  completed_at?: string | null;
  created_at?: string;
}

/**
 * Supabase Marketplace Database Types
 */
export type ProductStatus = 'draft' | 'published' | 'archived';

export interface MarketplaceCategory {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  created_at?: string;
}

export interface MarketplaceProduct {
  id: string;
  category_id?: string | null;
  name: string;
  slug?: string | null;
  short_description?: string | null;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  stock_quantity?: number | null;
  image_url?: string | null;
  status?: ProductStatus | string;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  category?: MarketplaceCategory | null;
  marketplace_categories?: MarketplaceCategory | null;
}

/**
 * Marketplace Cart Item
 * Note: Price in cart is strictly informative for UI preview.
 * The server RPC calculates official prices from database.
 */
export interface CartItem {
  product_id: string;
  name: string;
  price: number | null;
  currency: string;
  quantity: number;
  image_url?: string | null;
  stock_quantity: number;
}

/**
 * Marketplace Orders & Payment Types
 */
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod =
  | 'cash_on_delivery'
  | 'mobile_money'
  | 'manual_transfer';

export type PaymentStatus =
  | 'unpaid'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';

export interface MarketplaceOrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at?: string;
}

export interface MarketplaceOrder {
  id: string;
  order_number: string;
  user_id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  delivery_address: string;
  notes?: string | null;
  subtotal: number;
  currency?: string | null;
  status: OrderStatus | string;
  payment_method?: PaymentMethod | string | null;
  payment_status?: PaymentStatus | string | null;
  payment_reference?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at?: string;
  items?: MarketplaceOrderItem[];
  marketplace_order_items?: MarketplaceOrderItem[];
}

/**
 * Supabase Services Database Types
 * Tables:
 * - public.services_categories
 * - public.services
 * - public.service_requests
 */

export type ServiceStatus = 'draft' | 'published' | 'archived';

export type ServiceRequestStatus =
  | 'pending'
  | 'contacted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface ServiceCategory {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  created_at?: string;
}

export interface ServiceRecord {
  id: string;
  category_id?: string | null;
  title: string;
  slug?: string | null;
  short_description?: string | null;
  description?: string | null;
  price_from?: number | null;
  currency?: string | null;
  image_url?: string | null;
  status: ServiceStatus | string;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  services_categories?: ServiceCategory | null;
  category?: ServiceCategory | null;
}

export interface ServiceRequestRecord {
  id: string;
  service_id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  message: string;
  preferred_date?: string | null;
  status: ServiceRequestStatus | string;
  created_at: string;
  updated_at?: string;
  services?: ServiceRecord | null;
  service?: ServiceRecord | null;
}

/**
 * Supabase Opportunities Database Types
 */
export type OpportunityStatus = 'draft' | 'published' | 'archived';

export type ApplicationStatus =
  | 'submitted'
  | 'reviewing'
  | 'shortlisted'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface OpportunityCategory {
  id: string | number;
  name: string;
  slug?: string | null;
  description?: string | null;
  created_at?: string;
}

export interface Opportunity {
  id: string;
  category_id?: string | number | null;
  title: string;
  slug?: string | null;
  organization_name: string;
  location?: string | null;
  short_description?: string | null;
  description?: string | null;
  image_url?: string | null;
  application_url?: string | null;
  deadline?: string | null;
  status: OpportunityStatus | string;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  opportunity_categories?: OpportunityCategory | null;
}

export interface OpportunityApplication {
  id: string;
  user_id: string;
  opportunity_id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  cover_message?: string | null;
  status: ApplicationStatus | string;
  created_at: string;
  updated_at?: string;
  opportunities?: Opportunity | null;
}

