# 🔐 Vista Auth

**Simple, powerful, and secure authentication for React apps** - works with any framework, any database, zero configuration needed.

## ✨ Why Vista Auth?

- 🎯 **150 lines vs 500+** - Minimal code, maximum power
- 🚀 **Works with ANY React framework** - Next.js, Remix, Vite, CRA, Express
- 💾 **Works with ANY database** - Prisma, MongoDB, Supabase, PostgreSQL, Firebase, or none
- 🔒 **Production-ready security** - bcrypt, JWT, secure session management
- 🎨 **Built-in UI helpers** - Toast notifications, error messages
- 🕵️ **Role-based access control** - Route guards, permissions, middleware
- ⚡ **Real-time session sync** - WebSocket support for multi-tab/device
- 📦 **5-minute setup** - CLI auto-configuration
- 🌐 **Offline support** - IndexedDB fallback
- 🔧 **Zero dependencies** - Only bcrypt and JWT

## 📦 Installation

```bash
npm install vista-auth
# or
yarn add vista-auth
# or
pnpm add vista-auth
```

## 🚀 Quick Start (5 minutes)

### 1. Initialize Vista Auth

```bash
npx vista-auth init
```

This creates:

- `vista-auth.config.js` - Server configuration
- `app/api/auth/route.js` - API endpoints (Next.js)
- `providers.jsx` - Client provider setup
- `examples/` - Example components

### 2. Wrap your app with AuthProvider

```tsx
// app/layout.tsx (Next.js) or main.tsx (Vite)
import { AuthProvider } from "vista-auth/client";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider apiEndpoint="/api/auth">{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### 3. Use authentication in your components

```tsx
"use client";

import { useAuth } from "vista-auth/client";

export default function LoginPage() {
  const { signIn, user, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <div>Welcome, {user.name}!</div>;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        signIn({
          email: formData.get("email"),
          password: formData.get("password"),
        });
      }}
    >
      <input name="email" type="email" placeholder="Email" />
      <input name="password" type="password" placeholder="Password" />
      <button>Sign In</button>
    </form>
  );
}
```

## 🗄️ Database Integration

### Prisma

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

### MongoDB

```ts
import { createMongoAdapter } from "vista-auth/database";
import { db } from "./lib/mongodb";

export const auth = createVistaAuth({
  database: createMongoAdapter(db),
});
```

### Supabase

```ts
import { createSupabaseAdapter } from "vista-auth/database";
import { supabase } from "./lib/supabase";

export const auth = createVistaAuth({
  database: createSupabaseAdapter(supabase),
});
```

### Custom Database

```ts
export const auth = createVistaAuth({
  database: {
    async findUserByEmail(email) {
      return db.query("SELECT * FROM users WHERE email = ?", [email]);
    },
    async createUser(data) {
      return db.query("INSERT INTO users SET ?", [data]);
    },
    // ... implement other methods
  },
});
```

## 🕵️ Role-Based Access Control

### Protect Routes

```tsx
import { ProtectedRoute } from "vista-auth/guards";

function AdminPage() {
  return (
    <ProtectedRoute
      roles={["admin"]}
      redirect="/login"
      fallback={<div>Access Denied</div>}
    >
      <h1>Admin Dashboard</h1>
    </ProtectedRoute>
  );
}
```

### Route Guards Hook

```tsx
import { useRequireRole } from "vista-auth/guards";

function AdminPage() {
  useRequireRole("admin", "/login"); // Auto-redirects if not admin

  return <h1>Admin Dashboard</h1>;
}
```

### Middleware (Next.js)

```ts
// middleware.ts
import { createNextMiddleware } from "vista-auth/middleware";

export default createNextMiddleware({
  publicPaths: ["/login", "/signup", "/"],
  roleBasedPaths: {
    "/admin/*": ["admin"],
    "/dashboard/*": ["user", "admin"],
  },
});
```

### Express Middleware

```ts
import { createExpressMiddleware } from "vista-auth/middleware";

const authMiddleware = createExpressMiddleware({
  publicPaths: ["/login", "/signup"],
});

app.use(authMiddleware);
```

## 🎨 Built-in UI Helpers

```tsx
import { showToast, showError } from "vista-auth/ui";

// Success toast
showToast("Login successful!");

// Error message
showError("Invalid credentials");

// Custom duration
showToast("Session expires in 5 minutes", 5000);
```

## 🔄 Real-Time Session Sync

```tsx
<AuthProvider
  apiEndpoint="/api/auth"
  config={{
    sessionSyncEnabled: true,
    websocketUrl: "wss://your-domain.com/ws/auth",
  }}
>
  {children}
</AuthProvider>
```

## 💾 Offline Support

```tsx
<AuthProvider
  config={{
    sessionStorage: "indexedDB", // localStorage, sessionStorage, or indexedDB
    offlineFallback: true,
  }}
