import { Router } from 'express';
import { BugController } from '../controllers/bugController.js';
import { ProductController } from '../controllers/productController.js';
import { FlagController } from '../controllers/flagController.js';
import { AnalyticsController } from '../controllers/analyticsController.js';
import { AIController } from '../controllers/aiController.js';
import { store } from '../data/store.js';
import { DependencyGraphService } from '../services/dependencyGraph.js';
import { resolveCurrentUser, requireRole, requireCapability, generateSessionToken } from '../middleware/auth.js';
import { validateBugCreate, validateTransition, validateComment, validateWorkLog } from '../middleware/validation.js';

const router = Router();

// Global user session resolver
router.use(resolveCurrentUser);

// Auth & Session tokens
router.get('/auth/me', (req, res) => {
  const user = req.currentUser || store.getUsers()[0];
  res.json({
    data: user,
    authMode: req.authMode || 'demo_persona_simulation',
    token: generateSessionToken(user.id),
    capabilities: {
      canResetStore: user.role === 'admin' || user.role === 'maintainer',
      canVerifyBugs: user.role === 'qa' || user.role === 'admin' || user.role === 'maintainer',
      canManageSecurity: user.role === 'admin' || user.role === 'maintainer' || user.name.includes('Security'),
      canTriage: user.role !== 'reporter',
    }
  });
});

router.post('/auth/token', (req, res) => {
  const { userId } = req.body;
  const user = store.getUserById(userId || 'usr-1');
  if (!user) {
    return res.status(404).json({ error: 'User persona not found' });
  }
  const token = generateSessionToken(user.id);
  res.json({
    token,
    user,
    expiresIn: '24h',
    authScheme: 'Bearer HMAC-SHA256'
  });
});

router.get('/users', (req, res) => {
  res.json({ data: store.getUsers() });
});

// Admin-only seed reset
router.post('/store/reset', requireRole(['admin', 'maintainer']), (req, res) => {
  const data = store.resetToSeed();
  res.json({ message: 'Store reset to seed successfully', data });
});

// Products & Components & Milestones
router.get('/products', ProductController.getProducts);
router.get('/products/:id', ProductController.getProductById);
router.post('/products', requireRole(['admin', 'maintainer']), ProductController.createProduct);
router.post('/products/:id/components', requireRole(['admin', 'maintainer']), ProductController.addComponent);
router.post('/products/:id/milestones', requireRole(['admin', 'maintainer']), ProductController.addMilestone);

// Bugs CRUD & Actions
router.get('/bugs', BugController.getBugs);
router.get('/bugs/:id', BugController.getBugById);
router.post('/bugs', validateBugCreate, BugController.createBug);
router.patch('/bugs/:id', BugController.updateBug);
router.post('/bugs/bulk', BugController.bulkUpdate);

// Explicit Domain Commands
router.post('/bugs/:id/transition', validateTransition, BugController.transitionBug);
router.post('/bugs/:id/assign', BugController.assignBug);
router.post('/bugs/:id/set-security', requireCapability('security_override'), BugController.setSecurity);
router.post('/bugs/:id/comments', validateComment, BugController.addComment);
router.post('/bugs/:id/worklogs', validateWorkLog, BugController.addWorkLog);
router.post('/bugs/:id/vote', BugController.toggleVote);

// Flags
router.post('/bugs/:bugId/flags', FlagController.setFlag);

// Graph
router.get('/graph', (req, res) => {
  const rootId = req.query.rootId as string | undefined;
  const graph = DependencyGraphService.buildGraph(store.getBugs(), rootId);
  res.json({ data: graph });
});

// Analytics & Reports
router.get('/analytics', AnalyticsController.getMetrics);

// AI & Smart Triage
router.post('/ai/duplicates', AIController.findDuplicates);
router.post('/ai/triage', AIController.classifyAndTriage);

// Interoperability (Bugzilla XML)
router.get('/export/bugzilla-xml', BugController.exportBugzillaXml);
router.post('/import/bugzilla-xml', requireRole(['admin', 'maintainer']), BugController.importBugzillaXml);

export default router;
