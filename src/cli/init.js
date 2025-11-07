#!/usr/bin/env node

/**
 * Vista Auth CLI
 * Auto-setup tool for quick integration
 */

const fs = require("fs");
const path = require("path");
const { prompts } = require("./prompts");

async function init() {
  console.log("🔐 Vista Auth Setup\n");

  const answers = await prompts([
    {
      type: "select",
      name: "language",
      message: "Which language do you prefer?",
      choices: [
        { title: "TypeScript (.ts/.tsx)", value: "typescript" },
        { title: "JavaScript (.js/.jsx)", value: "javascript" },
      ],
    },
    {
      type: "select",
      name: "framework",
      message: "Which framework are you using?",
      choices: [
        { title: "Next.js", value: "nextjs" },
        { title: "Remix", value: "remix" },
        { title: "Vite + React", value: "vite" },
        { title: "Create React App", value: "cra" },
        { title: "Express", value: "express" },
        { title: "Other", value: "other" },
      ],
    },
    {
      type: "select",
      name: "database",
      message: "Which database will you use?",
      choices: [
        { title: "Prisma", value: "prisma" },
        { title: "MongoDB", value: "mongodb" },
        { title: "Supabase", value: "supabase" },
        { title: "PostgreSQL", value: "postgres" },
        { title: "Firebase", value: "firebase" },
        { title: "None (localStorage only)", value: "none" },
      ],
    },
    {
      type: "multiselect",
      name: "features",
      message: "Select features to enable:",
      choices: [
        { title: "Role-based access control", value: "rbac", selected: true },
        { title: "WebSocket session sync", value: "websocket" },
        { title: "Toast notifications", value: "toast", selected: true },
        { title: "IndexedDB offline support", value: "indexeddb" },
      ],
    },
  ]);

  console.log("\n📦 Creating files...\n");

  // Create config file
  createConfigFile(answers);

  // Create auth API routes
  createApiRoutes(answers);

  // Create provider setup
  createProviderSetup(answers);

  // Create example components
  createExamples(answers);

  const isTypeScript = answers.language === "typescript";
  const configExt = isTypeScript ? "ts" : "js";
  const componentExt = isTypeScript ? "tsx" : "jsx";
  const routeExt = isTypeScript ? "ts" : "js";

  console.log("\n✅ Setup complete!\n");
  console.log("📁 Files created:");
  console.log(`   vista-auth.config.${configExt}        - Auth configuration`);
  console.log(
    `   auth-utils/providers.${componentExt}    - Auth provider setup`
  );
  if (answers.framework === "nextjs") {
    console.log(`   app/api/auth/signup/route.${routeExt}  - Signup API`);
    console.log(`   app/api/auth/signin/route.${routeExt}  - Signin API`);
    console.log(`   app/api/auth/signout/route.${routeExt} - Signout API`);
    console.log(`   app/api/auth/session/route.${routeExt} - Session API`);
  }
  console.log("   examples/                   - Example components");
  console.log("\n🚀 Next steps:");
  console.log(`1. Import Providers in your layout.${componentExt}:`);
  console.log("   import { Providers } from './auth-utils/providers';");
  console.log("2. Wrap your app: <Providers>{children}</Providers>");
  console.log("3. Use useAuth() hook in components");
  console.log("4. Check examples/ folder for usage examples");
  console.log(`\n📖 Language: ${isTypeScript ? "TypeScript" : "JavaScript"}`);
  console.log("📖 Docs: https://github.com/ankandalui/vista-auth\n");
}

