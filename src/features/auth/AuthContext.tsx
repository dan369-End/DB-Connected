import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { UserProfile, UserRoleName } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  roles: UserRoleName[];
  primaryRole: UserRoleName | 'user';
  isLoading: boolean;
  isProfileLoading: boolean;
  isConfigured: boolean;
  sessionError: string | null;
  hasRole: (role: UserRoleName) => boolean;
  hasAnyRole: (roles: UserRoleName[]) => boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRoleName[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Guards against concurrent / stale fetches and infinite reload loops
  const activeUserIdRef = useRef<string | null>(null);
  const isRefreshingSessionRef = useRef<boolean>(false);
  const hasAttemptedRescueRef = useRef<boolean>(false);

  /**
   * Fetch user profile from public.profiles and roles from public.user_roles + public.roles
   * Strictly adheres to Row Level Security policies.
   * Does NOT use auth metadata for authorization.
   */
  const fetchUserData = useCallback(async (userId: string) => {
    if (!supabase) return;
    activeUserIdRef.current = userId;
    setIsProfileLoading(true);

    try {
      // 1. Query public.profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        const msg = profileError.message.toLowerCase();
        // If JWT expired during profile read, handle cleanly without noisy warnings
        if (msg.includes('jwt expired') || msg.includes('token is expired')) {
          console.warn('[DB-Connect Auth] Profile query detected expired JWT; session renewal in progress.');
        } else {
          console.warn('[DB-Connect Auth] Note on profiles lookup:', profileError.message);
        }
      } else if (profileData && activeUserIdRef.current === userId) {
        setProfile(profileData as UserProfile);
      }

      // 2. Query public.user_roles joining public.roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', userId);

      if (activeUserIdRef.current !== userId) return;

      if (!rolesError && Array.isArray(rolesData) && rolesData.length > 0) {
        const extractedRoles: UserRoleName[] = [];
        for (const item of rolesData) {
          const roleEntry = (item as unknown as { roles?: { name?: string } | Array<{ name?: string }> }).roles;
          if (Array.isArray(roleEntry)) {
            for (const r of roleEntry) {
              if (r?.name) extractedRoles.push(r.name as UserRoleName);
            }
          } else if (roleEntry?.name) {
            extractedRoles.push(roleEntry.name as UserRoleName);
          }
        }

        if (extractedRoles.length > 0) {
          setRoles(extractedRoles);
        } else {
          setRoles(['user']);
        }
      } else {
        setRoles(['user']);
      }
    } catch (err) {
      console.warn('[DB-Connect Auth] Error loading user database permissions:', err);
      if (activeUserIdRef.current === userId) {
        setRoles(['user']);
      }
    } finally {
      if (activeUserIdRef.current === userId) {
        setIsProfileLoading(false);
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchUserData(user.id);
    }
  }, [user?.id, fetchUserData]);

  /**
   * Safe sign-out that clears all local authentication and role states.
   */
  const performCleanSignOut = useCallback(async (errorReason?: string) => {
    activeUserIdRef.current = null;
    setSession(null);
    setUser(null);
    setProfile(null);
    setRoles([]);
    setIsProfileLoading(false);
    setIsLoading(false);
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem('dbconnect_return_to');
      } catch {
        // Ignore storage exceptions
      }
      if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/');
      }
    }
    if (errorReason) {
      setSessionError(errorReason);
    }
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore network failure on signout
      }
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    const client = supabase;
    let isMounted = true;

    /**
     * Initial Session Retrieval with Single-Attempt Rescue:
     * If the session is present but the token is already expired or corrupted,
     * attempt a single supabase.auth.refreshSession().
     */
    const initSession = async () => {
      try {
        const { data, error } = await client.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.warn('[DB-Connect Auth] Error getting session:', error.message);
          // If token error and hasn't rescued yet, try once
          if (!hasAttemptedRescueRef.current) {
            hasAttemptedRescueRef.current = true;
            const { data: refreshData, error: refreshError } = await client.auth.refreshSession();
            if (refreshError || !refreshData.session) {
              await performCleanSignOut('Votre session a expiré. Veuillez vous reconnecter.');
              return;
            }
            if (isMounted) {
              setSession(refreshData.session);
              setUser(refreshData.session.user);
              await fetchUserData(refreshData.session.user.id);
              setIsLoading(false);
            }
            return;
          }
          await performCleanSignOut();
          return;
        }

        const initialSession = data?.session;
        if (!initialSession) {
          if (isMounted) {
            setSession(null);
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        // Check if access token is already expired
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const expiresAt = initialSession.expires_at ?? 0;
        const isExpired = expiresAt > 0 && expiresAt <= nowInSeconds;

        if (isExpired && !hasAttemptedRescueRef.current) {
          hasAttemptedRescueRef.current = true;
          isRefreshingSessionRef.current = true;
          const { data: refreshData, error: refreshError } = await client.auth.refreshSession();
          isRefreshingSessionRef.current = false;

          if (refreshError || !refreshData.session) {
            console.warn('[DB-Connect Auth] Refresh token expired or rejected. Signing out.');
            await performCleanSignOut('Votre session a expiré. Veuillez vous reconnecter.');
            return;
          }

          if (isMounted) {
            setSession(refreshData.session);
            setUser(refreshData.session.user);
            await fetchUserData(refreshData.session.user.id);
            setIsLoading(false);
          }
          return;
        }

        // Valid active session
        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchUserData(initialSession.user.id);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('[DB-Connect Auth] Unexpected session initialization error:', err);
        if (isMounted) {
          await performCleanSignOut();
        }
      }
    };

    initSession();

    /**
     * Auth Event Listener:
     * Handles INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED.
     * Guaranteed single subscription, cleaned up on unmount.
     */
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        if (!isMounted) return;

        // Synchronize React session state with the fresh session token
        setSession(newSession);
        setUser(newSession?.user ?? null);

        switch (event) {
          case 'SIGNED_OUT':
            activeUserIdRef.current = null;
            setProfile(null);
            setRoles([]);
            setIsProfileLoading(false);
            setIsLoading(false);
            if (typeof window !== 'undefined') {
              try {
                window.sessionStorage.removeItem('dbconnect_return_to');
              } catch {
                // Ignore storage exceptions
              }
              if (window.location.pathname !== '/') {
                window.history.pushState({}, '', '/');
              }
            }
            break;

          case 'PASSWORD_RECOVERY':
            if (newSession?.user) {
              setSessionError(null);
              setIsLoading(false);
            }
            break;

          case 'TOKEN_REFRESHED':
            // TOKEN_REFRESHED: supabase-js has updated the internal JWT.
            // Update React state seamlessly without triggering an unnecessary full profile reload loop.
            if (newSession?.user) {
              setSessionError(null);
              // Only load profile if not already loaded for this user
              if (!profile || activeUserIdRef.current !== newSession.user.id) {
                await fetchUserData(newSession.user.id);
              }
              setIsLoading(false);
            }
            break;

          case 'SIGNED_IN':
          case 'USER_UPDATED':
          case 'INITIAL_SESSION':
            if (newSession?.user) {
              setSessionError(null);
              // If user switched or roles/profile missing, fetch them
              if (activeUserIdRef.current !== newSession.user.id || !profile) {
                await fetchUserData(newSession.user.id);
              }
              setIsLoading(false);
            } else {
              setIsLoading(false);
            }
            break;

          default:
            setIsLoading(false);
            break;
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData, performCleanSignOut]);

  // Sign In strictly with Supabase Auth
  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase n\'est pas encore configuré avec les variables d\'environnement.') };
    }
    setSessionError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      return { error };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  // Sign Up strictly with Supabase Auth
  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase n\'est pas encore configuré avec les variables d\'environnement.') };
    }
    setSessionError(null);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      return { error };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  // Reset password for email
  const resetPasswordForEmail = async (email: string) => {
    if (!supabase) {
      return { error: new Error('Supabase n\'est pas encore configuré avec les variables d\'environnement.') };
    }
    setSessionError(null);
    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });
      return { error };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  // Update password
  const updatePassword = async (password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase n\'est pas encore configuré avec les variables d\'environnement.') };
    }
    setSessionError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  // Sign Out
  const signOut = async () => {
    await performCleanSignOut();
  };

  const primaryRole: UserRoleName | 'user' = roles.length > 0 ? roles[0] : 'user';

  const hasRole = useCallback((role: UserRoleName): boolean => {
    return roles.includes(role);
  }, [roles]);

  const hasAnyRole = useCallback((checkRoles: UserRoleName[]): boolean => {
    return roles.some((r) => checkRoles.includes(r));
  }, [roles]);

  const value = {
    user,
    session,
    profile,
    roles,
    primaryRole,
    isLoading,
    isProfileLoading,
    isConfigured: isSupabaseConfigured,
    sessionError,
    hasRole,
    hasAnyRole,
    signIn,
    signUp,
    resetPasswordForEmail,
    updatePassword,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
