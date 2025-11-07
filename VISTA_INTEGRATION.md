# Using Vista Auth with Vista Framework

## Overview

`vista-auth` is now a **standalone package** that works with **any React framework**, including the Vista framework. It can be used independently or integrated into Vista projects.

## Installation

```bash
npm install vista-auth
```

## Integration with Vista Framework

### Option 1: Standalone Vista Auth (Recommended)

Use Vista Auth as an independent authentication solution:

```tsx
// app/layout.tsx (Vista framework)
import { AuthProvider } from "vista-auth/client";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <AuthProvider apiEndpoint="/api/auth">{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### Option 2: Vista Framework Integration

Vista framework can also include Vista Auth as a built-in feature:

```tsx
// packages/vista-core/src/auth/index.ts
export { useAuth, AuthProvider } from "vista-auth/client";
export { ProtectedRoute } from "vista-auth/guards";
export { createVistaAuth } from "vista-auth/server";
```

Then Vista users can import from `vista/auth`:

```tsx
import { useAuth, AuthProvider } from "vista/auth";
```

## Setup for Vista Projects

### 1. Quick Setup with CLI

```bash
npx vista-auth init
```

This creates:

- `vista-auth.config.ts` - Server configuration
- `app/api/auth/[...vistaauth]/route.ts` - API endpoints
- `app/providers.tsx` - Client provider
- Example components

### 2. Manual Setup

#### Server Config

```ts
// vista-auth.config.ts
import { createVistaAuth } from "vista-auth/server";
import { createPrismaAdapter } from "vista-auth/database";
import { prisma } from "./lib/prisma";

export const auth = createVistaAuth({
  database: createPrismaAdapter(prisma),
  jwtSecret: process.env.VISTA_AUTH_SECRET,
  sessionDuration: 7 * 24 * 60 * 60 * 1000,
  toastEnabled: true,
  sessionSyncEnabled: true,
});
```

#### API Routes

```ts
// app/api/auth/[...vistaauth]/route.ts
import { auth } from "@/vista-auth.config";

export async function POST(request: Request) {
  const body = await request.json();
  const pathname = new URL(request.url).pathname;

  if (pathname.includes("/signin")) {
    return Response.json(await auth.signIn(body));
  }

  if (pathname.includes("/signup")) {
    return Response.json(await auth.signUp(body));
  }

  if (pathname.includes("/signout")) {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const payload = auth.verifyToken(token);
    return Response.json(await auth.signOut(payload.sessionId));
  }

  return Response.json({ error: "Invalid endpoint" }, { status: 404 });
}

export async function GET(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  return Response.json(await auth.getSession(token));
}
```

#### Client Provider

```tsx
// app/providers.tsx
"use client";

import { AuthProvider } from "vista-auth/client";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider
      apiEndpoint="/api/auth"
      config={{
        sessionSyncEnabled: true,
        toastEnabled: true,
        sessionStorage: "localStorage",
      }}
    >
      {children}
    </AuthProvider>
  );
}
```

```tsx
// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## Usage Examples

### Login Page

```tsx
// app/login/page.tsx
"use client";

import { useAuth } from "vista-auth/client";
import { useState } from "react";

export default function LoginPage() {
  const { signIn, signUp, isAuthenticated, user } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);

  if (isAuthenticated) {
    return <div>Welcome, {user?.name}!</div>;
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const credentials = {
          email: formData.get("email") as string,
          password: formData.get("password") as string,
          name: formData.get("name") as string,
        };

        if (isSignUp) {
          await signUp(credentials);
        } else {
          await signIn(credentials);
        }
      }}
    >
      <h1>{isSignUp ? "Sign Up" : "Sign In"}</h1>

      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      {isSignUp && <input name="name" placeholder="Name" />}

      <button type="submit">{isSignUp ? "Sign Up" : "Sign In"}</button>
      <button type="button" onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? "Have an account? Sign In" : "Need an account? Sign Up"}
      </button>
    </form>
  );
}
```

### Protected Dashboard

```tsx
// app/dashboard/page.tsx
"use client";

import { ProtectedRoute } from "vista-auth/guards";
import { useAuth } from "vista-auth/client";

export default function DashboardPage() {
  const { user, signOut } = useAuth();

  return (
    <ProtectedRoute redirect="/login">
      <div>
        <h1>Dashboard</h1>
        <p>Welcome, {user?.name}!</p>
        <button onClick={signOut}>Sign Out</button>
      </div>
    </ProtectedRoute>
  );
}
```

### Admin-Only Page

```tsx
// app/admin/page.tsx
"use client";

import { ProtectedRoute } from "vista-auth/guards";
import { useAuth } from "vista-auth/client";

export default function AdminPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute
      roles={["admin"]}
      redirect="/login"
      fallback={<div>Access Denied - Admin Only</div>}
    >
      <div>
        <h1>Admin Dashboard</h1>
        <p>Welcome, Admin {user?.name}!</p>
      </div>
    </ProtectedRoute>
  );
}
```

