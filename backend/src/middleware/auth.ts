import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { store } from '../data/store.js';
import { User } from '../types/index.js';

/**
 * Authentication and authorisation.
 *
 * The previous implementation accepted an identity from three client-controlled
 * places — an `X-User-Id` header, a `_currentUser` object in the request body,
 * and a token endpoint that minted a signed token for any user id with no
 * credential — and fell back to the first seeded user (a maintainer) when none
 * were supplied. Every role and capability guard was therefore decorative, and
 * the audit trail recorded whatever identity the caller claimed.
 *
 * Identity now comes from exactly one place: a signed, expiring bearer token
 * issued in exchange for a verified password.
 */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours — actually enforced.

/**
 * In production the signing key must be supplied. A constant baked into the
 * source would let anyone forge tokens against a deployment, so that fallback
 * exists only outside production and is announced.
 */
function resolveSigningSecret(): string {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SESSION_SECRET must be set to at least 16 characters in production. ' +
        'Without it, session tokens can be forged by anyone who has read the source.'
    );
  }

  const g = globalThis as { __omnibugDevSecret?: string };
  if (!g.__omnibugDevSecret) {
    g.__omnibugDevSecret = crypto.randomBytes(32).toString('hex');
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[auth] SESSION_SECRET is not set — using an ephemeral development key.');
    }
  }
  return g.__omnibugDevSecret;
}

/* -------------------------------------------------------------------------- */
/*  Passwords                                                                  */
/* -------------------------------------------------------------------------- */

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string | undefined): boolean {
  if (!stored) return false;
  const [scheme, salt, expected] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !expected) return false;
  try {
    const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
    const expectedBuf = Buffer.from(expected, 'hex');
    if (derived.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(derived, expectedBuf);
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/*  Session tokens                                                             */
/* -------------------------------------------------------------------------- */

/** `base64url(userId:issuedAt:expiresAt:hmac)` */
export function generateSessionToken(userId: string, ttlMs: number = TOKEN_TTL_MS): string {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + ttlMs;
  const payload = `${userId}:${issuedAt}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', resolveSigningSecret()).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64url');
}

export interface TokenVerification {
  valid: boolean;
  userId?: string;
  reason?: 'malformed' | 'bad_signature' | 'expired';
  expiresAt?: number;
}

export function verifySessionToken(token: string): TokenVerification {
  try {
    const parts = Buffer.from(token, 'base64url').toString('utf-8').split(':');
    if (parts.length !== 4) return { valid: false, reason: 'malformed' };

    const [userId, issuedAt, expiresAt, signature] = parts;
    const payload = `${userId}:${issuedAt}:${expiresAt}`;
    const expected = crypto.createHmac('sha256', resolveSigningSecret()).update(payload).digest('hex');

    // The signature must be exactly the hex digest and nothing else.
    // `Buffer.from(str, 'hex')` stops at the first invalid character, so
    // without this check a token with trailing junk appended decodes to the
    // same bytes and verifies successfully.
    if (!/^[0-9a-f]{64}$/i.test(signature)) {
      return { valid: false, reason: 'bad_signature' };
    }

    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    // timingSafeEqual throws on a length mismatch, so compare lengths first.
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false, reason: 'bad_signature' };
    }

    // The previous implementation advertised `expiresIn: '24h'` and never read
    // the timestamp; a year-old token authenticated successfully.
    const expiry = Number(expiresAt);
    if (!Number.isFinite(expiry) || Date.now() > expiry) {
      return { valid: false, reason: 'expired' };
    }

    return { valid: true, userId, expiresAt: expiry };
  } catch {
    return { valid: false, reason: 'malformed' };
  }
}

/* -------------------------------------------------------------------------- */
/*  Middleware                                                                 */
/* -------------------------------------------------------------------------- */

/** Attaches `req.currentUser` when a valid bearer token is present. Never guesses. */
export const resolveCurrentUser = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const result = verifySessionToken(header.slice(7).trim());
    if (result.valid && result.userId) {
      const user = store.getUserById(result.userId);
      if (user) req.currentUser = user;
    }
  }
  next();
};

/** Rejects the request unless a valid token identified a real user. */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.currentUser) {
    return res.status(401).json({
      error: 'Authentication required. Sign in to obtain a session token.',
      code: 'UNAUTHENTICATED',
    });
  }
  next();
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.currentUser;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    }
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: `Forbidden: requires one of [${allowedRoles.join(', ')}]. Your role is '${user.role}'.`,
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }
    next();
  };
};

export type Capability = 'reset_store' | 'import_xml' | 'verify_bug' | 'security_override' | 'triage_bug';

/**
 * Capability matrix, keyed on role only.
 *
 * `security_override` previously also granted access when the user's *display
 * name* contained "Security", so renaming an account changed its privileges.
 * Authorisation now derives from the role field alone.
 */
const CAPABILITIES: Record<Capability, ReadonlyArray<User['role']>> = {
  reset_store: ['admin', 'maintainer'],
  import_xml: ['admin', 'maintainer'],
  verify_bug: ['qa', 'admin', 'maintainer'],
  security_override: ['admin', 'maintainer'],
  triage_bug: ['admin', 'maintainer', 'developer', 'qa'],
};

export function hasCapability(user: User, capability: Capability): boolean {
  return CAPABILITIES[capability]?.includes(user.role) ?? false;
}

export const requireCapability = (capability: Capability) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.currentUser;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
    }
    if (!hasCapability(user, capability)) {
      return res.status(403).json({
        error: `Forbidden: capability '${capability}' is not granted to role '${user.role}'.`,
        code: 'CAPABILITY_DENIED',
        capability,
      });
    }
    next();
  };
};

export function capabilitiesFor(user: User) {
  return {
    canResetStore: hasCapability(user, 'reset_store'),
    canImportXml: hasCapability(user, 'import_xml'),
    canVerifyBugs: hasCapability(user, 'verify_bug'),
    canManageSecurity: hasCapability(user, 'security_override'),
    canTriage: hasCapability(user, 'triage_bug'),
  };
}
