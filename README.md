# 🔐 Vista Auth

<div align="center">

**Simple, powerful, and secure authentication for React apps**

[![npm version](https://badge.fury.io/js/vista-auth.svg)](https://www.npmjs.com/package/vista-auth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

Works with any framework • Any database • Zero configuration needed

[Quick Start](#-quick-start) • [Documentation](#-table-of-contents) • [Examples](#-complete-examples) • [GitHub](https://github.com/ankandalui/vista-auth)

</div>

---

## ✨ Why Vista Auth?

Vista Auth is a lightweight, production-ready authentication solution that takes **5 minutes to set up** and works with **any React framework** and **any database**.

### Key Features

- 🚀 **Universal Compatibility** - Works with Next.js, Remix, Vite, CRA, Express
- 💾 **Database Agnostic** - Prisma, MongoDB, Supabase, PostgreSQL, Firebase, or none
- 🔒 **Production-Ready Security** - bcrypt hashing, JWT tokens, secure sessions
- 🎯 **Minimal Code** - 150 lines vs 500+ lines of other solutions
- 🕵️ **Built-in RBAC** - Role-based access control with route guards and middleware
- ⚡ **Real-Time Sync** - WebSocket support for multi-tab/device synchronization
- 🌐 **Offline Support** - IndexedDB fallback for offline authentication
- 🎨 **UI Helpers Included** - Toast notifications and error messages out-of-the-box
- 📦 **CLI Auto-Setup** - One command to get started
- 🔧 **Zero Config Required** - Sensible defaults, customize when needed

---

## 📦 Installation

```bash
npm install vista-auth
```

```bash
yarn add vista-auth
```

```bash
pnpm add vista-auth
```

---

## 🚀 Quick Start

### Step 1: Initialize with CLI

Run the interactive setup wizard:

```bash
npx vista-auth init
```

This creates:
- ✅ `vista-auth.config.js` - Server configuration
- ✅ `app/api/auth/route.js` - API endpoints
- ✅ `providers.jsx` - Client provider setup
- ✅ Example components

### Step 2: Wrap Your App

**Next.js App Router:**
```tsx
// app/layout.tsx
import { AuthProvider } from 'vista-auth/client';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider apiEndpoint="/api/auth">
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Next.js Pages Router:**
```tsx
// pages/_app.tsx
import { AuthProvider } from 'vista-auth/client';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider apiEndpoint="/api/auth">
      <Component {...pageProps} />
    </AuthProvider>
  );
}
```

**Vite/CRA:**
```tsx
// src/main.tsx or src/index.tsx
import { AuthProvider } from 'vista-auth/client';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AuthProvider apiEndpoint="http://localhost:3000/api/auth">
    <App />
  </AuthProvider>
);
```

### Step 3: Create Auth API Route

**Next.js (App Router):**
```ts
// app/api/auth/route.ts
import { auth } from '@/vista-auth.config';

export async function POST(request: Request) {
  const { action, ...data } = await request.json();

  switch (action) {
    case 'signIn':
      return Response.json(await auth.signIn(data));
    case 'signUp':
      return Response.json(await auth.signUp(data));
    case 'signOut':
      return Response.json(await auth.signOut(data.sessionId));
    case 'getSession':
      return Response.json(await auth.getSession(data.token));
    default:
      return Response.json({ success: false, error: 'Invalid action' }, { status: 400 });
  }
}
```

**Express:**
```ts
// server.js
import express from 'express';
import { auth } from './vista-auth.config';

const app = express();
app.use(express.json());

app.post('/api/auth', async (req, res) => {
  const { action, ...data } = req.body;

  switch (action) {
    case 'signIn':
      res.json(await auth.signIn(data));
      break;
    case 'signUp':
      res.json(await auth.signUp(data));
      break;
    case 'signOut':
      res.json(await auth.signOut(data.sessionId));
      break;
    case 'getSession':
      res.json(await auth.getSession(data.token));
      break;
    default:
      res.status(400).json({ success: false, error: 'Invalid action' });
  }
});

app.listen(3000);
```

### Step 4: Use in Components

```tsx
'use client';