>
  {children}
</AuthProvider>
```

## 🔧 API Reference

### Client Hooks

```tsx
const {
  user, // Current user object
  session, // Current session
  isLoading, // Loading state
  isAuthenticated, // Auth status
  signIn, // (credentials) => Promise
  signUp, // (data) => Promise
  signOut, // () => Promise
  updateUser, // (data) => void
  hasRole, // (role) => boolean
  hasPermission, // (permission) => boolean
  hasAnyRole, // (roles[]) => boolean
  hasAllRoles, // (roles[]) => boolean
} = useAuth();
```

### Server API

```ts
const auth = createVistaAuth(config);

// Authentication
await auth.signUp({ email, password, name });
await auth.signIn({ email, password });
await auth.getSession(token);
await auth.signOut(sessionId);

// Password utilities
await auth.hashPassword(password);
await auth.verifyPassword(password, hash);

// JWT utilities
const token = auth.generateToken(payload);
const payload = auth.verifyToken(token);
```

## 📊 Features Comparison

| Feature        | Vista Auth      | NextAuth            |
| -------------- | --------------- | ------------------- |
| **Setup**      | 2 files         | 5+ files + DB setup |
| **Code**       | ~150 lines      | 500+ lines          |
| **Database**   | Any or none     | Required + Adapter  |
| **TypeScript** | Built-in        | Complex generics    |
| **Session**    | localStorage/DB | Database only       |
| **Bundle**     | ~5KB            | ~50KB               |
| **RBAC**       | Built-in        | Manual              |
| **Real-time**  | WebSocket       | No                  |
| **Offline**    | IndexedDB       | No                  |
| **Toast/UI**   | Built-in        | No                  |

## 🔒 Security Features

- ✅ bcrypt password hashing (configurable rounds)
- ✅ JWT tokens with expiration
- ✅ Secure session management
- ✅ CSRF protection ready
- ✅ XSS protection
- ✅ Rate limiting ready
- ✅ Secure cookie support
- ✅ Environment variable secrets

## 📚 Examples

### Sign Up

```tsx
const { signUp } = useAuth();

await signUp({
  email: "user@example.com",
  password: "securepassword",
  name: "John Doe",
  metadata: { theme: "dark" },
});
```

### Protected API Route (Next.js)

```ts
import { auth } from "@/vista-auth.config";

export async function GET(request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  const session = await auth.getSession(token);

  if (!session.success) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({ data: "Protected data" });
}
```

### Role Check

```tsx
const { hasRole, hasAnyRole, hasAllRoles } = useAuth();

if (hasRole("admin")) {
  // Show admin features
}

if (hasAnyRole(["admin", "moderator"])) {
  // Show moderation features
}

if (hasAllRoles(["admin", "superuser"])) {
  // Show super admin features
}
```

## 🛠️ Configuration

```ts
createVistaAuth({
  // Database (optional)
  database: createPrismaAdapter(prisma),

  // Security
  bcryptRounds: 10,
  jwtSecret: process.env.VISTA_AUTH_SECRET,
  jwtExpiresIn: "7d",
  sessionDuration: 7 * 24 * 60 * 60 * 1000,

  // Storage
  sessionStorage: "localStorage", // or 'sessionStorage', 'indexedDB'

  // Features
  sessionSyncEnabled: true,
  websocketUrl: "wss://your-domain.com/ws/auth",
  offlineFallback: true,
  toastEnabled: true,
  errorMessagesEnabled: true,

  // Callbacks
  onSignIn: (user) => console.log("Signed in:", user),
  onSignOut: () => console.log("Signed out"),
  onSessionExpired: () => console.log("Session expired"),
  onError: (error) => console.error("Auth error:", error),
});
```

## 📖 Documentation

- [Getting Started](https://github.com/vista-auth/docs/getting-started)
- [Database Integration](https://github.com/vista-auth/docs/database)
- [Role-Based Access](https://github.com/vista-auth/docs/rbac)
- [API Reference](https://github.com/vista-auth/docs/api)
- [Migration from NextAuth](https://github.com/vista-auth/docs/migration)

## 🤝 Contributing

Contributions welcome! Please read our [Contributing Guide](CONTRIBUTING.md).

## 📄 License

MIT © Vista Auth

## 🌟 Why Choose Vista Auth?

1. **Simplicity**: 150 lines vs 500+ lines of NextAuth
2. **Flexibility**: Works with ANY React framework and database
3. **Power**: RBAC, real-time sync, offline support, built-in UI
4. **Security**: Production-ready with bcrypt, JWT, and best practices
5. **Speed**: 5-minute setup with CLI auto-configuration
6. **Developer Experience**: TypeScript-first, great docs, active support

---

**Made with ❤️ by the Vista team**