function createConfigFile(answers) {
  const isTypeScript = answers.language === "typescript";
  const fileExt = isTypeScript ? "ts" : "js";

  // Handle database adapter import - use memory adapter for localStorage
  const databaseImport =
    answers.database === "none"
      ? `import { createMemoryAdapter } from 'vista-auth/database';`
      : `import { create${capitalize(
          answers.database
        )}Adapter } from 'vista-auth/database';`;

  const databaseConfig =
    answers.database === "none"
      ? "database: createMemoryAdapter(), // In-memory storage for localStorage-only mode"
      : `// database: create${capitalize(answers.database)}Adapter(db),`;

  const config = `import { createVistaAuth } from 'vista-auth/server';
${databaseImport}

// Configure your database
${
  answers.database !== "none"
    ? "// import { db } from './your-database-setup';"
    : ""
}

export const auth = createVistaAuth({
  // Database adapter
  ${databaseConfig}
  
  // JWT secret (use environment variable in production!)
  jwtSecret: process.env.VISTA_AUTH_SECRET || 'your-secret-key',
  
  // Session duration (7 days)
  sessionDuration: 7 * 24 * 60 * 60 * 1000,
  
  // Features
  ${
    answers.features.includes("websocket")
      ? "websocketUrl: process.env.WS_URL || 'ws://localhost:3000/ws/auth',"
      : ""
  }
  ${answers.features.includes("toast") ? "toastEnabled: true," : ""}
  ${
    answers.features.includes("indexeddb") ? "sessionStorage: 'indexedDB'," : ""
  }
  
  // Callbacks
  onSignIn: async (user) => {
    console.log('User signed in:', user.email);
  },
  onSignOut: async () => {
    console.log('User signed out');
  },
});
`;

  fs.writeFileSync(`vista-auth.config.${fileExt}`, config);
  console.log(`✓ Created vista-auth.config.${fileExt}`);
}

function createApiRoutes(answers) {
  if (answers.framework === "nextjs") {
    const isTypeScript = answers.language === "typescript";
    const fileExt = isTypeScript ? "ts" : "js";
    const requestType = isTypeScript ? ": NextRequest" : "";
    const imports = isTypeScript
      ? `import { NextRequest } from 'next/server';\n`
      : "";

    // Create signup route
    const signupRoute = `${imports}import { auth } from '@/vista-auth.config';

export async function POST(request${requestType}) {
  try {
    const body = await request.json();
    console.log('[Vista Auth] Signup attempt:', body.email);
    
    const result = await auth.signUp(body);
    console.log('[Vista Auth] Signup result:', result.success);
    
    return Response.json(result);
  } catch (error) {
    console.error('[Vista Auth] Signup error:', error);
    return Response.json(
      { success: false, error: 'Sign up failed' },
      { status: 500 }
    );
  }
}
`;

    // Create signin route
    const signinRoute = `${imports}import { auth } from '@/vista-auth.config';

export async function POST(request${requestType}) {
  try {
    const body = await request.json();
    console.log('[Vista Auth] Signin attempt:', body.email);
    
    const result = await auth.signIn(body);
    console.log('[Vista Auth] Signin result:', result.success);
    
    return Response.json(result);
  } catch (error) {
    console.error('[Vista Auth] Signin error:', error);
    return Response.json(
      { success: false, error: 'Sign in failed' },
      { status: 500 }
    );
  }
}
`;

    // Create signout route
    const signoutRoute = `${imports}import { auth } from '@/vista-auth.config';

export async function POST(request${requestType}) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    console.log('[Vista Auth] Signout attempt');
    
    if (token) {
      const payload = auth.verifyToken(token);
      const result = await auth.signOut(payload.sessionId);
      console.log('[Vista Auth] Signout result:', result.success);
      return Response.json(result);
    }
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('[Vista Auth] Signout error:', error);
    return Response.json(
      { success: false, error: 'Sign out failed' },
      { status: 500 }
    );
  }
}
`;

    // Create session route
    const sessionRoute = `${imports}import { auth } from '@/vista-auth.config';

export async function GET(request${requestType}) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    console.log('[Vista Auth] Session check');
    
    if (!token) {
      return Response.json({ success: false, error: 'No token provided' });
    }
    
    const result = await auth.getSession(token);
    console.log('[Vista Auth] Session result:', result.success);
    
    return Response.json(result);
  } catch (error) {
    console.error('[Vista Auth] Session error:', error);
    return Response.json(
      { success: false, error: 'Session validation failed' },
      { status: 500 }
    );
  }
}
`;

    // Create directories and files
    fs.mkdirSync("app/api/auth/signup", { recursive: true });
    fs.mkdirSync("app/api/auth/signin", { recursive: true });
    fs.mkdirSync("app/api/auth/signout", { recursive: true });
    fs.mkdirSync("app/api/auth/session", { recursive: true });

    fs.writeFileSync(`app/api/auth/signup/route.${fileExt}`, signupRoute);
    fs.writeFileSync(`app/api/auth/signin/route.${fileExt}`, signinRoute);
    fs.writeFileSync(`app/api/auth/signout/route.${fileExt}`, signoutRoute);
    fs.writeFileSync(`app/api/auth/session/route.${fileExt}`, sessionRoute);

    console.log(`✓ Created app/api/auth/signup/route.${fileExt}`);
    console.log(`✓ Created app/api/auth/signin/route.${fileExt}`);
    console.log(`✓ Created app/api/auth/signout/route.${fileExt}`);
    console.log(`✓ Created app/api/auth/session/route.${fileExt}`);
  }
}

