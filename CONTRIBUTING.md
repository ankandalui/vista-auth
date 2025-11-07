# Contributing to Vista Auth

Thank you for your interest in contributing to Vista Auth! 🎉 We welcome contributions from everyone, whether you're fixing a bug, adding a feature, or improving documentation.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [ankandalui25@gmail.com](mailto:ankandalui25@gmail.com).

---

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/ankandalui/vista-auth/issues) to avoid duplicates.

**When filing a bug report, include:**

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Screenshots (if applicable)
- Your environment (OS, Node version, framework version)
- Code samples or error messages

**Example Bug Report:**

```markdown
**Title:** JWT token verification fails with custom secret

**Description:**
When using a custom JWT secret longer than 64 characters, token verification throws an error.

**Steps to Reproduce:**

1. Set `VISTA_AUTH_SECRET` to a 128-character string
2. Create a user with `signUp()`
3. Try to verify the token with `getSession()`

**Expected:** Token should verify successfully
**Actual:** Throws "invalid signature" error

**Environment:**

- Node: v20.0.0
- Next.js: 14.0.0
- vista-auth: 1.0.1
```

### Suggesting Enhancements

Enhancement suggestions are tracked as [GitHub issues](https://github.com/ankandalui/vista-auth/issues).

**When suggesting an enhancement, include:**

- A clear and descriptive title
- Detailed description of the proposed feature
- Why this enhancement would be useful
- Possible implementation approach
- Examples of how it would be used

### First-Time Contributors

Look for issues labeled with:

- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `documentation` - Documentation improvements
- `bug` - Something isn't working

### Areas to Contribute

1. **Core Features**

   - Database adapters for new databases
   - Framework integrations (Angular, Svelte, etc.)
   - Performance optimizations
   - Security improvements

2. **Documentation**

   - Fix typos or unclear explanations
   - Add more examples
   - Create video tutorials
   - Translate to other languages

3. **Testing**

   - Write unit tests
   - Write integration tests
   - Test with different frameworks
   - Performance benchmarks

4. **UI/UX**

   - Improve toast notifications
   - Add more UI helpers
   - Create example templates

5. **Developer Experience**
   - Improve CLI tool
   - Add more code generation
   - Better error messages
   - IDE extensions

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Git
- A GitHub account
- Basic knowledge of TypeScript and React

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/vista-auth.git
   cd vista-auth
   ```
3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/ankandalui/vista-auth.git
   ```

---

## 💻 Development Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Build the project:**

   ```bash
   npm run build
   ```

3. **Run in development mode:**

   ```bash
   npm run dev
   ```

4. **Link locally for testing:**

   ```bash
   npm link

   # In your test project
   npm link vista-auth
   ```

5. **Test your changes:**
   ```bash
   npm test
   ```

### Project Structure

```
vista-auth/
├── src/
│   ├── client/          # Client-side React code
│   │   ├── provider.tsx # Auth provider and context
│   │   ├── storage.ts   # Storage management
│   │   └── websocket.ts # Real-time sync
│   ├── server/          # Server-side code
│   │   ├── core.ts      # Core authentication logic
│   │   └── index.ts     # Server exports
│   ├── guards/          # Route guards and HOCs
│   ├── middleware/      # Framework middleware
│   ├── database/        # Database adapters
│   ├── ui/              # UI helpers
│   ├── cli/             # CLI tool
│   └── types.ts         # TypeScript types
├── bin/
│   └── cli.js           # CLI entry point
├── dist/                # Built files (generated)
├── tests/               # Test files
└── examples/            # Example implementations
```

---

## 🔨 Making Changes

### Branch Naming

Use descriptive branch names:

- `feature/add-redis-adapter`
- `fix/jwt-expiration-bug`
- `docs/improve-quickstart`
- `refactor/simplify-storage`

```bash
git checkout -b feature/your-feature-name
```

### Keep Your Fork Updated

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

### Making Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <subject>

# Types:
feat:     New feature
fix:      Bug fix
docs:     Documentation only
style:    Code style (formatting, missing semicolons, etc.)
refactor: Code change that neither fixes a bug nor adds a feature
perf:     Performance improvement
test:     Adding or updating tests
chore:    Changes to build process or auxiliary tools
```

**Examples:**

```bash
git commit -m "feat(database): add Redis adapter"
git commit -m "fix(jwt): handle token expiration correctly"
git commit -m "docs(readme): add Supabase example"
git commit -m "test(auth): add unit tests for signIn"
```

---

## 📝 Commit Guidelines

### Good Commits

✅ **DO:**

- Write clear, concise commit messages
- Keep commits focused on a single change
- Reference issue numbers when applicable
- Test your changes before committing

**Example:**

```bash
feat(middleware): add support for Fastify

- Implement createFastifyMiddleware function
- Add public paths and role-based routing
- Include TypeScript types
- Add usage example to README

Closes #42
```

❌ **DON'T:**

- Make commits with vague messages like "fix stuff" or "update"
- Mix multiple unrelated changes in one commit
- Commit commented-out code or debug logs
- Include large binary files

---

## 🔄 Pull Request Process

### Before Submitting

1. **Update your branch:**

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests:**

   ```bash
   npm test
   ```

3. **Build successfully:**

   ```bash
   npm run build
   ```

4. **Update documentation** if needed

5. **Check code style:**
   ```bash
   npm run lint
   ```

### Creating a Pull Request

1. **Push to your fork:**

   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a PR** on GitHub from your fork to `ankandalui/vista-auth:main`

3. **Fill out the PR template:**

```markdown
## Description

Brief description of what this PR does

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issue

Closes #(issue number)

## How Has This Been Tested?

Describe the tests you ran

## Checklist

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### Review Process

1. **Maintainers will review** your PR within 3-5 days
2. **Address feedback** by pushing new commits to your branch
3. **Keep the PR updated** if main branch changes
4. **Be patient and respectful** during review

### After Your PR is Merged

1. **Delete your branch:**

   ```bash
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

2. **Update your main branch:**
   ```bash
   git checkout main
   git pull upstream main
   git push origin main
   ```

---

## 🎨 Coding Standards

### TypeScript

- Use TypeScript for all new code
- Provide proper type definitions
- Avoid `any` types when possible
- Use interfaces for objects, types for unions

**Example:**

```typescript
// Good ✅
interface User {
  id: string;
  email: string;
  roles?: string[];
}

async function getUser(id: string): Promise<User | null> {
  // implementation
}

// Bad ❌
async function getUser(id: any): Promise<any> {
  // implementation
}
```

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons at end of statements
- Use async/await instead of promises when possible
- Keep functions small and focused

**Example:**

```typescript
// Good ✅
async function signIn(credentials: Credentials): Promise<AuthResult> {
  const user = await findUser(credentials.email);

  if (!user) {
    throw new Error("User not found");
  }

  const isValid = await verifyPassword(credentials.password, user.passwordHash);

  if (!isValid) {
    throw new Error("Invalid password");
  }

  return createSession(user);
}

// Bad ❌
async function signIn(creds: any) {
  const u = await findUser(creds.email);
  if (!u) throw new Error("User not found");
  const v = await verifyPassword(creds.password, u.passwordHash);
  if (!v) throw new Error("Invalid password");
  return createSession(u);
}
```

### React Components

- Use functional components with hooks
- Extract complex logic into custom hooks
- Provide proper PropTypes or TypeScript interfaces
- Use meaningful component and prop names

**Example:**

```tsx
// Good ✅
interface LoginFormProps {
  onSubmit: (credentials: Credentials) => void;
  isLoading?: boolean;
}

export function LoginForm({ onSubmit, isLoading = false }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, password });
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

