# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to [ankandalui25@gmail.com](mailto:ankandalui25@gmail.com).

Include the following information:

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- **Response Time:** We aim to respond within 48 hours
- **Fix Timeline:** Critical vulnerabilities will be addressed within 7 days
- **Credit:** You will be credited in the security advisory (if desired)
- **Disclosure:** We follow responsible disclosure practices

## Security Best Practices

When using Vista Auth, follow these security best practices:

### 1. JWT Secret

- Use a strong, randomly generated secret (at least 32 characters)
- Store it in environment variables, never in code
- Rotate secrets periodically

```bash
# Generate a secure secret
openssl rand -base64 32
```

### 2. Password Security

- Use bcrypt rounds ≥ 10 (default is 10, increase for higher security)
- Enforce password strength requirements in your application
- Implement rate limiting on authentication endpoints

### 3. Session Management

- Set appropriate session duration (default is 7 days)
- Implement session cleanup for expired sessions
- Consider using IndexedDB for sensitive session data

### 4. HTTPS

- Always use HTTPS in production
- Set secure cookie flags when using cookies
- Enable HSTS headers

### 5. Database Security

- Use parameterized queries (all adapters do this by default)
- Regularly update database credentials
- Enable database encryption at rest

### 6. Rate Limiting

Implement rate limiting on authentication endpoints:

```typescript
// Example with Express
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many authentication attempts, please try again later",
});

app.post("/api/auth", authLimiter, async (req, res) => {
  // Your auth logic
});
```

### 7. Input Validation

Always validate and sanitize user input:

```typescript
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): boolean {
  return password.length >= 8;
}
```

### 8. CORS Configuration

Configure CORS properly:

```typescript
// Example with Express
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(","),
    credentials: true,
  })
);
```

### 9. Environment Variables

Required environment variables:

```env
# Required
VISTA_AUTH_SECRET=your-strong-secret-key

# Optional but recommended
NODE_ENV=production
DATABASE_URL=your-database-url
ALLOWED_ORIGINS=https://yourdomain.com
```

### 10. Regular Updates

- Keep Vista Auth updated to the latest version
- Monitor security advisories
- Update dependencies regularly

## Known Security Considerations

### JWT Tokens

- JWTs are signed, not encrypted. Don't store sensitive data in tokens.
- Token expiration is enforced. Ensure proper session management.
- Tokens are stateless. For revocation, maintain a session blacklist.

### Password Hashing

- Uses bcrypt with configurable rounds (default: 10)
- Passwords are never stored in plain text
- Timing-safe comparison is used

### Session Storage

- Client-side storage (localStorage, sessionStorage) is vulnerable to XSS
- Use IndexedDB for sensitive data
- Consider server-side session storage for critical applications

## Security Audit

Vista Auth has not yet undergone a formal security audit. We welcome security researchers to review our code and report findings responsibly.

## Bug Bounty Program

We do not currently have a bug bounty program, but we deeply appreciate responsible disclosure and will credit researchers who report valid vulnerabilities.

## Contact

For security concerns, contact: [ankandalui25@gmail.com](mailto:ankandalui25@gmail.com)

For general questions, use [GitHub Discussions](https://github.com/ankandalui/vista-auth/discussions).

---

**Last Updated:** November 7, 2025
