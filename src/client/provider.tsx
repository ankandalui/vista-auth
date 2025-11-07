/**
 * Vista Auth - Client Hooks
 * React hooks for authentication
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User, Session, AuthConfig, SignInCredentials, SignUpData } from '../types';
import { SessionStorage } from './storage';
import { WebSocketSync } from './websocket';
import { showToast, showError } from '../ui/toast';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (credentials: SignInCredentials) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
  config?: AuthConfig;
  apiEndpoint?: string; // e.g., '/api/auth' or 'https://api.example.com/auth'
}

export function AuthProvider({ children, config = {}, apiEndpoint = '/api/auth' }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const storage = new SessionStorage(config);
  const wsSync = config.sessionSyncEnabled ? new WebSocketSync(config.websocketUrl) : null;

  // Initialize session from storage
  useEffect(() => {
    const initSession = async () => {
      try {
        const token = storage.getToken();
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Verify session with server
        const response = await fetch(`${apiEndpoint}/session`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSession(data.session);
          setUser(data.session.user);
          
          // Start WebSocket sync if enabled
          if (wsSync) {
            wsSync.connect(token);
            wsSync.onSessionUpdate((updatedSession) => {
              setSession(updatedSession);
              setUser(updatedSession.user);
            });
          }
        } else {
          // Invalid session, clear storage
          storage.clearToken();
        }
      } catch (error) {
        console.error('[Vista Auth] Session initialization failed:', error);
        storage.clearToken();
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    return () => {
      wsSync?.disconnect();
    };
  }, []);

  // Session expiry check
  useEffect(() => {
    if (!session) return;

    const checkExpiry = () => {
      if (Date.now() >= session.expiresAt) {
        signOut();
        config.onSessionExpired?.();
        if (config.errorMessagesEnabled !== false) {
          showError('Session expired. Please sign in again.');
        }
      }
    };

    const interval = setInterval(checkExpiry, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [session]);

  const signIn = useCallback(async (credentials: SignInCredentials) => {
    try {
      const response = await fetch(`${apiEndpoint}/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success) {
        storage.setToken(data.data.token);
        setSession(data.data.session);
        setUser(data.data.user);
        
        config.onSignIn?.(data.data.user);
        
        if (config.toastEnabled !== false) {
          showToast(`Welcome back, ${data.data.user.name || data.data.user.email}!`);
        }

        // Start WebSocket sync if enabled
        if (wsSync) {
          wsSync.connect(data.data.token);
          wsSync.onSessionUpdate((updatedSession) => {
            setSession(updatedSession);
            setUser(updatedSession.user);
          });
        }

        return { success: true };
      } else {
        const errorMessage = data.error?.message || 'Sign in failed';
        if (config.errorMessagesEnabled !== false) {
          showError(errorMessage);
        }
        return { success: false, error: errorMessage };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Network error';
      config.onError?.({ code: 'NETWORK_ERROR', message: errorMessage });
      if (config.errorMessagesEnabled !== false) {
        showError(errorMessage);
      }
      return { success: false, error: errorMessage };
    }
  }, [apiEndpoint, config]);

  const signUp = useCallback(async (data: SignUpData) => {
    try {
      const response = await fetch(`${apiEndpoint}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        storage.setToken(result.data.token);
        setSession(result.data.session);
        setUser(result.data.user);
        
        config.onSignIn?.(result.data.user);
        
        if (config.toastEnabled !== false) {
          showToast(`Welcome, ${result.data.user.name || result.data.user.email}!`);
        }

        // Start WebSocket sync if enabled
        if (wsSync) {
          wsSync.connect(result.data.token);
          wsSync.onSessionUpdate((updatedSession) => {
            setSession(updatedSession);
            setUser(updatedSession.user);
          });
        }

        return { success: true };
      } else {
        const errorMessage = result.error?.message || 'Sign up failed';
        if (config.errorMessagesEnabled !== false) {
          showError(errorMessage);
        }
        return { success: false, error: errorMessage };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Network error';
      config.onError?.({ code: 'NETWORK_ERROR', message: errorMessage });
      if (config.errorMessagesEnabled !== false) {
        showError(errorMessage);
      }
      return { success: false, error: errorMessage };
    }
  }, [apiEndpoint, config]);

  const signOut = useCallback(async () => {
    try {
      const token = storage.getToken();
      if (token && session) {
        await fetch(`${apiEndpoint}/signout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('[Vista Auth] Sign out request failed:', error);
    } finally {
      storage.clearToken();
      setUser(null);
      setSession(null);
      wsSync?.disconnect();
      config.onSignOut?.();
      
      if (config.toastEnabled !== false) {
        showToast('Signed out successfully');
      }
    }
  }, [apiEndpoint, session, config]);

  const updateUser = useCallback((data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    if (session) {
      setSession({ ...session, user: updatedUser });
    }
  }, [user, session]);

  const hasRole = useCallback((role: string) => {
    return user?.roles?.includes(role) ?? false;
  }, [user]);

  const hasPermission = useCallback((permission: string) => {
    return user?.permissions?.includes(permission) ?? false;
  }, [user]);

  const hasAnyRole = useCallback((roles: string[]) => {
    return roles.some(role => user?.roles?.includes(role)) ?? false;
  }, [user]);

  const hasAllRoles = useCallback((roles: string[]) => {
    return roles.every(role => user?.roles?.includes(role)) ?? false;
  }, [user]);

  const value: AuthContextValue = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    updateUser,
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAllRoles,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
