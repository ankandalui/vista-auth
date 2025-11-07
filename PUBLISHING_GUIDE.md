# 📦 Publishing Vista Auth to NPM - Complete Guide

## What You Have

✅ **NPM Package** - Complete library with React hooks, server logic, database adapters
✅ **CLI Tool** - Built-in `npx vista-auth init` command for auto-setup
✅ **Both in One Package** - Users get everything with one install

## 🚀 Publishing Steps

### Step 1: Login to NPM

```bash
npm login
```

Enter:

- **Username**: Your NPM username
- **Password**: Your NPM password
- **Email**: Your NPM email
- **OTP**: One-time password (if 2FA enabled)

### Step 2: Verify Package

Check if the package name is available:

```bash
npm view vista-auth
```

If it shows "404", the name is available! ✅

If someone already owns `vista-auth`, you'll need to:

- Use a scoped package: `@ankandalui/vista-auth`
- Or choose a different name: `vistaauth`, `vista-authentication`, etc.

### Step 3: Build the Package

```bash
cd "d:\My github Webs\vista\packages\vista-auth"
npm run build
```

This creates the `dist/` folder with all compiled files.

### Step 4: Test Locally (Optional but Recommended)

Test your package locally before publishing:

```bash
# In vista-auth directory
npm pack
```

This creates a `.tgz` file you can test install in another project:

```bash
# In another project
npm install path/to/vista-auth-1.0.0.tgz
```

### Step 5: Publish to NPM

```bash
cd "d:\My github Webs\vista\packages\vista-auth"
npm publish
```

**If the name is taken**, publish as a scoped package:

```bash
npm publish --access public
```

### Step 6: Verify Published Package

```bash
npm view vista-auth
```

You should see your package info!

## ✅ After Publishing - How Users Install

### Option 1: Install Package

```bash
npm install vista-auth
```

Then use in their code:

```tsx
import { useAuth, AuthProvider } from "vista-auth/client";
import { createVistaAuth } from "vista-auth/server";
import { ProtectedRoute } from "vista-auth/guards";
```

### Option 2: Use CLI for Auto-Setup

```bash
npx vista-auth init
```

This runs your CLI tool that:

- Asks about framework (Next.js, Remix, etc.)
- Asks about database (Prisma, MongoDB, etc.)
- Generates all necessary files
- Creates example components

**Note**: `npx vista-auth init` automatically downloads and runs the CLI without installing the package permanently.

## 📝 What Your Package Includes

### 1. Main Library

Users can import authentication functionality:

```tsx
// Client-side (React)
import { useAuth, AuthProvider } from "vista-auth/client";

// Server-side
import { createVistaAuth } from "vista-auth/server";

// Route guards
import { ProtectedRoute } from "vista-auth/guards";

// Middleware
import { createNextMiddleware } from "vista-auth/middleware";

// Database adapters
import { createPrismaAdapter } from "vista-auth/database";

// UI helpers
import { showToast, showError } from "vista-auth/ui";
```

### 2. CLI Tool

Users can run auto-setup:

```bash
npx vista-auth init
```

The CLI binary is defined in package.json:

```json
"bin": {
  "vista-auth": "./bin/cli.js"
}
```

## 🔄 Updating Your Package

When you make changes:

1. **Update version** in package.json:

   ```json
   "version": "1.0.1"  // or 1.1.0, 2.0.0, etc.
   ```

2. **Rebuild**:

   ```bash
   npm run build
   ```

3. **Publish update**:
   ```bash
   npm publish
   ```

### Version Guidelines (Semantic Versioning)

- **1.0.0 → 1.0.1** - Bug fixes (patch)
- **1.0.0 → 1.1.0** - New features (minor)
- **1.0.0 → 2.0.0** - Breaking changes (major)

## 🎯 Example User Workflow

### User installs your package:

```bash
npm install vista-auth
```

### User runs CLI for quick setup:

```bash
npx vista-auth init
```

CLI asks:

- Which framework? → Next.js
- Which database? → Prisma
- Select features? → RBAC, Toast, WebSocket

CLI creates:

- ✅ `vista-auth.config.ts`
- ✅ `app/api/auth/[...vistaauth]/route.ts`
- ✅ `app/providers.tsx`
- ✅ `examples/login.jsx`
- ✅ `examples/protected-route.jsx`

### User wraps app with provider:

```tsx
import { AuthProvider } from "vista-auth/client";

<AuthProvider apiEndpoint="/api/auth">{children}</AuthProvider>;
```

### User uses authentication:

```tsx
import { useAuth } from "vista-auth/client";

const { signIn, user, isAuthenticated } = useAuth();
```

## 📊 Your Package Structure

```json
{
  "name": "vista-auth",
  "version": "1.0.0",
  "main": "./dist/index.js", // Main entry point
  "types": "./dist/index.d.ts", // TypeScript types
  "bin": {
    "vista-auth": "./bin/cli.js" // CLI command
  },
  "exports": {
    ".": "./dist/index.js", // import from 'vista-auth'
    "./client": "./dist/client/...", // import from 'vista-auth/client'
    "./server": "./dist/server/...", // import from 'vista-auth/server'
    "./guards": "./dist/guards/...", // import from 'vista-auth/guards'
    "./middleware": "./dist/middleware/...",
    "./database": "./dist/database/...",
    "./ui": "./dist/ui/..."
  }
}
```

## 🎉 What Makes This Special

You've created **BOTH**:

1. **📦 NPM Package** - Library users can import
2. **🧙 CLI Tool** - Auto-setup command users can run

Most packages are one or the other. You have both in one!

Examples:

- ✅ `create-react-app` - CLI only
- ✅ `react` - Package only
- ✅ **vista-auth** - BOTH! 🚀

## 🐛 Troubleshooting

### "Package name taken"

Change to scoped package:

```json
"name": "@ankandalui/vista-auth"
```

Then publish:

```bash
npm publish --access public
```

Users install:

```bash
npm install @ankandalui/vista-auth
npx @ankandalui/vista-auth init
```

### "Need to authenticate"

Run:

```bash
npm login
```

### "prepublishOnly script failed"

Make sure build succeeds:

```bash
npm run build
```

## 📢 After Publishing

1. ✅ Push to GitHub:

   ```bash
   git add .
   git commit -m "Published vista-auth v1.0.0"
   git push
   ```

2. ✅ Create a GitHub Release
3. ✅ Share on Twitter/Reddit/Dev.to
4. ✅ Add badge to README:
   ```markdown
   ![npm](https://img.shields.io/npm/v/vista-auth)
   ![downloads](https://img.shields.io/npm/dm/vista-auth)
   ```

## 🎯 Quick Publish Commands

```bash
# 1. Login
npm login

# 2. Navigate to package
cd "d:\My github Webs\vista\packages\vista-auth"

# 3. Build
npm run build

# 4. Publish
npm publish

# 5. Verify
npm view vista-auth
```

---

**Your package is ready to publish! 🚀**

Users will be able to:

- `npm install vista-auth`
- `npx vista-auth init`
- Import and use all features

Both library AND CLI in one package! 🎉
