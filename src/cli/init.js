#!/usr/bin/env node

/**
 * Vista Auth CLI
 * Auto-setup tool for quick integration
 */

const fs = require('fs');
const path = require('path');
const { prompts } = require('./prompts');

async function init() {
  console.log('🔐 Vista Auth Setup\n');

  const answers = await prompts([
    {
      type: 'select',
      name: 'framework',
      message: 'Which framework are you using?',
      choices: [
        { title: 'Next.js', value: 'nextjs' },
        { title: 'Remix', value: 'remix' },
        { title: 'Vite + React', value: 'vite' },
        { title: 'Create React App', value: 'cra' },
        { title: 'Express', value: 'express' },
        { title: 'Other', value: 'other' },
      ],
    },
    {
      type: 'select',
      name: 'database',
      message: 'Which database will you use?',
      choices: [
        { title: 'Prisma', value: 'prisma' },
        { title: 'MongoDB', value: 'mongodb' },
        { title: 'Supabase', value: 'supabase' },
        { title: 'PostgreSQL', value: 'postgres' },
        { title: 'Firebase', value: 'firebase' },
        { title: 'None (localStorage only)', value: 'none' },
      ],
    },
    {
      type: 'multiselect',
      name: 'features',
      message: 'Select features to enable:',
      choices: [
        { title: 'Role-based access control', value: 'rbac', selected: true },
        { title: 'WebSocket session sync', value: 'websocket' },
        { title: 'Toast notifications', value: 'toast', selected: true },
        { title: 'IndexedDB offline support', value: 'indexeddb' },
      ],
    },
  ]);

  console.log('\n📦 Creating files...\n');

  // Create config file
  createConfigFile(answers);

  // Create auth API routes
  createApiRoutes(answers);

  // Create provider setup
  createProviderSetup(answers);

  // Create example components
  createExamples(answers);

  console.log('\n✅ Setup complete!\n');
  console.log('Next steps:');
  console.log('1. Configure your database in the auth config');
  console.log('2. Wrap your app with <AuthProvider>');
  console.log('3. Use useAuth() hook in your components');
  console.log('\nDocs: https://github.com/vista-auth/vista-auth\n');
}

function createConfigFile(answers) {
  const config = `import { createVistaAuth } from 'vista-auth/server';
import { create${capitalize(answers.database)}Adapter } from 'vista-auth/database';

// Configure your database
// import { db } from './your-database-setup';

export const auth = createVistaAuth({
  // Database adapter
  // database: create${capitalize(answers.database)}Adapter(db),
  
  // JWT secret (use environment variable in production!)
  jwtSecret: process.env.VISTA_AUTH_SECRET || 'your-secret-key',
  
  // Session duration (7 days)
  sessionDuration: 7 * 24 * 60 * 60 * 1000,
  
  // Features
  ${answers.features.includes('websocket') ? "websocketUrl: process.env.WS_URL || 'ws://localhost:3000/ws/auth'," : ''}
  ${answers.features.includes('toast') ? 'toastEnabled: true,' : ''}
  ${answers.features.includes('indexeddb') ? "sessionStorage: 'indexedDB'," : ''}
  
  // Callbacks
  onSignIn: async (user) => {
    console.log('User signed in:', user.email);
  },
  onSignOut: async () => {
    console.log('User signed out');
  },
});
`;

  fs.writeFileSync('vista-auth.config.js', config);
  console.log('✓ Created vista-auth.config.js');
}

function createApiRoutes(answers) {
  if (answers.framework === 'nextjs') {
    const routeHandler = `import { auth } from '@/vista-auth.config';

export async function POST(request) {
  const body = await request.json();
  
  if (request.url.includes('/signin')) {
    const result = await auth.signIn(body);
    return Response.json(result);
  }
  
  if (request.url.includes('/signup')) {
    const result = await auth.signUp(body);
    return Response.json(result);
  }
  
  if (request.url.includes('/signout')) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const payload = auth.verifyToken(token);
    const result = await auth.signOut(payload.sessionId);
    return Response.json(result);
  }
  
  return Response.json({ error: 'Invalid endpoint' }, { status: 404 });
}

export async function GET(request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const result = await auth.getSession(token);
  return Response.json(result);
}
`;

    fs.mkdirSync('app/api/auth', { recursive: true });
    fs.writeFileSync('app/api/auth/route.js', routeHandler);
    console.log('✓ Created app/api/auth/route.js');
  }
}

function createProviderSetup(answers) {
  const provider = `'use client';

import { AuthProvider } from 'vista-auth/client';

export function Providers({ children }) {
  return (
    <AuthProvider
      apiEndpoint="/api/auth"
      config={{
        ${answers.features.includes('websocket') ? "sessionSyncEnabled: true," : ''}
        ${answers.features.includes('toast') ? 'toastEnabled: true,' : ''}
        ${answers.features.includes('indexeddb') ? "sessionStorage: 'indexedDB'," : ''}
      }}
    >
      {children}
    </AuthProvider>
  );
}
`;

  fs.writeFileSync('providers.jsx', provider);
  console.log('✓ Created providers.jsx');
}

function createExamples(answers) {
  const loginExample = `'use client';

import { useAuth } from 'vista-auth/client';
import { useState } from 'react';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp) {
      await signUp({ email, password });
    } else {
      await signIn({ email, password });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>{isSignUp ? 'Sign Up' : 'Sign In'}</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">{isSignUp ? 'Sign Up' : 'Sign In'}</button>
      <button type="button" onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? 'Already have an account?' : 'Need an account?'}
      </button>
    </form>
  );
}
`;

  fs.mkdirSync('examples', { recursive: true });
  fs.writeFileSync('examples/login.jsx', loginExample);
  console.log('✓ Created examples/login.jsx');

  if (answers.features.includes('rbac')) {
    const protectedExample = `'use client';

import { ProtectedRoute } from 'vista-auth/guards';
import { useAuth } from 'vista-auth/client';

export default function AdminPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute roles={['admin']} redirect="/login">
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user?.name}!</p>
    </ProtectedRoute>
  );
}
`;
    fs.writeFileSync('examples/protected-route.jsx', protectedExample);
    console.log('✓ Created examples/protected-route.jsx');
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Run CLI
init().catch(console.error);