### Middleware Protection

```ts
// middleware.ts (Vista framework)
import { createNextMiddleware } from "vista-auth/middleware";

export default createNextMiddleware({
  publicPaths: ["/", "/login", "/signup"],
  protectedPaths: ["/dashboard", "/profile"],
  roleBasedPaths: {
    "/admin/*": ["admin"],
    "/moderator/*": ["admin", "moderator"],
  },
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

## Database Setup

### Prisma Example

```prisma
// prisma/schema.prisma
model User {
  id          String    @id @default(cuid())
  email       String    @unique
  name        String?
  roles       String[]  @default(["user"])
  permissions String[]  @default([])
  metadata    Json?
  sessions    Session[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Session {
  id        String   @id
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  data      Json
  createdAt DateTime @default(now())
}
```

```ts
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

```ts
// vista-auth.config.ts
import { createVistaAuth } from "vista-auth/server";
import { createPrismaAdapter } from "vista-auth/database";
import { prisma } from "./lib/prisma";

export const auth = createVistaAuth({
  database: createPrismaAdapter(prisma),
  jwtSecret: process.env.VISTA_AUTH_SECRET,
});
```

## Benefits of Using Vista Auth with Vista

1. **Seamless Integration** - Works perfectly with Vista's architecture
2. **Type Safety** - Full TypeScript support throughout
3. **Performance** - Optimized for Vista's build system
4. **Consistency** - Matches Vista's API design patterns
5. **Flexibility** - Can be used standalone or integrated
6. **No Vendor Lock-in** - Works with any database, any framework

## Migrating from Vista Framework Auth to Standalone Vista Auth

If you previously used Vista framework's built-in auth, migration is simple:

### Before (Vista Framework Auth)

```tsx
import { useAuth } from "vista/auth";
```

### After (Standalone Vista Auth)

```tsx
import { useAuth } from "vista-auth/client";
```

Everything else remains the same! The API is identical.

## Comparison: Vista Framework vs Standalone

| Aspect           | Vista Framework (Built-in) | Vista Auth (Standalone)                  |
| ---------------- | -------------------------- | ---------------------------------------- |
| **Installation** | Included with Vista        | `npm install vista-auth`                 |
| **Updates**      | With Vista releases        | Independent versioning                   |
| **Flexibility**  | Vista-specific             | Works with any framework                 |
| **Features**     | Core auth only             | Full feature set (RBAC, WebSocket, etc.) |
| **Bundle**       | Part of Vista core         | Separate, tree-shakeable                 |
| **Use Case**     | Vista-only projects        | Multi-framework projects                 |

## Recommendation

- **Use Vista Framework Auth** if you only need basic auth in Vista projects
- **Use Standalone Vista Auth** if you need:
  - Advanced features (RBAC, real-time sync, offline)
  - Multi-framework support
  - Independent version control
  - Smaller, focused bundle

## Example Project Structure

```
my-vista-app/
├── app/
│   ├── layout.tsx              # Wrap with AuthProvider
│   ├── providers.tsx           # Auth provider setup
│   ├── page.tsx                # Public home page
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── dashboard/
│   │   └── page.tsx            # Protected dashboard
│   ├── admin/
│   │   └── page.tsx            # Admin-only page
│   └── api/
│       └── auth/
│           └── [...vistaauth]/
│               └── route.ts    # Auth API endpoints
├── lib/
│   ├── prisma.ts               # Prisma client
│   └── db.ts                   # Database helpers
├── middleware.ts               # Auth middleware
├── vista-auth.config.ts        # Auth configuration
├── vista.config.ts             # Vista configuration
├── package.json
└── prisma/
    └── schema.prisma           # Database schema
```

## Environment Variables

```env
# .env.local
VISTA_AUTH_SECRET=your-super-secret-jwt-key-change-in-production
DATABASE_URL=your-database-connection-string
```

## Best Practices

1. **Always set VISTA_AUTH_SECRET** in production
2. **Use role-based guards** for sensitive pages
3. **Enable WebSocket sync** for multi-tab support
4. **Use IndexedDB** for offline support
5. **Configure session duration** based on your needs
6. **Add rate limiting** on auth endpoints
7. **Use HTTPS** in production
8. **Rotate secrets** periodically

## Support

- **Documentation**: [README.md](./README.md)
- **Features**: [FEATURES.md](./FEATURES.md)
- **Examples**: See `examples/` folder
- **Issues**: GitHub Issues

---

**Vista Auth works beautifully with Vista framework while remaining framework-agnostic!** 🚀
