import express from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

// Récupérer tous les utilisateurs (admin seulement)
router.get('/', async (req: AuthRequest, res) => {
  try {
    // Vérifier si admin (simplifié)
    if (req.user!.role_id !== 1) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const result = await pool.query(
      `SELECT u.id, u.rio, u.email, u.nom, u.prenom, u.grade, u.numero_service, 
              u.role_id, u.unit_id, u.is_active, u.last_login, u.created_at,
              r.name as role_name, un.name as unit_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN units un ON u.unit_id = un.id
       ORDER BY u.nom, u.prenom`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erreur users:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un utilisateur par ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.rio, u.email, u.nom, u.prenom, u.grade, u.numero_service, 
              u.role_id, u.unit_id, u.is_active, u.last_login, u.created_at,
              r.name as role_name, un.name as unit_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN units un ON u.unit_id = un.id
       WHERE u.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur users:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
