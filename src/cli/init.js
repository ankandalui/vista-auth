#!/usr/bin/env node

/**
 * Vista Auth CLI
 * Auto-setup tool for quick integration
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { prompts } = require("./prompts");

// Package installation helper
const installPackages = (packages, dev = false) => {
  const flag = dev ? "--save-dev" : "--save";
  const command = `npm install ${flag} ${packages.join(" ")}`;

  console.log(`\n📦 Installing packages: ${packages.join(", ")}`);
  console.log(`Running: ${command}`);

  try {
    execSync(command, { stdio: "inherit" });
    console.log("✅ Packages installed successfully!");
  } catch (error) {
    console.error("❌ Failed to install packages:", error.message);
    console.log("You can install them manually later:");
    console.log(`npm install ${flag} ${packages.join(" ")}`);
  }
};

// Database package mappings
const DATABASE_PACKAGES = {
  prisma: {
    packages: ["@prisma/client"],
    devPackages: ["prisma"],
  },
  mongodb: {
    packages: ["mongodb"],
    devPackages: [],
  },
  supabase: {
    packages: ["@supabase/supabase-js"],
    devPackages: [],
  },
  postgres: {
    packages: ["pg"],
    devPackages: ["@types/pg"],
  },
  firebase: {
    packages: ["firebase-admin"],
    devPackages: [],
  },
};

// Schema generation functions
const generatePrismaSchema = () => {
  const schema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // Change to "mysql", "sqlite", etc. as needed
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String?
  roles       String[]
  permissions String[]
  metadata    Json?
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  sessions Session[]
  
  @@map("users")
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  expiresAt    DateTime
  data         Json?
  
  // Timestamps
  createdAt DateTime @default(now())
  
  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("sessions")
}
`;

  const envExample = `# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mydb?schema=public"

# Vista Auth
VISTA_AUTH_SECRET="your-super-secure-secret-key"
`;

  // Create prisma directory
  if (!fs.existsSync("prisma")) {
    fs.mkdirSync("prisma");
  }

  fs.writeFileSync("prisma/schema.prisma", schema);
  fs.writeFileSync(".env.example", envExample);

  console.log("✅ Generated Prisma schema with User and Session models");
  console.log("✅ Generated .env.example with database configuration");
  console.log("\n📝 Next steps:");
  console.log("1. Copy .env.example to .env and update DATABASE_URL");
  console.log("2. Run: npx prisma migrate dev --name init");
  console.log("3. Run: npx prisma generate");
};

const generateMongoDBSetup = () => {
  const connectionFile = `/**
 * MongoDB Connection Setup for Vista Auth
 */
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB_NAME || 'vista-auth';

let client: MongoClient;
let db: any;

export async function connectMongoDB() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    
    // Create indexes for better performance
    await createIndexes();
    
    console.log('✅ Connected to MongoDB');
  }
  return db;
}

async function createIndexes() {
  // Users collection indexes
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ 'roles': 1 });
  
  // Sessions collection indexes  
  await db.collection('sessions').createIndex({ userId: 1 });
  await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  
  console.log('✅ Created MongoDB indexes');
}

export async function closeMongoDB() {
  if (client) {
    await client.close();
  }
}

export { db };
`;

  const envExample = `# MongoDB
MONGODB_URI="mongodb://localhost:27017"
MONGODB_DB_NAME="vista-auth"

