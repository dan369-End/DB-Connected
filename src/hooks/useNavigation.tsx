import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { DashboardRoute } from '@/types';

export interface NavigationContextType {
  currentRoute: DashboardRoute;
  routeParams: Record<string, string>;
  navigate: (route: DashboardRoute, params?: Record<string, string>) => void;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  returnTo: string | null;
  setReturnTo: (path: string | null) => void;
  clearReturnTo: () => void;
  resolvePostLoginNavigation: () => void;
  isPrivateRoute: (path?: string) => boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const RETURN_TO_STORAGE_KEY = 'dbconnect_return_to';

/**
 * Sanitizes a redirection target to guarantee it is strictly an internal relative path.
 * Disallows protocol-relative URLs (//), backslashes, external schemes, javascript: or data: URIs.
 */
export function sanitizeReturnTo(path?: string | null): string | null {
  if (!path || typeof path !== 'string') return null;
  const trimmed = path.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return null;
  }
  const lower = trimmed.toLowerCase();
  if (lower.includes('javascript:') || lower.includes('data:') || lower.includes('vbscript:') || lower.startsWith('http:') || lower.startsWith('https:')) {
    return null;
  }
  return trimmed;
}

/**
 * Determines whether a given pathname belongs to a protected private module.
 * Everything except the root landing page ('/') and public auth endpoints is private.
 */
export function isPrivateRoute(pathname?: string): boolean {
  if (!pathname) return false;
  const cleanPath = pathname.split('?')[0].split('#')[0];
  if (cleanPath === '' || cleanPath === '/') return false;
  const publicPaths = [
    '/login',
    '/signin',
    '/register',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ];
  if (publicPaths.includes(cleanPath)) return false;
  return true;
}

const ROUTE_PATH_MAP: Record<string, DashboardRoute> = {
  '/': 'home',
  '/dashboard': 'home',
  '/login': 'login',
  '/signin': 'login',
  '/register': 'register',
  '/signup': 'register',
  '/forgot-password': 'forgot_password',
  '/reset-password': 'reset_password',
  '/academy': 'academy',
  '/academy/admin': 'academy_admin',
  '/marketplace': 'marketplace',
  '/marketplace/cart': 'marketplace_cart',
  '/marketplace/checkout': 'marketplace_checkout',
  '/marketplace/orders': 'marketplace_orders',
  '/marketplace/admin': 'marketplace_admin',
  '/services': 'services',
  '/services/requests': 'services_requests',
  '/services/admin': 'services_admin',
  '/opportunities': 'opportunities',
  '/opportunities/applications': 'opportunities_applications',
  '/opportunities/admin': 'opportunities_admin',
  '/requests': 'requests',
  '/requests/detail': 'request_detail',
  '/admin': 'admin',
  '/admin/requests': 'requests_admin',
  '/community': 'community',
  '/profile': 'profile',
  '/admin/settings': 'admin_settings',
};

const PATH_ROUTE_MAP: Record<DashboardRoute, string> = {
  home: '/',
  login: '/login',
  register: '/register',
  forgot_password: '/forgot-password',
  reset_password: '/reset-password',
  academy: '/academy',
  academy_course: '/academy/course',
  academy_player: '/academy/learn',
  academy_admin: '/academy/admin',
  marketplace: '/marketplace',
  marketplace_product: '/marketplace/product',
  marketplace_cart: '/marketplace/cart',
  marketplace_checkout: '/marketplace/checkout',
  marketplace_orders: '/marketplace/orders',
  marketplace_order_detail: '/marketplace/orders/detail',
  marketplace_admin: '/marketplace/admin',
  services: '/services',
  services_detail: '/services/detail',
  services_requests: '/services/requests',
  services_admin: '/services/admin',
  opportunities: '/opportunities',
  opportunities_detail: '/opportunities/detail',
  opportunities_applications: '/opportunities/applications',
  opportunities_admin: '/opportunities/admin',
  requests: '/requests',
  request_detail: '/requests/detail',
  requests_admin: '/admin/requests',
  admin: '/admin',
  community: '/community',
  profile: '/profile',
  admin_settings: '/admin/settings',
};