### Documentation in Code

````typescript
/**
 * Signs in a user with email and password
 *
 * @param credentials - User email and password
 * @returns Promise resolving to auth result with user and session
 * @throws Error if credentials are invalid
 *
 * @example
 * ```typescript
 * const result = await auth.signIn({
 *   email: 'user@example.com',
 *   password: 'secret123'
 * });
 * ```
 */
async function signIn(credentials: Credentials): Promise<AuthResult> {
  // implementation
}
````

---

## 🧪 Testing

### Writing Tests

We use Jest for testing. Tests should be placed in `__tests__` directories or named `*.test.ts`.

**Example Test:**

```typescript
// src/server/__tests__/core.test.ts
import { createVistaAuth } from "../core";

describe("VistaAuth", () => {
  let auth: ReturnType<typeof createVistaAuth>;

  beforeEach(() => {
    auth = createVistaAuth({
      jwtSecret: "test-secret",
      database: null,
    });
  });

  describe("signUp", () => {
    it("should create a new user", async () => {
      const result = await auth.signUp({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      });

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe("test@example.com");
    });

    it("should hash the password", async () => {
      const result = await auth.signUp({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.user?.passwordHash).not.toBe("password123");
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- core.test.ts
```

---

## 📖 Documentation

### Updating Documentation

When making changes, update relevant documentation:

1. **README.md** - Main documentation
2. **Code comments** - Inline documentation
3. **Examples** - Usage examples
4. **TypeScript types** - Type definitions

### Documentation Style

- Use clear, simple language
- Provide code examples for features
- Include both simple and advanced examples
- Keep examples up-to-date with code changes
- Add links to related documentation

---

## 🏆 Recognition

Contributors are recognized in several ways:

1. **README Credits** - Listed in the README
2. **Release Notes** - Mentioned in release notes
3. **All Contributors Bot** - Automatic recognition
4. **Swag** - Stickers and t-shirts for significant contributions (coming soon!)

---

## 💬 Getting Help

- **GitHub Discussions:** [Ask questions](https://github.com/ankandalui/vista-auth/discussions)
- **GitHub Issues:** [Report bugs](https://github.com/ankandalui/vista-auth/issues)
- **Email:** ankandalui25@gmail.com
- **Discord:** (coming soon!)

---

## 📜 License

By contributing to Vista Auth, you agree that your contributions will be licensed under the MIT License.

---

## 🙏 Thank You!

Your contributions make Vista Auth better for everyone. Whether you're fixing a typo or adding a major feature, we appreciate your time and effort!

**Happy Coding! 🚀**

---

_This contributing guide is adapted from open-source best practices and the [Contributor Covenant](https://www.contributor-covenant.org/)._
