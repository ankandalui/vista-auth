/**
 * Vista Auth - Server Core
 * Server-side authentication logic
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import type {
  User,
  Session,
  AuthConfig,
  DatabaseAdapter,
  SignInCredentials,
  SignUpData,
  AuthResponse,
  AuthError,
} from '../types';

export class VistaAuthServer {
  private config: Required<Pick<AuthConfig, 'bcryptRounds' | 'jwtSecret' | 'jwtExpiresIn' | 'sessionDuration'>>;
  private database?: DatabaseAdapter;

  constructor(config: AuthConfig = {}) {
    this.config = {
      bcryptRounds: config.bcryptRounds || 10,
      jwtSecret: config.jwtSecret || process.env.VISTA_AUTH_SECRET || 'vista-auth-secret-change-in-production',
      jwtExpiresIn: config.jwtExpiresIn || '7d',
      sessionDuration: config.sessionDuration || 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    this.database = config.database;

    if (!config.jwtSecret && !process.env.VISTA_AUTH_SECRET) {
      console.warn('[Vista Auth] No JWT secret provided. Using default (INSECURE). Set VISTA_AUTH_SECRET environment variable.');
    }
  }

  /**
   * Hash a password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.config.bcryptRounds);
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  generateToken(payload: any): string {
    return jwt.sign(payload, this.config.jwtSecret);
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.config.jwtSecret);
    } catch (error) {
      return null;
    }
  }

  /**
   * Sign up a new user
   */
  async signUp(data: SignUpData): Promise<AuthResponse<{ user: User; token: string; session: Session }>> {
    try {
      if (!this.database) {
        throw this.createError('NO_DATABASE', 'Database adapter not configured', 500);
      }

      // Check if user already exists
      const existingUser = await this.database.findUserByEmail(data.email);
      if (existingUser) {
        throw this.createError('USER_EXISTS', 'User with this email already exists', 400);
      }

      // Hash password
      const hashedPassword = await this.hashPassword(data.password);

      // Create user
      const user = await this.database.createUser({
        id: nanoid(),
        email: data.email,
        name: data.name,
        roles: ['user'], // Default role
        permissions: [],
        metadata: {
          ...data.metadata,
          password: hashedPassword,
        },
      });

      // Remove password from user object
      const userWithoutPassword = this.sanitizeUser(user);

      // Create session
      const session = await this.createSession(user.id, userWithoutPassword);

      // Generate token with expiry
      const token = this.generateToken({ 
        userId: user.id, 
        sessionId: session.sessionId,
        exp: Math.floor(session.expiresAt / 1000),
        iat: Math.floor(session.createdAt / 1000)
      });

      return {
        success: true,
        data: {
          user: userWithoutPassword,
          token,
          session,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: this.normalizeError(error),
      };
    }
  }

  /**
   * Sign in a user
   */
  async signIn(credentials: SignInCredentials): Promise<AuthResponse<{ user: User; token: string; session: Session }>> {
    try {
      if (!this.database) {
        throw this.createError('NO_DATABASE', 'Database adapter not configured', 500);
      }

      // Find user
      const user = await this.database.findUserByEmail(credentials.email);
      if (!user) {
        throw this.createError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
      }

      // Verify password
      const passwordHash = user.metadata?.password;
      if (!passwordHash) {
        throw this.createError('NO_PASSWORD', 'User has no password set', 500);
      }

      const isValid = await this.verifyPassword(credentials.password, passwordHash);
      if (!isValid) {
        throw this.createError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
      }

      // Remove password from user object
      const userWithoutPassword = this.sanitizeUser(user);

      // Create session
      const session = await this.createSession(user.id, userWithoutPassword);

      // Generate token with expiry
      const token = this.generateToken({ 
        userId: user.id, 
        sessionId: session.sessionId,
        exp: Math.floor(session.expiresAt / 1000),
        iat: Math.floor(session.createdAt / 1000)
      });

      return {
        success: true,
        data: {
          user: userWithoutPassword,
          token,
          session,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: this.normalizeError(error),
      };
    }
  }

  /**
   * Get session from token
   */
  async getSession(token: string): Promise<AuthResponse<Session>> {
    try {
      const payload = this.verifyToken(token);
      if (!payload) {
        throw this.createError('INVALID_TOKEN', 'Invalid or expired token', 401);
      }

      if (!this.database) {
        throw this.createError('NO_DATABASE', 'Database adapter not configured', 500);
      }

      const user = await this.database.findUserById(payload.userId);
      if (!user) {
        throw this.createError('USER_NOT_FOUND', 'User not found', 404);
      }

      const userWithoutPassword = this.sanitizeUser(user);

      const session: Session = {
        sessionId: payload.sessionId,
        userId: user.id,
        user: userWithoutPassword,
        expiresAt: payload.exp * 1000,
        createdAt: payload.iat * 1000,
        lastActivity: Date.now(),
      };

      return {
        success: true,
        data: session,
      };
    } catch (error: any) {
      return {
        success: false,
        error: this.normalizeError(error),
      };
    }
  }

  /**
   * Sign out (invalidate session)
   */
  async signOut(sessionId: string): Promise<AuthResponse<void>> {
    try {
      if (this.database?.deleteSession) {
        await this.database.deleteSession(sessionId);
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: this.normalizeError(error),
      };
    }
  }

  /**
   * Create a session
   */
  private async createSession(userId: string, user: User): Promise<Session> {
    const sessionId = nanoid();
    const now = Date.now();
    const session: Session = {
      sessionId,
      userId,
      user,
      expiresAt: now + this.config.sessionDuration,
      createdAt: now,
      lastActivity: now,
    };

    if (this.database?.createSession) {
      return await this.database.createSession(userId, session);
    }

    return session;
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: User): User {
    const { metadata, ...rest } = user;
    const { password, ...cleanMetadata } = metadata || {};
    return {
      ...rest,
      metadata: cleanMetadata,
    };
  }

  /**
   * Create an auth error
   */
  private createError(code: string, message: string, statusCode: number = 400): AuthError {
    return { code, message, statusCode };
  }

  /**
   * Normalize error to AuthError
   */
  private normalizeError(error: any): AuthError {
    if (error.code && error.message) {
      return error as AuthError;
    }
    return {
      code: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      statusCode: 500,
    };
  }
}

// Export singleton instance
let serverInstance: VistaAuthServer | null = null;

export function createVistaAuth(config?: AuthConfig): VistaAuthServer {
  serverInstance = new VistaAuthServer(config);
  return serverInstance;
}

export function getVistaAuth(): VistaAuthServer {
  if (!serverInstance) {
    throw new Error('[Vista Auth] Server not initialized. Call createVistaAuth() first.');
  }
  return serverInstance;
}
