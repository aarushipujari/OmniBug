import { Router } from 'express';
import { BugController } from '../controllers/bugController.js';
import { ProductController } from '../controllers/productController.js';
import { FlagController } from '../controllers/flagController.js';
import { AnalyticsController } from '../controllers/analyticsController.js';
import { AIController } from '../controllers/aiController.js';
import { store } from '../data/store.js';
import { DependencyGraphService } from '../services/dependencyGraph.js';
import {
  resolveCurrentUser,
  requireAuth,
  requireRole,
  requireCapability,
  generateSessionToken,
  verifyPassword,
  capabilitiesFor,
} from '../middleware/auth.js';
import { publicUser } from '../types/index.js';
import { DEMO_PASSWORD } from '../data/seedData.js';
import { validateBugCreate, validateTransition, validateComment, validateWorkLog } from '../middleware/validation.js';

const router = Router();

// Global user session resolver
router.use(resolveCurrentUser);

// ---------------------------------------------------------------------------
//  Authentication
// ---------------------------------------------------------------------------

/**
 * Exchange a verified password for a signed, expiring session token.
 *
 * This replaces a `POST /auth/token` that accepted a bare `userId` and returned
 * a valid token for it, which meant anyone could become any user — including
 * the admin — without a credential.
 */
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required.', code: 'INVALID_CREDENTIALS_FORMAT' });
  }

  const user = store.getUsers().find(u => u.email.toLowerCase() === email.trim().toLowerCase());

  // Verify unconditionally so a missing account and a wrong password take a
  // comparable amount of time and cannot be told apart from the outside.
  const ok = verifyPassword(password, user?.passwordHash);
  if (!user || !ok) {
    return res.status(401).json({ error: 'Incorrect email or password.', code: 'INVALID_CREDENTIALS' });
  }

  res.json({
    token: generateSessionToken(user.id),
    user: publicUser(user),
    capabilities: capabilitiesFor(user),
  });
});

/** The accounts available to sign in as, and the shared demo password. */
router.get('/auth/demo-accounts', (_req, res) => {
  res.json({
    password: DEMO_PASSWORD,
    accounts: store.getUsers().map(u => ({ email: u.email, name: u.name, role: u.role })),
  });
});

router.get('/auth/me', requireAuth, (req, res) => {
  const user = req.currentUser!;
  res.json({ data: publicUser(user), capabilities: capabilitiesFor(user) });
});

router.get('/users', requireAuth, (_req, res) => {
  res.json({ data: store.getUsers().map(publicUser) });
});

// Admin-only seed reset
router.post('/store/reset', requireAuth, requireRole(['admin', 'maintainer']), (req, res) => {
  const data = store.resetToSeed();
  res.json({ message: 'Store reset to seed successfully', data });
});

// Products & Components & Milestones
router.get('/products', ProductController.getProducts);
router.get('/products/:id', ProductController.getProductById);
router.post('/products', requireAuth, requireRole(['admin', 'maintainer']), ProductController.createProduct);
router.post('/products/:id/components', requireAuth, requireRole(['admin', 'maintainer']), ProductController.addComponent);
router.post('/products/:id/milestones', requireAuth, requireRole(['admin', 'maintainer']), ProductController.addMilestone);

// Bugs CRUD & Actions
router.get('/bugs', BugController.getBugs);
router.get('/bugs/:id', BugController.getBugById);
router.post('/bugs', requireAuth, validateBugCreate, BugController.createBug);
router.patch('/bugs/:id', requireAuth, BugController.updateBug);
router.post('/bugs/bulk', requireAuth, BugController.bulkUpdate);

// Explicit Domain Commands
router.post('/bugs/:id/transition', requireAuth, validateTransition, BugController.transitionBug);
router.post('/bugs/:id/assign', requireAuth, BugController.assignBug);
router.post('/bugs/:id/set-security', requireAuth, requireCapability('security_override'), BugController.setSecurity);
router.post('/bugs/:id/comments', requireAuth, validateComment, BugController.addComment);
router.post('/bugs/:id/worklogs', requireAuth, validateWorkLog, BugController.addWorkLog);
router.post('/bugs/:id/vote', requireAuth, BugController.toggleVote);

// Flags
router.post('/bugs/:bugId/flags', requireAuth, FlagController.setFlag);

// Graph
router.get('/graph', (req, res) => {
  const rootId = req.query.rootId as string | undefined;
  const graph = DependencyGraphService.buildGraph(store.getBugs(), rootId);
  res.json({ data: graph });
});

// Analytics & Reports
router.get('/analytics', AnalyticsController.getMetrics);

// AI & Smart Triage
router.post('/ai/duplicates', requireAuth, AIController.findDuplicates);
router.post('/ai/triage', requireAuth, AIController.classifyAndTriage);
router.post('/ai/run-test', requireAuth, AIController.runReproductionTest);

// Interoperability (Bugzilla XML)
router.get('/export/bugzilla-xml', BugController.exportBugzillaXml);
router.post('/import/bugzilla-xml', requireAuth, requireRole(['admin', 'maintainer']), BugController.importBugzillaXml);

export default router;
