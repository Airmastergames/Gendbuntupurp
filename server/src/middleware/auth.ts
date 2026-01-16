import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    rio: string;
    email: string;
    role_id: number;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' });
  }
};

export const requirePermission = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Vérifier la permission (simplifié - à améliorer avec vraie vérification DB)
    // Pour l'instant, on laisse passer si admin
    if (req.user.role_id === 1) {
      return next();
    }

    // TODO: Vérifier la permission dans la base de données
    next();
  };
};
