/**
 * Vista Auth - Middleware
 * Framework-agnostic middleware for protecting routes
 */

import type { MiddlewareConfig } from "../types";

/**
 * Next.js Middleware
 */
export function createNextMiddleware(config: MiddlewareConfig = {}) {
  return async function middleware(request: any) {
    const { pathname } = request.nextUrl;

    // Check if path is public
    if (config.publicPaths?.some((path) => matchPath(pathname, path))) {
      return;
    }

    // Get token from cookie or header
    const token =
      request.cookies.get("vista-auth-token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      if (config.onUnauthorized) {
        return config.onUnauthorized(pathname);
      }
      return Response.redirect(new URL("/login", request.url));
    }

    // Verify token (this should call your auth server)
    try {
      const response = await fetch(
        `${request.nextUrl.origin}/api/auth/session`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Invalid session");
      }

      const session = await response.json();

      // Check role-based paths
      if (config.roleBasedPaths) {
        for (const [pattern, requiredRoles] of Object.entries(
          config.roleBasedPaths
        )) {
          if (matchPath(pathname, pattern)) {
            const hasRole = requiredRoles.some((role) =>
              session.user?.roles?.includes(role)
            );
            if (!hasRole) {
              if (config.onUnauthorized) {
                return config.onUnauthorized(pathname);
              }
              return Response.redirect(new URL("/unauthorized", request.url));
            }
          }
        }
      }
    } catch (error) {
      if (config.onUnauthorized) {
        return config.onUnauthorized(pathname);
      }
      return Response.redirect(new URL("/login", request.url));
    }
  };
}

/**
 * Express/Node.js Middleware
 */
export function createExpressMiddleware(config: MiddlewareConfig = {}) {
  return async function middleware(req: any, res: any, next: any) {
    const pathname = req.path;

    // Check if path is public
    if (config.publicPaths?.some((path) => matchPath(pathname, path))) {
      return next();
    }

    // Get token from cookie or header
    const token =
      req.cookies?.["vista-auth-token"] ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      if (config.onUnauthorized) {
        const response = config.onUnauthorized(pathname);
        if (response) return res.status(401).json(response);
      }
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify token
    try {
      // This should be replaced with actual token verification
      const session = await verifyToken(token);

      // Attach user to request
      req.user = session.user;
      req.session = session;

      // Check role-based paths
      if (config.roleBasedPaths) {
        for (const [pattern, requiredRoles] of Object.entries(
          config.roleBasedPaths
        )) {
          if (matchPath(pathname, pattern)) {
            const hasRole = requiredRoles.some((role) =>
              session.user?.roles?.includes(role)
            );
            if (!hasRole) {
              if (config.onUnauthorized) {
                const response = config.onUnauthorized(pathname);
                if (response) return res.status(403).json(response);
              }
              return res.status(403).json({ error: "Forbidden" });
            }
          }
        }
      }

      next();
    } catch (error) {
      if (config.onUnauthorized) {
        const response = config.onUnauthorized(pathname);
        if (response) return res.status(401).json(response);
      }
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}

/**
 * Remix Loader Middleware
 */
export function createRemixLoader(config: MiddlewareConfig = {}) {
  return async function loader({ request }: any) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Check if path is public
    if (config.publicPaths?.some((path) => matchPath(pathname, path))) {
      return null;
    }

    // Get token from cookie or header
    const cookieHeader = request.headers.get("Cookie");
    const token =
      parseCookie(cookieHeader, "vista-auth-token") ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      if (config.onUnauthorized) {
        return config.onUnauthorized(pathname);
      }
      throw new Response("Unauthorized", { status: 401 });
    }

    try {
      const session = await verifyToken(token);

      // Check role-based paths
      if (config.roleBasedPaths) {
        for (const [pattern, requiredRoles] of Object.entries(
          config.roleBasedPaths
        )) {
          if (matchPath(pathname, pattern)) {
            const hasRole = requiredRoles.some((role) =>
              session.user?.roles?.includes(role)
            );
            if (!hasRole) {
              if (config.onUnauthorized) {
                return config.onUnauthorized(pathname);
              }
              throw new Response("Forbidden", { status: 403 });
            }
          }
        }
      }

      return { user: session.user, session };
    } catch (error) {
      if (config.onUnauthorized) {
        return config.onUnauthorized(pathname);
      }
      throw new Response("Unauthorized", { status: 401 });
    }
  };
}

/**
 * Utility functions
 */
function matchPath(pathname: string, pattern: string): boolean {
  // Simple glob pattern matching
  const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
  return regex.test(pathname);
}

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

async function verifyToken(token: string): Promise<any> {
  // This should be replaced with actual token verification logic
  // For now, this is a placeholder
  throw new Error("verifyToken must be implemented by the user");
}

/**
 * Generic middleware factory
 */
export function createMiddleware(config: MiddlewareConfig = {}) {
  return {
    next: createNextMiddleware(config),
    express: createExpressMiddleware(config),
    remix: createRemixLoader(config),
  };
}
