# 🚀 Vista Auth - Quick Start Guide

Get authentication up and running in 5 minutes!

## 📦 Step 1: Install

```bash
npm install vista-auth
```

## 🧙 Step 2: Auto Setup (Easiest)

```bash
npx vista-auth init
```

This interactive CLI will:

- Ask about your framework (Next.js, Remix, Vite, etc.)
- Ask about your database (Prisma, MongoDB, Supabase, etc.)
- Select features (RBAC, WebSocket, Toast, IndexedDB)
- Generate all necessary files
- Create example components

**Done!** Skip to Step 6.

## 🛠️ Step 3: Manual Setup (If you skipped auto-setup)

### Create Auth Config

```ts
// vista-auth.config.ts
import { createVistaAuth } from "vista-auth/server";
import { createPrismaAdapter } from "vista-auth/database";
import { prisma } from "./lib/prisma"; // Your Prisma client

export const auth = createVistaAuth({
  database: createPrismaAdapter(prisma),
  jwtSecret: process.env.VISTA_AUTH_SECRET || "change-me-in-production",
});
```

### Create API Routes

**Next.js App Router:**

```ts
// app/api/auth/[...vistaauth]/route.ts
import { auth } from "@/vista-auth.config";

export async function POST(request: Request) {
  const body = await request.json();
  const url = new URL(request.url);

  if (url.pathname.includes("/signin")) {
    return Response.json(await auth.signIn(body));
  }
  if (url.pathname.includes("/signup")) {
    return Response.json(await auth.signUp(body));
  }
  if (url.pathname.includes("/signout")) {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const payload = auth.verifyToken(token);
    return Response.json(await auth.signOut(payload.sessionId));
  }
}

export async function GET(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  return Response.json(await auth.getSession(token));
}
```

## 🎨 Step 4: Add Provider

```tsx
// app/layout.tsx or app/providers.tsx
"use client";

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

## 🔐 Step 5: Create Login Page

```tsx
// app/login/page.tsx
"use client";

import { useAuth } from "vista-auth/client";
import { useState } from "react";

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      await signUp({ email, password });
    } else {
      await signIn({ email, password });
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto" }}>
      <form onSubmit={handleSubmit}>
        <h1>{isSignUp ? "Sign Up" : "Sign In"}</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: "10px", margin: "10px 0" }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: "10px", margin: "10px 0" }}
        />

        <button
          type="submit"
          style={{ width: "100%", padding: "10px", margin: "10px 0" }}
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </button>

        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ width: "100%", padding: "10px" }}
        >
          {isSignUp ? "Have an account?" : "Need an account?"}
        </button>
      </form>
    </div>
  );
}
```

## 🎯 Step 6: Use Authentication

### Show User Info

```tsx
"use client";

import { useAuth } from "vista-auth/client";

export default function HomePage() {
  const { user, isAuthenticated, signOut } = useAuth();

  if (!isAuthenticated) {
    return <a href="/login">Sign In</a>;
  }

  return (
    <div>
      <h1>Welcome, {user?.name || user?.email}!</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Protect a Page

```tsx
"use client";

import { ProtectedRoute } from "vista-auth/guards";
import { useAuth } from "vista-auth/client";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute redirect="/login">
      <h1>Dashboard</h1>
      <p>Welcome, {user?.name}!</p>
    </ProtectedRoute>
  );
}
```

### Admin-Only Page

```tsx
"use client";

import { ProtectedRoute } from "vista-auth/guards";

export default function AdminPage() {
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

## 🗄️ Step 7: Database Setup

### Prisma

```prisma
// prisma/schema.prisma
model User {
  id          String    @id @default(cuid())
  email       String    @unique
  name        String?
  roles       String[]  @default(["user"])
  permissions String[]  @default([])
  metadata    Json?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

Run migrations:

```bash
npx prisma migrate dev --name init
```

### MongoDB

```ts
// lib/mongodb.ts
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URL!);
export const db = client.db("myapp");
```

```ts
// vista-auth.config.ts
import { createMongoAdapter } from "vista-auth/database";
import { db } from "./lib/mongodb";

export const auth = createVistaAuth({
  database: createMongoAdapter(db),
});
```

### Supabase

```ts
// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
```

```ts
// vista-auth.config.ts
import { createSupabaseAdapter } from "vista-auth/database";
import { supabase } from "./lib/supabase";

export const auth = createVistaAuth({
  database: createSupabaseAdapter(supabase),
});
```

## 🔒 Step 8: Environment Variables

```env
# .env.local
VISTA_AUTH_SECRET=your-super-secret-jwt-key
DATABASE_URL=your-database-url
```

## ✅ You're Done!

That's it! You now have:

- ✅ User sign up
- ✅ User sign in
- ✅ User sign out
- ✅ Session management
- ✅ Protected routes
- ✅ Role-based access
- ✅ Toast notifications
- ✅ TypeScript types

## 🎨 Optional: Add More Features

### Enable WebSocket Sync

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

### Enable IndexedDB (Offline)

```tsx
<AuthProvider
  config={{
    sessionStorage: "indexedDB",
    offlineFallback: true,
  }}
>
  {children}
</AuthProvider>
```

### Add Middleware Protection

```ts
// middleware.ts
import { createNextMiddleware } from "vista-auth/middleware";

export default createNextMiddleware({
  publicPaths: ["/", "/login", "/signup"],
  roleBasedPaths: {
    "/admin/*": ["admin"],
    "/dashboard/*": ["user", "admin"],
  },
});
```

## 📚 Next Steps

- Read the [Full Documentation](./README.md)
- Check out [All Features](./FEATURES.md)
- Learn about [Database Integration](./README.md#database-integration)
- Explore [RBAC](./README.md#role-based-access-control)

## 🆘 Need Help?

- Check the [README](./README.md)
- See [Examples](./examples/)
- Open an issue on GitHub

---

**That's it! You have authentication in 5 minutes!** 🎉
