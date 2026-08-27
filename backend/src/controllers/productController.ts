import { Request, Response } from 'express';
import { store } from '../data/store.js';
import { Product, ProductComponent, Milestone } from '../types/index.js';

export class ProductController {
  public static getProducts(req: Request, res: Response) {
    try {
      const products = store.getProducts();
      return res.json({ data: products });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static getProductById(req: Request, res: Response) {
    try {
      const product = store.getProductById(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      return res.json({ data: product });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static createProduct(req: Request, res: Response) {
    try {
      const { name, description, versions } = req.body;
      if (!name) return res.status(400).json({ error: 'Product name is required' });

      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name,
        description: description || '',
        components: [],
        milestones: [],
        versions: versions || ['1.0.0'],
      };

      store.addProduct(newProduct);
      return res.status(201).json({ data: newProduct });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static addComponent(req: Request, res: Response) {
    try {
      const productId = req.params.id;
      const product = store.getProductById(productId);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      const { name, description, leadId, defaultQaId } = req.body;
      if (!name) return res.status(400).json({ error: 'Component name is required' });

      const leadUser = leadId ? store.getUserById(leadId) : store.getUsers()[0];
      const qaUser = defaultQaId ? store.getUserById(defaultQaId) : store.getUsers()[3];

      const newComponent: ProductComponent = {
        id: `comp-${Date.now()}`,
        name,
        description: description || '',
        leadId: leadUser?.id || 'usr-1',
        leadName: leadUser?.name || 'Alex Rivera',
        defaultQaId: qaUser?.id || 'usr-4',
        defaultQaName: qaUser?.name || 'Sarah Jenkins',
      };

      product.components.push(newComponent);
      store.saveToDisk();

      return res.status(201).json({ data: newComponent, product });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static addMilestone(req: Request, res: Response) {
    try {
      const productId = req.params.id;
      const product = store.getProductById(productId);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      const { name, targetDate, description } = req.body;
      if (!name || !targetDate) {
        return res.status(400).json({ error: 'Milestone name and targetDate are required' });
      }

      const newMilestone: Milestone = {
        id: `m-${Date.now()}`,
        name,
        targetDate,
        status: 'open',
        description,
      };

      product.milestones.push(newMilestone);
      store.saveToDisk();

      return res.status(201).json({ data: newMilestone, product });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
