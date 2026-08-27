import { Router } from 'express';
import { BugController } from '../controllers/bugController.js';
import { ProductController } from '../controllers/productController.js';
import { FlagController } from '../controllers/flagController.js';
import { AnalyticsController } from '../controllers/analyticsController.js';
import { AIController } from '../controllers/aiController.js';
import { store } from '../data/store.js';
import { DependencyGraphService } from '../services/dependencyGraph.js';

const router = Router();

// Users & Auth
router.get('/users', (req, res) => {
  res.json({ data: store.getUsers() });
});

router.post('/store/reset', (req, res) => {
  const data = store.resetToSeed();
  res.json({ message: 'Store reset to seed successfully', data });
});

// Products & Components & Milestones
router.get('/products', ProductController.getProducts);
router.get('/products/:id', ProductController.getProductById);
router.post('/products', ProductController.createProduct);
router.post('/products/:id/components', ProductController.addComponent);
router.post('/products/:id/milestones', ProductController.addMilestone);

// Bugs CRUD & Actions
router.get('/bugs', BugController.getBugs);
router.get('/bugs/:id', BugController.getBugById);
router.post('/bugs', BugController.createBug);
router.patch('/bugs/:id', BugController.updateBug);
router.post('/bugs/bulk', BugController.bulkUpdate);
router.post('/bugs/:id/comments', BugController.addComment);
router.post('/bugs/:id/worklogs', BugController.addWorkLog);
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
router.post('/import/bugzilla-xml', BugController.importBugzillaXml);

export default router;
