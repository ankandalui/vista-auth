#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

const args = process.argv.slice(2);
const command = args[0];
const subCommand = args[1];

// Help system
const showHelp = () => {
  console.log(`
🔐 Vista Auth CLI v1.2.0

Commands:
  init                    Initialize Vista Auth in your project
  generate-secret         Generate a secure VISTA_AUTH_SECRET
  help <topic>           Show detailed help for specific topics

Help Topics:
  --help api             API routes and authentication
  --help middleware      Middleware setup for all frameworks
  --help cookies         Cookie management and security
  --help database        Database setup and adapters
  --help examples        Complete implementation examples

Examples:
  npx vista-auth init
  npx vista-auth generate-secret
  npx vista-auth --help api
  npx vista-auth --help middleware
  npx vista-auth --help cookies
  `);
};

const showApiHelp = () => {
  console.log(`
🚀 Vista Auth API Routes Help

📁 Next.js App Router Setup:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📂 app/api/auth/
├── 🔐 login/route.ts      - Sign in users
├── 📝 register/route.ts   - Sign up users  
├── 👤 session/route.ts    - Get current session
└── 🚪 logout/route.ts     - Sign out users

🔐 LOGIN API (app/api/auth/login/route.ts):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/vista-auth.config';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    const result = await auth.signIn({ email, password });
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const { user, token } = result.data;
    const response = NextResponse.json({ success: true, user });
    
    // 🍪 SET COOKIE - CRITICAL!
    response.cookies.set('vista-auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

📝 REGISTER API (app/api/auth/register/route.ts):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/vista-auth.config';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();
    
    const result = await auth.signUp({ email, password, name });
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { user, token } = result.data;
    const response = NextResponse.json({ success: true, user });
    
    // 🍪 SET COOKIE AFTER SIGNUP
    response.cookies.set('vista-auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}

👤 SESSION API (app/api/auth/session/route.ts):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/vista-auth.config';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('vista-auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 });
    }
    
    const result = await auth.getSession(token);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ session: result.data });
  } catch (error) {
    return NextResponse.json({ error: 'Session failed' }, { status: 500 });
  }
}

🚪 LOGOUT API (app/api/auth/logout/route.ts):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // 🗑️ CLEAR COOKIE
  response.cookies.delete('vista-auth-token');
  
  return response;
}

🔧 Express.js Setup:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.post('/api/auth/login', async (req, res) => {
  const result = await auth.signIn(req.body);
  
  if (result.success) {
    res.cookie('vista-auth-token', result.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({ success: true, user: result.data.user });
  } else {
    res.status(401).json({ error: result.error });
  }
});

📋 Key Points:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Always set httpOnly: true for security
• Use secure: true in production
• Cookie name MUST be 'vista-auth-token'
• Set cookie in BOTH login AND register APIs
• Clear cookie in logout API

For more help: npx vista-auth --help middleware
  `);
};

const showMiddlewareHelp = () => {
  console.log(`
🛡️ Vista Auth Middleware Help

🚀 Next.js 13+ App Router (middleware.ts):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip static files and API routes
  if (pathname.startsWith('/_next/') || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('vista-auth-token')?.value;
  
  // Public routes
  const publicRoutes = ['/', '/login', '/register'];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Protected routes
  const protectedRoutes = ['/dashboard', '/profile', '/settings'];
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Authentication flow
  if (!token && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};

🏗️ Express.js Middleware:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { auth } from './vista-auth.config.js';

const authMiddleware = async (req, res, next) => {
  const token = req.cookies['vista-auth-token'];
  
  // Public routes
  const publicRoutes = ['/', '/login', '/register'];
  if (publicRoutes.includes(req.path)) {
    return next();
  }
  
  // Check authentication for protected routes
  if (req.path.startsWith('/dashboard')) {
    if (!token) {
      return res.redirect('/login');
    }
    
    const result = await auth.getSession(token);
    if (!result.success) {
      return res.redirect('/login');
    }
    
    req.user = result.data.user;
  }
  
  next();
};

app.use(authMiddleware);

⚛️ Remix Loader Protection:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// app/routes/dashboard.tsx
import { redirect } from '@remix-run/node';
import { auth } from '~/vista-auth.config';

export async function loader({ request }) {
  const cookieHeader = request.headers.get('Cookie');
  const token = parseCookie(cookieHeader, 'vista-auth-token');
  
  if (!token) {
    throw redirect('/login');
  }
  
  const result = await auth.getSession(token);
  if (!result.success) {
    throw redirect('/login');
  }
  
  return { user: result.data.user };
}

function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(\`\${name}=([^;]+)\`));
  return match ? match[1] : null;
}

🎯 Vite + React Router:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Navigate } from 'react-router-dom';
import { useAuth } from 'vista-auth/client';

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
}

// Usage in App.jsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

🔐 Role-Based Protection:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Next.js Middleware with roles
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('vista-auth-token')?.value;
  
  // Admin-only routes
  const adminRoutes = ['/admin'];
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Verify admin role (you'll need to decode/validate token)
    // This requires additional token validation logic
  }
  
  return NextResponse.next();
}

📋 Quick Setup Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Run: npx vista-auth init
2. Create middleware.ts in project root
3. Copy middleware code for your framework
4. Test with: npx vista-auth --help cookies

For more help: npx vista-auth --help cookies
  `);
};