# Vista Auth
VISTA_AUTH_SECRET="your-super-secure-secret-key"
`;

  fs.writeFileSync("mongodb-setup.ts", connectionFile);
  fs.writeFileSync(".env.example", envExample);

  console.log("✅ Generated MongoDB connection setup with indexes");
  console.log("✅ Generated .env.example with MongoDB configuration");
  console.log("\n📝 Next steps:");
  console.log("1. Copy .env.example to .env and update MONGODB_URI");
  console.log("2. Import and call connectMongoDB() in your app");
};

const generateSupabaseSetup = () => {
  const clientFile = `/**
 * Supabase Client Setup for Vista Auth
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
`;

  const sqlSchema = `-- Vista Auth Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  roles TEXT[] DEFAULT ARRAY['user'],
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  data JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_roles_idx ON users USING GIN(roles);
CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE USING (auth.uid()::text = user_id::text);
`;

  const envExample = `# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Vista Auth
VISTA_AUTH_SECRET="your-super-secure-secret-key"
`;

  fs.writeFileSync("supabase-client.ts", clientFile);
  fs.writeFileSync("supabase-schema.sql", sqlSchema);
  fs.writeFileSync(".env.example", envExample);

  console.log("✅ Generated Supabase client setup");
  console.log("✅ Generated SQL schema with RLS policies");
  console.log("✅ Generated .env.example with Supabase configuration");
  console.log("\n📝 Next steps:");
  console.log("1. Copy .env.example to .env and update Supabase credentials");
  console.log("2. Run the SQL schema in your Supabase SQL Editor");
  console.log("3. Import and use the supabase client in your app");
};

const generatePostgresSetup = () => {
  const connectionFile = `/**
 * PostgreSQL Connection Setup for Vista Auth
 */
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Create users table
    await query(\`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        roles TEXT[] DEFAULT ARRAY['user'],
        permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    \`);

    // Create sessions table
    await query(\`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        data JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    \`);

    // Create indexes
    await query('CREATE INDEX IF NOT EXISTS users_email_idx ON users(email)');
    await query('CREATE INDEX IF NOT EXISTS users_roles_idx ON users USING GIN(roles)');
    await query('CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id)');
    await query('CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at)');

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

export { pool };
`;

  const envExample = `# PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/vista_auth"

# Vista Auth
VISTA_AUTH_SECRET="your-super-secure-secret-key"
`;

  fs.writeFileSync("postgres-setup.ts", connectionFile);
  fs.writeFileSync(".env.example", envExample);

  console.log("✅ Generated PostgreSQL connection setup");
  console.log("✅ Generated .env.example with PostgreSQL configuration");
  console.log("\n📝 Next steps:");
  console.log("1. Copy .env.example to .env and update DATABASE_URL");
  console.log("2. Import and call initializeDatabase() in your app");
  console.log("3. Use the query function for database operations");
};

const generateFirebaseSetup = () => {
  const configFile = `/**
 * Firebase Configuration for Vista Auth
 */
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
`;

  const rulesFile = `// Firestore Security Rules for Vista Auth
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only access their own document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Sessions collection - users can only access their own sessions
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Public read access for certain collections (customize as needed)
    match /public/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
`;

  const envExample = `# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"

# Vista Auth
VISTA_AUTH_SECRET="your-super-secure-secret-key"
`;

  fs.writeFileSync("firebase-config.ts", configFile);
  fs.writeFileSync("firestore.rules", rulesFile);
  fs.writeFileSync(".env.example", envExample);

  console.log("✅ Generated Firebase configuration");
  console.log("✅ Generated Firestore security rules");
  console.log("✅ Generated .env.example with Firebase configuration");
  console.log("\n📝 Next steps:");
  console.log("1. Copy .env.example to .env and update Firebase credentials");
  console.log(
    "2. Deploy Firestore rules: firebase deploy --only firestore:rules"
  );
  console.log("3. Import and use Firebase services in your app");
};

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

  // Install database packages and generate schemas
  if (answers.database && answers.database !== "none") {
    console.log(`\n🔧 Setting up ${answers.database.toUpperCase()}...`);

    try {
      // Install required packages
      const packages = DATABASE_PACKAGES[answers.database];
      if (packages && packages.length > 0) {
        console.log(`📦 Installing packages: ${packages.join(", ")}`);
        await installPackages(packages);
      }

      // Generate database schemas and config files
      switch (answers.database) {
        case "prisma":
          generatePrismaSchema();
          break;
        case "mongodb":
          generateMongoDBSetup();
          break;
        case "supabase":
          generateSupabaseSetup();
          break;
        case "postgres":
          generatePostgresSetup();
          break;
        case "firebase":
          generateFirebaseSetup();
          break;
        default:
          console.log(`✅ ${answers.database} packages installed successfully`);
      }

      console.log(`🎉 ${answers.database.toUpperCase()} setup completed!\n`);
    } catch (error) {
      console.error(`❌ Error setting up ${answers.database}:`, error.message);
      console.log(
        "⚠️  You can install packages manually and continue with file generation.\n"
      );
    }
  }

  console.log("📦 Creating files...\n");

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

  // Handle database adapter import - use localStorage-first for localStorage persistence
  const databaseImport =
    answers.database === "none"
      ? `import { createLocalStorageFirstAdapter } from 'vista-auth/database';`
      : `import { create${capitalize(
          answers.database
        )}Adapter } from 'vista-auth/database';`;

  const databaseConfig =
    answers.database === "none"
      ? "database: createLocalStorageFirstAdapter(), // Hybrid: server memory + localStorage sync"
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