/**
 * Parses any relative path and query string into DashboardRoute and params.
 */
export function parsePath(fullUrlOrPath: string): { route: DashboardRoute; params: Record<string, string> } {
  let pathname = fullUrlOrPath;
  let search = '';

  const qIdx = fullUrlOrPath.indexOf('?');
  if (qIdx !== -1) {
    pathname = fullUrlOrPath.slice(0, qIdx);
    search = fullUrlOrPath.slice(qIdx);
  }

  const searchParams = new URLSearchParams(search);
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  if (pathname === '/login' || pathname === '/signin') {
    return { route: 'login', params };
  }
  if (pathname === '/register' || pathname === '/signup') {
    return { route: 'register', params };
  }
  if (pathname === '/forgot-password') {
    return { route: 'forgot_password', params };
  }
  if (pathname === '/reset-password') {
    return { route: 'reset_password', params };
  }

  if (pathname.startsWith('/academy/course')) {
    return { route: 'academy_course', params };
  }
  if (pathname.startsWith('/academy/learn')) {
    return { route: 'academy_player', params };
  }
  if (pathname.startsWith('/academy/admin')) {
    return { route: 'academy_admin', params };
  }
  if (pathname.startsWith('/marketplace/cart')) {
    return { route: 'marketplace_cart', params };
  }
  if (pathname.startsWith('/marketplace/checkout')) {
    return { route: 'marketplace_checkout', params };
  }
  if (pathname.startsWith('/marketplace/orders/detail') || pathname.startsWith('/marketplace/orders/')) {
    const parts = pathname.split('/marketplace/orders/');
    if (parts[1] && parts[1] !== 'detail' && parts[1].length > 0) {
      params.orderId = parts[1];
    }
    if (params.orderId) {
      return { route: 'marketplace_order_detail', params };
    }
  }
  if (pathname === '/marketplace/orders') {
    return { route: 'marketplace_orders', params };
  }
  if (pathname.startsWith('/marketplace/product')) {
    return { route: 'marketplace_product', params };
  }
  if (pathname.startsWith('/marketplace/admin')) {
    return { route: 'marketplace_admin', params };
  }

  // Services routes
  if (pathname.startsWith('/services/detail')) {
    return { route: 'services_detail', params };
  }
  if (pathname.startsWith('/services/requests')) {
    return { route: 'services_requests', params };
  }
  if (pathname.startsWith('/services/admin')) {
    return { route: 'services_admin', params };
  }
  if (pathname.startsWith('/services/')) {
    const parts = pathname.split('/services/');
    if (parts[1] && parts[1].length > 0) {
      params.serviceId = parts[1];
      return { route: 'services_detail', params };
    }
  }

  // Opportunities routes
  if (pathname.startsWith('/opportunities/applications')) {
    return { route: 'opportunities_applications', params };
  }
  if (pathname.startsWith('/opportunities/admin')) {
    return { route: 'opportunities_admin', params };
  }
  if (pathname.startsWith('/opportunities/detail')) {
    return { route: 'opportunities_detail', params };
  }
  if (pathname.startsWith('/opportunities/')) {
    const parts = pathname.split('/opportunities/');
    if (parts[1] && parts[1].length > 0) {
      params.opportunityId = parts[1];
      return { route: 'opportunities_detail', params };
    }
  }

  // Super Admin Global route
  if (pathname === '/admin' || pathname === '/admin/') {
    return { route: 'admin', params };
  }

  // Contact & Quote Requests routes
  if (pathname.startsWith('/admin/requests')) {
    return { route: 'requests_admin', params };
  }
  if (pathname.startsWith('/requests/detail')) {
    return { route: 'request_detail', params };
  }
  if (pathname.startsWith('/requests/')) {
    const parts = pathname.split('/requests/');
    if (parts[1] && parts[1].length > 0) {
      params.requestId = parts[1];
      return { route: 'request_detail', params };
    }
  }
  if (pathname === '/requests') {
    return { route: 'requests', params };
  }

  const matched = ROUTE_PATH_MAP[pathname] || 'home';
  return { route: matched, params };
}

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const parseCurrentUrl = useCallback((): { route: DashboardRoute; params: Record<string, string> } => {
    if (typeof window === 'undefined') return { route: 'home', params: {} };
    return parsePath(window.location.pathname + window.location.search);
  }, []);

  const [currentRoute, setCurrentRoute] = useState<DashboardRoute>(() => parseCurrentUrl().route);
  const [routeParams, setRouteParams] = useState<Record<string, string>>(() => parseCurrentUrl().params);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ReturnTo destination memory (sessionStorage backed)
  const [returnTo, setReturnToState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = window.sessionStorage.getItem(RETURN_TO_STORAGE_KEY);
      return sanitizeReturnTo(stored);
    } catch {
      return null;
    }
  });

  const clearReturnTo = useCallback(() => {
    setReturnToState(null);
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(RETURN_TO_STORAGE_KEY);
      } catch {
        // Ignore storage exceptions
      }
    }
  }, []);

  const setReturnTo = useCallback((path: string | null) => {
    const safe = sanitizeReturnTo(path);
    setReturnToState(safe);
    if (typeof window !== 'undefined') {
      try {
        if (safe) {
          window.sessionStorage.setItem(RETURN_TO_STORAGE_KEY, safe);
        } else {
          window.sessionStorage.removeItem(RETURN_TO_STORAGE_KEY);
        }
      } catch {
        // Ignore storage exceptions
      }
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const { route, params } = parseCurrentUrl();
      setCurrentRoute(route);
      setRouteParams(params);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [parseCurrentUrl]);

  const navigate = useCallback((route: DashboardRoute, params?: Record<string, string>) => {
    setCurrentRoute(route);
    setRouteParams(params || {});
    setIsMobileMenuOpen(false);

    let newPath = PATH_ROUTE_MAP[route] || '/';
    if (params && Object.keys(params).length > 0) {
      if (route === 'marketplace_order_detail' && params.orderId) {
        newPath = `/marketplace/orders/${params.orderId}`;
      } else if (route === 'services_detail' && params.serviceId) {
        newPath = `/services/${params.serviceId}`;
      } else if (route === 'opportunities_detail' && params.opportunityId) {
        newPath = `/opportunities/${params.opportunityId}`;
      } else if (route === 'request_detail' && params.requestId) {
        newPath = `/requests/${params.requestId}`;
      } else {
        const search = new URLSearchParams(params).toString();
        newPath = `${newPath}?${search}`;
      }
    }

    if (window.location.pathname + window.location.search !== newPath) {
      window.history.pushState({}, '', newPath);
    }
  }, []);

  /**
   * Resolves post-login redirection.
   * If a safe returnTo destination was remembered (e.g. /marketplace/orders),
   * navigates to it and clears memory. Otherwise defaults to the private dashboard ('home' / '/').
   */
  const resolvePostLoginNavigation = useCallback(() => {
    let target = returnTo;
    if (!target && typeof window !== 'undefined') {
      try {
        target = sanitizeReturnTo(window.sessionStorage.getItem(RETURN_TO_STORAGE_KEY));
      } catch {
        target = null;
      }
    }

    // Clear saved returnTo target
    setReturnTo(null);

    if (target && target !== '/' && target !== '/dashboard') {
      const { route, params } = parsePath(target);
      navigate(route, params);
      if (window.location.pathname + window.location.search !== target) {
        window.history.pushState({}, '', target);
      }
    } else {
      // Default to private dashboard
      navigate('home');
      if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/');
      }
    }
  }, [returnTo, setReturnTo, navigate]);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <NavigationContext.Provider
      value={{
        currentRoute,
        routeParams,
        navigate,
        isMobileMenuOpen,
        toggleMobileMenu,
        closeMobileMenu,
        returnTo,
        setReturnTo,
        clearReturnTo,
        resolvePostLoginNavigation,
        isPrivateRoute,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
