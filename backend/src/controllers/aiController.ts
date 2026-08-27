import { Request, Response } from 'express';
import { store } from '../data/store.js';
import { AITriageService } from '../services/aiTriage.js';

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
}
