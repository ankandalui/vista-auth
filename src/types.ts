/**
 * Vista Auth - Core Types
 * Type definitions for authentication system
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  roles?: string[];
  permissions?: string[];
  metadata?: Record<string, any>;
}

export interface Session {
  sessionId: string;
  userId: string;
  user: User;
  expiresAt: number;
  createdAt: number;
  lastActivity: number;
}

export interface AuthConfig {
  // Session configuration
  sessionDuration?: number; // milliseconds, default 7 days
  sessionStorage?: "localStorage" | "sessionStorage" | "cookie" | "indexedDB";
  sessionSyncEnabled?: boolean; // WebSocket sync for real-time apps

  // Security
  bcryptRounds?: number; // default 10
  jwtSecret?: string;
  jwtExpiresIn?: string; // default '7d'

  // Database adapter (optional)
  database?: DatabaseAdapter;

  // Offline support
  offlineFallback?: boolean;
  offlineStorage?: "indexedDB";

  // UI helpers
  toastEnabled?: boolean;
  errorMessagesEnabled?: boolean;

  // WebSocket for real-time session sync
  websocketUrl?: string;

  // Custom callbacks
  onSignIn?: (user: User) => void | Promise<void>;
  onSignOut?: () => void | Promise<void>;
  onSessionExpired?: () => void | Promise<void>;
  onError?: (error: AuthError) => void;
}

export interface DatabaseAdapter {
  // User operations
  findUserByEmail: (email: string) => Promise<User | null>;
  findUserById: (id: string) => Promise<User | null>;
  createUser: (data: Partial<User>) => Promise<User>;
  updateUser: (id: string, data: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;

  // Session operations (optional - can use localStorage instead)
  createSession?: (userId: string, sessionData: any) => Promise<Session>;
  getSession?: (sessionId: string) => Promise<Session | null>;
  deleteSession?: (sessionId: string) => Promise<void>;
  deleteUserSessions?: (userId: string) => Promise<void>;
}

export interface AuthError {
  code: string;
  message: string;
  statusCode?: number;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name?: string;
  metadata?: Record<string, any>;
}

export interface AuthResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AuthError;
}

export interface RouteGuardConfig {
  roles?: string[];
  permissions?: string[];
  requireAll?: boolean; // If true, user must have ALL roles/permissions
  redirect?: string;
  onUnauthorized?: () => void;
}

export interface MiddlewareConfig {
  publicPaths?: string[];
  protectedPaths?: string[];
  roleBasedPaths?: Record<string, string[]>; // path pattern -> required roles
  onUnauthorized?: (path: string) => Response | void;
}
