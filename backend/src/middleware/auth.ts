import { Request, Response, NextFunction } from 'express';
import { store } from '../data/store.js';
import { User } from '../types/index.js';

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

export const resolveCurrentUser = (req: Request, res: Response, next: NextFunction) => {
  const userIdHeader = req.headers['x-user-id'] as string | undefined;
  const userIdQuery = req.query.userId as string | undefined;
  const userIdBody = req.body?._currentUser?.id;

  const targetUserId = userIdHeader || userIdQuery || userIdBody || 'usr-1';
  const matchedUser = store.getUserById(targetUserId) || store.getUsers()[0];

  req.currentUser = matchedUser;
  next();
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.currentUser || store.getUsers()[0];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: `Forbidden: Action requires one of [${allowedRoles.join(', ')}]. Current role: '${user.role}' (${user.name}).`,
        code: 'INSUFFICIENT_PERMISSIONS',
        user: { id: user.id, name: user.name, role: user.role },
      });
    }
    next();
  };
};

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
        error: `Forbidden: User '${user.name}' (${user.role}) lacks capability '${capability}'.`,
        code: 'FORBIDDEN_CAPABILITY',
        capability,
      });
    }

    next();
  };
};