const showCookieHelp = () => {
  console.log(`
🍪 Vista Auth Cookie Management Help

🔐 Cookie Configuration:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cookie Name: 'vista-auth-token'
Type: JWT Token String
Security: HttpOnly, Secure in production

🔧 Setting Cookies (Next.js):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ✅ CORRECT - Secure cookie setup
response.cookies.set('vista-auth-token', token, {
  httpOnly: true,                                    // Prevents XSS attacks
  secure: process.env.NODE_ENV === 'production',    // HTTPS only in prod
  sameSite: 'lax',                                   // CSRF protection
  maxAge: 60 * 60 * 24 * 7,                        // 7 days
  path: '/'                                          // Available site-wide
});

// ❌ INSECURE - Don't do this
response.cookies.set('vista-auth-token', token);

🗑️ Clearing Cookies:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Next.js
response.cookies.delete('vista-auth-token');

// Express.js
res.clearCookie('vista-auth-token');

// Manually expire
response.cookies.set('vista-auth-token', '', {
  expires: new Date(0),
  path: '/'
});

📖 Reading Cookies:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Next.js Middleware
const token = request.cookies.get('vista-auth-token')?.value;

// Next.js API Route
import { cookies } from 'next/headers';
const token = cookies().get('vista-auth-token')?.value;

// Express.js
const token = req.cookies['vista-auth-token'];

// Remix
function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(\`\${name}=([^;]+)\`));
  return match ? match[1] : null;
}

const cookieHeader = request.headers.get('Cookie');
const token = parseCookie(cookieHeader, 'vista-auth-token');

// Client-side (React)
import { useAuth } from 'vista-auth/client';
const { user, token } = useAuth(); // Handles cookies automatically

🛡️ Security Best Practices:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ DO:
• Always use httpOnly: true
• Set secure: true in production  
• Use sameSite: 'lax' or 'strict'
• Set appropriate expiration
• Use the exact name: 'vista-auth-token'
• Clear cookie on logout

❌ DON'T:
• Store tokens in localStorage (XSS vulnerable)
• Use httpOnly: false
• Skip secure flag in production
• Use different cookie names
• Forget to clear on logout

🐛 Common Cookie Issues:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ Problem: Middleware can't find cookie
🔧 Solution: Check cookie name is exactly 'vista-auth-token'

❌ Problem: Cookie not persisting
🔧 Solution: Set proper maxAge and path: '/'

❌ Problem: Cookie not secure
🔧 Solution: Use httpOnly and secure flags

❌ Problem: CORS issues
🔧 Solution: Configure sameSite properly

🔍 Debug Cookies:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Add to middleware for debugging
console.log("🍪 All Cookies:", {
  cookies: Object.fromEntries(
    request.cookies.getAll().map(c => [c.name, c.value])
  )
});

// Browser DevTools
// Application → Storage → Cookies → your-domain.com

🏁 Complete Login Flow:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. User submits login form → POST /api/auth/login
2. API validates credentials with Vista Auth
3. API sets 'vista-auth-token' cookie with secure flags
4. Browser automatically sends cookie with future requests
5. Middleware reads cookie and validates user access
6. Protected routes accessible with valid cookie

For more help: npx vista-auth --help examples
  `);
};

