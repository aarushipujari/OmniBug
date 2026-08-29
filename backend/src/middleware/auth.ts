import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { store } from '../data/store.js';
import { User } from '../types/index.js';

// Extend Express Request to include authenticated user & session metadata
declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
      authMode?: 'signed_token' | 'demo_persona_simulation';
    }
  }
}

// Session signing secret (for demo/standalone environments, fallback to deterministic secret)
const HMAC_SECRET = process.env.SESSION_SECRET || 'omnibug-hmac-session-signing-secret-2026';

/**
 * Generate a cryptographically signed HMAC session token
 */
export function generateSessionToken(userId: string): string {
  const timestamp = Date.now();
  const payload = `${userId}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64url');
}

/**
 * Verify a signed HMAC session token
 */
export function verifySessionToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return null;
    const [userId, timestampStr, signature] = parts;
    const payload = `${userId}:${timestampStr}`;
    const expectedHmac = crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');

    // Constant-time comparison
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac))) {
      return null;
    }
    return userId;
  } catch {
    return null;
  }
}

/**
 * Authentication Middleware:
 * 1. Checks `Authorization: Bearer <signed-token>`
 * 2. Checks `X-Demo-Persona-Id: <user-id>` (Honest demo persona simulation header)
 * 3. Fallbacks to default persona for frictionless local offline evaluation.
 */
export const resolveCurrentUser = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const personaHeader = req.headers['x-demo-persona-id'] || req.headers['x-user-id'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.slice(7).trim();
    const verifiedUserId = verifySessionToken(rawToken);
    if (verifiedUserId) {
      const user = store.getUserById(verifiedUserId);
      if (user) {
        req.currentUser = user;
        req.authMode = 'signed_token';
        return next();
      }
    }
  }

  if (typeof personaHeader === 'string') {
    const matched = store.getUserById(personaHeader);
    if (matched) {
      req.currentUser = matched;
      req.authMode = 'demo_persona_simulation';
      return next();
    }
  }

  // Local fallback (Alex Rivera - Lead Architect)
  req.currentUser = store.getUsers()[0];
  req.authMode = 'demo_persona_simulation';
  next();
};

/**
 * Role-Based Access Control Guard
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.currentUser || store.getUsers()[0];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: `Forbidden: Action requires one of [${allowedRoles.join(', ')}]. Current role: '${user.role}' (${user.name}).`,
        code: 'INSUFFICIENT_PERMISSIONS',
        authMode: req.authMode,
        user: { id: user.id, name: user.name, role: user.role },
      });
    }
    next();
  };
};

/**
 * Fine-Grained Capability Guard
 */
export const requireCapability = (capability: 'reset_store' | 'import_xml' | 'verify_bug' | 'security_override' | 'triage_bug') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.currentUser || store.getUsers()[0];
    let allowed = false;

    switch (capability) {
      case 'reset_store':
      case 'import_xml':
        allowed = user.role === 'admin' || user.role === 'maintainer';
        break;
      case 'verify_bug':
        allowed = user.role === 'qa' || user.role === 'admin' || user.role === 'maintainer';
        break;
      case 'security_override':
        allowed = user.role === 'admin' || user.role === 'maintainer' || user.name.includes('Security');
        break;
      case 'triage_bug':
        allowed = user.role !== 'reporter';
        break;
      default:
        allowed = true;
    }

    if (!allowed) {
      return res.status(403).json({
        error: `Forbidden: Capability '${capability}' denied for role '${user.role}' (${user.name}).`,
        code: 'CAPABILITY_DENIED',
        capability,
        user: { id: user.id, name: user.name, role: user.role },
      });
    }

    next();
  };
};