import { useAuth } from 'vista-auth/client';

export default function LoginPage() {
  const { signIn, signUp, user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return (
      <div>
        <h1>Welcome, {user?.name}!</h1>
        <p>Email: {user?.email}</p>
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    await signIn({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });
  };

  return (
    <form onSubmit={handleSignIn}>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

**That's it! 🎉 You now have authentication working.**

---

## 📚 Table of Contents

- [Database Integration](#-database-integration)
- [Role-Based Access Control](#️-role-based-access-control-rbac)
- [Middleware](#-middleware)
- [UI Helpers](#-ui-helpers)
- [Real-Time Session Sync](#-real-time-session-sync)
- [Offline Support](#-offline-support)
- [API Reference](#-api-reference)
- [Complete Examples](#-complete-examples)
- [Configuration](#️-configuration)
- [Security Features](#-security-features)
- [Comparison](#-comparison-with-other-solutions)

---

## 🗄️ Database Integration

Vista Auth works with **any database** or **no database at all**. Choose the adapter that fits your stack:

### Prisma

```ts
// vista-auth.config.ts
import { createVistaAuth } from 'vista-auth/server';
import { createPrismaAdapter } from 'vista-auth/database';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auth = createVistaAuth({
  database: createPrismaAdapter(prisma),
  jwtSecret: process.env.VISTA_AUTH_SECRET!,
});
```

**Prisma Schema:**
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String?
  roles         String[]
  permissions   String[]
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### MongoDB

```ts
import { createMongoAdapter } from 'vista-auth/database';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db('myapp');

export const auth = createVistaAuth({
  database: createMongoAdapter(db),
  jwtSecret: process.env.VISTA_AUTH_SECRET!,
});
```

### Supabase

```ts
import { createSupabaseAdapter } from 'vista-auth/database';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const auth = createVistaAuth({
  database: createSupabaseAdapter(supabase),
  jwtSecret: process.env.VISTA_AUTH_SECRET!,
});
```

### PostgreSQL (Direct)

```ts
import { createPostgresAdapter } from 'vista-auth/database';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const auth = createVistaAuth({
  database: createPostgresAdapter(pool),
  jwtSecret: process.env.VISTA_AUTH_SECRET!,
});
```

### Firebase

```ts
import { createFirebaseAdapter } from 'vista-auth/database';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp();
const db = getFirestore(app);

export const auth = createVistaAuth({
  database: createFirebaseAdapter(db),
  jwtSecret: process.env.VISTA_AUTH_SECRET!,
});
```

### Custom Database Adapter

Implement your own database adapter for any database:

```ts
import { DatabaseAdapter } from 'vista-auth/database';

const customAdapter: DatabaseAdapter = {
  async findUserByEmail(email: string) {
    return await db.query('SELECT * FROM users WHERE email = $1', [email]);
  },

  async findUserById(id: string) {
    return await db.query('SELECT * FROM users WHERE id = $1', [id]);
  },

  async createUser(data) {
    const user = await db.query(
      'INSERT INTO users (email, password_hash, name, roles, permissions) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [data.email, data.passwordHash, data.name, data.roles || [], data.permissions || []]
    );
    return user.rows[0];
  },

  async updateUser(id: string, data) {
    const user = await db.query(
      'UPDATE users SET name = $1, metadata = $2 WHERE id = $3 RETURNING *',
      [data.name, data.metadata, id]
    );
    return user.rows[0];
  },

  async createSession(data) {
    const session = await db.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *',
      [data.userId, data.token, data.expiresAt]
    );
    return session.rows[0];
  },

  async findSessionByToken(token: string) {
    const result = await db.query('SELECT * FROM sessions WHERE token = $1', [token]);
    return result.rows[0];
  },

  async deleteSession(sessionId: string) {
    await db.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
  },

  async deleteExpiredSessions() {
    await db.query('DELETE FROM sessions WHERE expires_at < NOW()');
  },
};

export const auth = createVistaAuth({
  database: customAdapter,
  jwtSecret: process.env.VISTA_AUTH_SECRET!,
});
```

### No Database (Stateless JWT Only)

For serverless or simple applications:

```ts
export const auth = createVistaAuth({
  database: null, // No database required
  jwtSecret: process.env.VISTA_AUTH_SECRET!,
});
```

---

## 🕵️ Role-Based Access Control (RBAC)

Vista Auth includes powerful RBAC features out-of-the-box.

### Protect Routes with Components

```tsx
import { ProtectedRoute } from 'vista-auth/guards';

function AdminDashboard() {
  return (
    <ProtectedRoute
      roles={['admin']}
      redirect="/login"
      fallback={<div>Access Denied</div>}
    >
      <div>
        <h1>Admin Dashboard</h1>
        <p>Only admins can see this</p>
      </div>
    </ProtectedRoute>
  );
}
```

### Route Guards Hooks

**Require Authentication:**
```tsx
import { useRequireAuth } from 'vista-auth/guards';

function DashboardPage() {
  useRequireAuth('/login'); // Redirects if not authenticated

  return <h1>Dashboard</h1>;
}
```

**Require Specific Role:**
```tsx
import { useRequireRole } from 'vista-auth/guards';

function AdminPage() {
  useRequireRole('admin', '/unauthorized'); // Redirects if not admin

  return <h1>Admin Panel</h1>;
}
```

**Require Permission:**
```tsx
import { useRequirePermission } from 'vista-auth/guards';

function EditUserPage() {
  useRequirePermission('users:edit', '/unauthorized');

  return <h1>Edit User</h1>;
}
```

### Check Roles in Components

```tsx
import { useAuth } from 'vista-auth/client';

function Navigation() {
  const { hasRole, hasAnyRole, hasAllRoles, hasPermission } = useAuth();

  return (
    <nav>
      <a href="/">Home</a>
      
      {hasRole('admin') && (
        <a href="/admin">Admin Panel</a>
      )}
      
      {hasAnyRole(['admin', 'moderator']) && (
        <a href="/moderation">Moderation</a>
      )}
      
      {hasAllRoles(['admin', 'superuser']) && (
        <a href="/superadmin">Super Admin</a>
      )}
      
      {hasPermission('posts:create') && (
        <a href="/create-post">Create Post</a>
      )}
    </nav>
  );
}
```

### Higher-Order Component (HOC)

```tsx
import { withAuth } from 'vista-auth/guards';

function ProtectedComponent() {
  return <h1>Protected Content</h1>;
}

export default withAuth(ProtectedComponent, {
  roles: ['admin'],
  redirect: '/login',
});
```

---

## 🛡️ Middleware

### Next.js Middleware

Create `middleware.ts` in your project root:

```ts
import { createNextMiddleware } from 'vista-auth/middleware';

export default createNextMiddleware({
  // Public paths anyone can access
  publicPaths: ['/login', '/signup', '/', '/about'],
  
  // Role-based path protection
  roleBasedPaths: {
    '/admin/*': ['admin'],
    '/dashboard/*': ['user', 'admin'],
    '/moderator/*': ['moderator', 'admin'],
  },
  
  // Where to redirect unauthenticated users
  loginUrl: '/login',
  
  // Where to redirect unauthorized users
  unauthorizedUrl: '/unauthorized',
  
  // Custom JWT secret (optional)
  jwtSecret: process.env.VISTA_AUTH_SECRET,
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Express Middleware

```ts
import express from 'express';
import { createExpressMiddleware } from 'vista-auth/middleware';

const app = express();

const authMiddleware = createExpressMiddleware({
  publicPaths: ['/login', '/signup', '/api/public/*'],
  jwtSecret: process.env.VISTA_AUTH_SECRET,
});

app.use(authMiddleware);

app.get('/api/protected', (req, res) => {
  res.json({ message: 'Protected data', user: req.user });
});
```

---

## 🎨 UI Helpers

Vista Auth includes beautiful toast notifications:

```tsx
import { showToast, showError, showWarning, showInfo } from 'vista-auth/ui';

function MyComponent() {
  const handleSuccess = () => {
    showToast('Login successful!', 3000); // 3 seconds
  };

  const handleError = () => {
    showError('Invalid credentials', 5000);
  };

  const handleWarning = () => {
    showWarning('Your session will expire in 5 minutes');
  };

  const handleInfo = () => {
    showInfo('New features available!');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Success</button>
      <button onClick={handleError}>Error</button>
      <button onClick={handleWarning}>Warning</button>
      <button onClick={handleInfo}>Info</button>
    </div>
  );
}
```

---

## 🔄 Real-Time Session Sync

Synchronize authentication state across multiple tabs and devices:

```tsx
<AuthProvider
  apiEndpoint="/api/auth"
  config={{
    sessionSyncEnabled: true,
    websocketUrl: 'wss://your-domain.com/ws/auth',
  }}
>
  {children}
</AuthProvider>
```

---

## 🌐 Offline Support

Vista Auth supports offline authentication with IndexedDB:

```tsx
<AuthProvider
  config={{
    sessionStorage: 'indexedDB',
    offlineFallback: true,
  }}
>
  {children}
</AuthProvider>
```

---

## 🔧 API Reference

### Client Hooks

#### `useAuth()`

```tsx
const {
  // State
  user,              // Current user object or null
  session,           // Current session object or null
  isLoading,         // true while checking authentication
  isAuthenticated,   // true if user is signed in
  error,             // Error message if any
  
  // Actions
  signIn,            // (credentials) => Promise<void>
  signUp,            // (data) => Promise<void>
  signOut,           // () => Promise<void>
  updateUser,        // (data) => Promise<void>
  
  // Role & Permission Checks
  hasRole,           // (role: string) => boolean
  hasPermission,     // (permission: string) => boolean
  hasAnyRole,        // (roles: string[]) => boolean
  hasAllRoles,       // (roles: string[]) => boolean
} = useAuth();
```

### Server API

#### `createVistaAuth(config)`

```ts
import { createVistaAuth } from 'vista-auth/server';

const auth = createVistaAuth({
  database: adapter,        // Database adapter or null
  jwtSecret: string,       // Secret for JWT signing
  bcryptRounds: number,    // bcrypt cost factor (default: 10)
  sessionDuration: number, // Session duration in ms
});

// Methods
await auth.signUp({ email, password, name, roles, permissions });
await auth.signIn({ email, password });
await auth.getSession(token);
await auth.signOut(sessionId);
await auth.hashPassword(password);
await auth.verifyPassword(password, hash);
auth.generateToken(payload);
auth.verifyToken(token);
```

---

## 💡 Complete Examples

### Full Login Page with Validation

```tsx
'use client';

import { useState } from 'react';
import { useAuth } from 'vista-auth/client';
import { showError, showToast } from 'vista-auth/ui';

export default function LoginPage() {
  const { signIn, signUp, isLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    if (!email || !password) {
      showError('Email and password are required');
      return;
    }

    if (password.length < 8) {
      showError('Password must be at least 8 characters');
      return;
    }

    try {
      if (isSignUp) {
        await signUp({ email, password, name });
        showToast('Account created successfully!');
      } else {
        await signIn({ email, password });
        showToast('Welcome back!');
      }
    } catch (error) {
      showError(error.message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="mt-1 block w-full px-3 py-2 border rounded-md"
                placeholder="John Doe"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border rounded-md"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border rounded-md"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Protected Dashboard

```tsx
'use client';

import { useAuth } from 'vista-auth/client';
import { useRequireAuth } from 'vista-auth/guards';
import { showToast } from 'vista-auth/ui';

export default function DashboardPage() {
  useRequireAuth('/login');
  
  const { user, signOut, hasRole, hasPermission } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    showToast('Signed out successfully');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Welcome, {user?.name}!</h2>
          <p className="text-gray-600">Email: {user?.email}</p>
          <p className="text-gray-600">Roles: {user?.roles?.join(', ') || 'None'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hasPermission('posts:view') && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Posts</h3>
              <p className="text-gray-600">Manage your posts</p>
            </div>
          )}

          {hasRole('admin') && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Admin Panel</h3>
              <p className="text-gray-600">System administration</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
```

---

## 🛠️ Configuration

### Full Configuration Example

```ts
// vista-auth.config.ts
import { createVistaAuth } from 'vista-auth/server';
import { createPrismaAdapter } from 'vista-auth/database';
import { prisma } from './lib/prisma';

export const auth = createVistaAuth({
  // Database adapter (optional)
  database: createPrismaAdapter(prisma),

  // Security settings
  jwtSecret: process.env.VISTA_AUTH_SECRET!,
  bcryptRounds: 12,
  sessionDuration: 7 * 24 * 60 * 60 * 1000, // 7 days

  // Lifecycle callbacks
  onSignIn: (user) => {
    console.log('User signed in:', user.email);
  },

  onSignOut: () => {
    console.log('User signed out');
  },

  onSessionExpired: () => {
    console.log('Session expired');
  },

  onError: (error) => {
    console.error('Auth error:', error);
  },
});
```

### Environment Variables

Create a `.env.local` file:

```env
# Required: Secret for JWT signing
VISTA_AUTH_SECRET=your-super-secret-jwt-key-change-in-production

# Optional: Database connection
DATABASE_URL=postgresql://user:password@localhost:5432/myapp

# Optional: WebSocket URL
NEXT_PUBLIC_WS_URL=wss://your-domain.com/ws/auth
```

---

## 🔒 Security Features

- ✅ **bcrypt hashing** with configurable cost factor
- ✅ **JWT tokens** with expiration
- ✅ **Secure session management**
- ✅ **CSRF protection** ready
- ✅ **XSS protection**
- ✅ **Rate limiting** ready
- ✅ **Environment variable secrets**

---

## 📊 Comparison with Other Solutions

| Feature                    | Vista Auth | NextAuth.js | Clerk | Auth0 |
| -------------------------- | ---------- | ----------- | ----- | ----- |
| **Setup Time**             | 5 minutes  | 30+ minutes | 15 min | 20 min |
| **Lines of Code**          | ~150       | 500+        | 200+  | 300+  |
| **Works Without Database** | ✅         | ❌          | ❌    | ✅    |
| **Database Agnostic**      | ✅         | ⚠️          | ❌    | ✅    |
| **Framework Agnostic**     | ✅         | ❌          | ⚠️    | ✅    |
| **Built-in RBAC**          | ✅         | ❌          | ✅    | ✅    |
| **Real-Time Sync**         | ✅         | ❌          | ✅    | ✅    |
| **Offline Support**        | ✅         | ❌          | ❌    | ❌    |
| **UI Components**          | ✅         | ❌          | ✅    | ✅    |
| **Bundle Size**            | ~5KB       | ~50KB       | ~80KB | ~100KB |
| **Pricing**                | Free       | Free        | Paid  | Paid  |
| **Self-Hosted**            | ✅         | ✅          | ❌    | ❌    |
| **TypeScript First**       | ✅         | ⚠️          | ✅    | ✅    |
| **CLI Tool**               | ✅         | ❌          | ✅    | ❌    |

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/ankandalui/vista-auth/blob/main/CONTRIBUTING.md).

---

## 📄 License

MIT © [Vista Auth](https://github.com/ankandalui/vista-auth)

---

## 🌟 Why Choose Vista Auth?

1. **Simplicity** - 150 lines vs 500+ in alternatives
2. **Flexibility** - Works with any React framework and database
3. **Power** - Built-in RBAC, real-time sync, offline support
4. **Security** - Production-ready with bcrypt and JWT
5. **Developer Experience** - TypeScript-first with great docs

---

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/ankandalui/vista-auth/issues)
- **GitHub Discussions**: [Ask questions](https://github.com/ankandalui/vista-auth/discussions)
- **Documentation**: [Full docs](https://github.com/ankandalui/vista-auth#readme)

---

**Ready to add authentication to your app?**

```bash
npm install vista-auth
npx vista-auth init
```

**⭐ Star us on GitHub!**

[https://github.com/ankandalui/vista-auth](https://github.com/ankandalui/vista-auth)
