import { Request, Response } from 'express';
import { store } from '../data/store.js';
import { AITriageService } from '../services/aiTriage.js';
import { runReproductionTest } from '../services/testSandbox.js';

export class AIController {
  public static findDuplicates(req: Request, res: Response) {
    try {
      const { title, description } = req.body;
      if (!title) {
        return res.json({ candidates: [] });
      }

      const existingBugs = store.getBugs();
      const candidates = AITriageService.findDuplicates(title, description || '', existingBugs);

      return res.json({ candidates });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static classifyAndTriage(req: Request, res: Response) {
    try {
      const { title, description, productId } = req.body;
      if (!title && !description) {
        return res.status(400).json({ error: 'Title or description is required for triage prediction' });
      }

      const products = store.getProducts();
      const prediction = AITriageService.analyzeAndClassify(
        title || '',
        description || '',
        products,
        productId
      );

      return res.json({ prediction });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Runs the synthesized reproduction test and returns what actually happened.
   *
   * The client sends the bug text, not the test source: the server re-derives
   * the prediction and executes only code it generated itself. Accepting a
   * snippet from the caller would turn this into an arbitrary-code endpoint,
   * with the VM context as the only thing standing in the way.
   */
  public static runReproductionTest(req: Request, res: Response) {
    try {
      const { title, description, productId } = req.body;
      if (!title && !description) {
        return res.status(400).json({ error: 'Title or description is required to synthesize a test' });
      }

      const products = store.getProducts();
      const prediction = AITriageService.analyzeAndClassify(title || '', description || '', products, productId);
      const result = runReproductionTest(prediction.suggestedTestCase, {
        parsedStackTrace: prediction.parsedStackTrace,
        suggestedComponentId: prediction.suggestedComponentId,
        suggestedSeverity: prediction.suggestedSeverity,
        isSecuritySensitive: prediction.isSecuritySensitive,
      });

      return res.json({ result, source: prediction.suggestedTestCase });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