function createProviderSetup(answers) {
  const isTypeScript = answers.language === "typescript";
  const fileExt = isTypeScript ? "tsx" : "jsx";

  const provider = `'use client';

import { AuthProvider } from 'vista-auth/client';${
    isTypeScript
      ? `
import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}`
      : ""
  }

export function Providers({ children }${
    isTypeScript ? ": ProvidersProps" : ""
  }) {
  return (
    <AuthProvider
      apiEndpoint="/api/auth"
      config={{
        ${
          answers.features.includes("websocket")
            ? "sessionSyncEnabled: true,"
            : ""
        }
        ${answers.features.includes("toast") ? "toastEnabled: true," : ""}
        ${
          answers.features.includes("indexeddb")
            ? "sessionStorage: 'indexedDB',"
            : ""
        }
      }}
    >
      {children}
    </AuthProvider>
  );
}
`;

  // Create auth-utils folder and put providers inside it
  fs.mkdirSync("auth-utils", { recursive: true });
  fs.writeFileSync(`auth-utils/providers.${fileExt}`, provider);
  console.log(`✓ Created auth-utils/providers.${fileExt}`);
}

function createExamples(answers) {
  const isTypeScript = answers.language === "typescript";
  const fileExt = isTypeScript ? "tsx" : "jsx";

  const loginExample = `'use client';

import { useAuth } from 'vista-auth/client';
import { useState${isTypeScript ? ", FormEvent" : ""} } from 'react';

export default function LoginPage() {
  const { signIn, signUp, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e${
    isTypeScript ? ": FormEvent<HTMLFormElement>" : ""
  }) => {
    e.preventDefault();
    
    try {
      if (isSignUp) {
        await signUp({ email, password, name });
      } else {
        await signIn({ email, password });
      }
    } catch (err) {
      console.error('Auth error:', err);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {isSignUp ? 'Sign Up' : 'Sign In'}
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required={isSignUp}
            />
          </div>
        )}
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
            minLength={6}
          />
        </div>
        
        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </button>
      </div>
    </div>
  );
}
`;

  fs.mkdirSync("examples", { recursive: true });
  fs.writeFileSync(`examples/login.${fileExt}`, loginExample);
  console.log(`✓ Created examples/login.${fileExt}`);

  if (answers.features.includes("rbac")) {
    const protectedExample = `'use client';

import { ProtectedRoute } from 'vista-auth/guards';
import { useAuth } from 'vista-auth/client';

export default function AdminPage() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <ProtectedRoute 
      roles={['admin']} 
      redirect="/examples/login"
      fallback={<div>Access denied. Admin role required.</div>}
    >
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Welcome, {user?.name}!</h2>
              <p className="text-gray-600">Email: {user?.email}</p>
              <p className="text-gray-600">Roles: {user?.roles?.join(', ')}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Admin Features</h3>
              <ul className="text-sm text-gray-600">
                <li>• User Management</li>
                <li>• System Settings</li>
                <li>• Analytics Dashboard</li>
                <li>• Security Logs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
`;
    fs.writeFileSync(`examples/protected-route.${fileExt}`, protectedExample);
    console.log(`✓ Created examples/protected-route.${fileExt}`);
  }

  // Create layout example with proper provider import
  const layoutExample = `import { Providers } from '../auth-utils/providers';${
    isTypeScript
      ? `
import './globals.css';

export const metadata = {
  title: 'Vista Auth Demo',
  description: 'Authentication demo with Vista Auth',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {`
      : `

export default function RootLayout({ children }) {`
  }
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
`;

  fs.writeFileSync(`examples/layout.${fileExt}`, layoutExample);
  console.log(
    `✓ Created examples/layout.${fileExt} (with correct provider import)`
  );
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Run CLI
init().catch(console.error);
