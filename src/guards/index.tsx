/**
 * Vista Auth - Route Guards
 * Role-based route protection for React components
 */

import { useEffect, ComponentType, ReactNode } from "react";
import { useAuth } from "../client/provider";
import type { RouteGuardConfig } from "../types";

export interface ProtectedRouteProps extends RouteGuardConfig {
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

/**
 * Protected Route Component
 * Wraps components that require authentication
 */
export function ProtectedRoute({
  children,
  roles,
  permissions,
  requireAll = false,
  redirect,
  onUnauthorized,
  fallback,
  loadingFallback,
}: ProtectedRouteProps) {
  const {
    isAuthenticated,
    isLoading,
    user,
    hasRole,
    hasPermission,
    hasAllRoles,
    hasAnyRole,
  } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && redirect) {
      window.location.href = redirect;
    }
  }, [isLoading, isAuthenticated, redirect]);

  if (isLoading) {
    return <>{loadingFallback || <div>Loading...</div>}</>;
  }

  if (!isAuthenticated) {
    if (onUnauthorized) {
      onUnauthorized();
    }
    return <>{fallback || <div>Unauthorized</div>}</>;
  }

  // Check roles
  if (roles && roles.length > 0) {
    const hasRequiredRoles = requireAll
      ? hasAllRoles(roles)
      : hasAnyRole(roles);
    if (!hasRequiredRoles) {
      if (onUnauthorized) {
        onUnauthorized();
      }
      return <>{fallback || <div>Insufficient permissions</div>}</>;
    }
  }

  // Check permissions
  if (permissions && permissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? permissions.every((p) => hasPermission(p))
      : permissions.some((p) => hasPermission(p));

    if (!hasRequiredPermissions) {
      if (onUnauthorized) {
        onUnauthorized();
      }
      return <>{fallback || <div>Insufficient permissions</div>}</>;
    }
  }

  return <>{children}</>;
}

/**
 * Higher-order component for protecting routes
 */
export function withAuth<P extends object>(
  Component: ComponentType<P>,
  config?: RouteGuardConfig
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...config}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * Hook for programmatic route guarding
 */
export function useRouteGuard(config: RouteGuardConfig) {
  const {
    isAuthenticated,
    isLoading,
    hasRole,
    hasPermission,
    hasAllRoles,
    hasAnyRole,
  } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      if (config.redirect) {
        window.location.href = config.redirect;
      } else if (config.onUnauthorized) {
        config.onUnauthorized();
      }
      return;
    }

    // Check roles
    if (config.roles && config.roles.length > 0) {
      const hasRequiredRoles = config.requireAll
        ? hasAllRoles(config.roles)
        : hasAnyRole(config.roles);
      if (!hasRequiredRoles) {
        if (config.redirect) {
          window.location.href = config.redirect;
        } else if (config.onUnauthorized) {
          config.onUnauthorized();
        }
      }
    }

    // Check permissions
    if (config.permissions && config.permissions.length > 0) {
      const hasRequiredPermissions = config.requireAll
        ? config.permissions.every((p) => hasPermission(p))
        : config.permissions.some((p) => hasPermission(p));

      if (!hasRequiredPermissions) {
        if (config.redirect) {
          window.location.href = config.redirect;
        } else if (config.onUnauthorized) {
          config.onUnauthorized();
        }
      }
    }
  }, [isLoading, isAuthenticated, config]);
}

/**
 * Utility hooks for common checks
 */
export function useRequireAuth(redirect?: string) {
  useRouteGuard({ redirect });
}

export function useRequireRole(role: string | string[], redirect?: string) {
  const roles = Array.isArray(role) ? role : [role];
  useRouteGuard({ roles, redirect });
}

export function useRequirePermission(
  permission: string | string[],
  redirect?: string
) {
  const permissions = Array.isArray(permission) ? permission : [permission];
  useRouteGuard({ permissions, redirect });
}