const showDatabaseHelp = () => {
  console.log(`
🗄️ Vista Auth Database Help

📊 Supported Databases:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Prisma (PostgreSQL, MySQL, SQLite)
✅ MongoDB (Native + Mongoose)  
✅ Supabase (PostgreSQL with Auth)
✅ PostgreSQL (Direct connection)
✅ Firebase Firestore
✅ Memory (Development/Testing)

🚀 Auto-Setup Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

npx vista-auth init
# Select your database → Auto-installs packages & generates schemas

🔧 Manual Database Configuration:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// vista-auth.config.ts
import { MongoClient } from 'mongodb';
import { createMongoAdapter } from 'vista-auth/database';

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db('vista-auth');

export default {
  database: createMongoAdapter(db),
  secret: process.env.VISTA_AUTH_SECRET!,
};

📋 Database Adapters Reference:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { 
  createPrismaAdapter,      // Prisma ORM
  createMongoAdapter,       // MongoDB
  createSupabaseAdapter,    // Supabase
  createPostgresAdapter,    // PostgreSQL
  createFirebaseAdapter,    // Firebase
  createMemoryAdapter       // In-memory (dev)
} from 'vista-auth/database';

🎯 Environment Variables:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Generated by: npx vista-auth generate-secret
VISTA_AUTH_SECRET="your-secure-secret"

# Database URLs
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/db"
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"

For more help: npx vista-auth --help examples
  `);
};

const showExamplesHelp = () => {
  console.log(`
🎯 Vista Auth Complete Examples

🚀 Complete Next.js Setup (5 minutes):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Initialize Project:
   npx vista-auth init
   # Select: TypeScript → Next.js → MongoDB → RBAC

2️⃣ Generated Files:
   ✅ vista-auth.config.ts     - Auth configuration  
   ✅ lib/mongodb-setup.ts     - Database connection
   ✅ .env.example             - Environment variables

3️⃣ Create API Routes:
   📁 app/api/auth/
   ├── login/route.ts
   ├── register/route.ts  
   ├── session/route.ts
   └── logout/route.ts

4️⃣ Add Middleware:
   📄 middleware.ts (project root)

5️⃣ Create Login Page:
   📄 app/login/page.tsx

📝 Complete Login Component:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (data.success) {
        router.push('/dashboard'); // Middleware will handle redirect
      } else {
        alert(data.error?.message || 'Login failed');
      }
    } catch (error) {
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="max-w-md mx-auto p-6">
      <h1 className="text-2xl mb-4">Login</h1>
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full p-2 mb-4 border rounded"
        required
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"  
        className="w-full p-2 mb-4 border rounded"
        required
      />
      
      <button 
        type="submit" 
        disabled={loading}
        className="w-full p-2 bg-blue-500 text-white rounded"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

🎯 Express.js Complete Setup:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// server.js
import express from 'express';
import cookieParser from 'cookie-parser';
import { auth } from './vista-auth.config.js';

const app = express();
app.use(express.json());
app.use(cookieParser());

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  const result = await auth.signIn(req.body);
  
  if (result.success) {
    res.cookie('vista-auth-token', result.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({ success: true, user: result.data.user });
  } else {
    res.status(401).json({ error: result.error });
  }
});

// Protected route
app.get('/api/profile', async (req, res) => {
  const token = req.cookies['vista-auth-token'];
  
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }
  
  const result = await auth.getSession(token);
  
  if (result.success) {
    res.json({ user: result.data.user });
  } else {
    res.status(401).json({ error: result.error });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

🏁 Production Checklist:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Set secure VISTA_AUTH_SECRET
✅ Configure production database  
✅ Enable secure cookies (httpOnly: true)
✅ Set up HTTPS/SSL
✅ Configure CORS properly
✅ Add rate limiting
✅ Test authentication flow
✅ Test middleware protection

🔗 Useful Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
npx vista-auth init                  # Start new project
npx vista-auth generate-secret       # Generate secure secret
npx vista-auth --help api           # API help
npx vista-auth --help middleware    # Middleware help
npx vista-auth --help cookies       # Cookie help

📖 Documentation:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GitHub: https://github.com/ankandalui/vista-auth
NPM: https://www.npmjs.com/package/vista-auth
  `);
};

if (command === "init") {
  const initScript = path.join(__dirname, "../dist/cli/init.js");
  const child = spawn("node", [initScript], { stdio: "inherit" });
  child.on("exit", (code) => process.exit(code));
} else if (command === "generate-secret") {
  const crypto = require("crypto");
  const secret = crypto.randomBytes(64).toString("base64");
  console.log("\n🔐 Generated secure VISTA_AUTH_SECRET:");
  console.log(`VISTA_AUTH_SECRET="${secret}"`);
  console.log("\n💡 Copy this to your .env file");
} else if (command === "--help" || command === "help") {
  if (subCommand === "api") {
    showApiHelp();
  } else if (subCommand === "middleware") {
    showMiddlewareHelp();
  } else if (subCommand === "cookies") {
    showCookieHelp();
  } else if (subCommand === "database") {
    showDatabaseHelp();
  } else if (subCommand === "examples") {
    showExamplesHelp();
  } else {
    showHelp();
  }
} else {
  showHelp();
}
