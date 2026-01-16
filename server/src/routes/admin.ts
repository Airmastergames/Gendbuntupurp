import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Tous les endpoints nécessitent une authentification et être admin
router.use(authenticate);
router.use((req: AuthRequest, res, next) => {
  if (req.user!.role_id !== 1) {
    return res.status(403).json({ error: 'Accès refusé - Administrateur requis' });
  }
  next();
});

// ============================================
// GESTION DES UTILISATEURS
// ============================================

// Créer un utilisateur
router.post('/users', async (req: AuthRequest, res) => {
  try {
    const { rio, email, password, nom, prenom, grade, numero_service, unit_id, role_id } = req.body;

    if (!rio || !email || !password || !nom || !prenom || !grade) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    let passwordHash = '';
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    } else {
      // Si pas de mot de passe fourni, récupérer l'ancien
      const oldUser = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.params.id]);
      if (oldUser.rows.length === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      passwordHash = oldUser.rows[0].password_hash;
    }

    const result = await pool.query(
      `INSERT INTO users (rio, email, password_hash, nom, prenom, grade, numero_service, unit_id, role_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, rio, email, nom, prenom, grade, role_id, unit_id`,
      [rio, email, passwordHash, nom, prenom, grade, numero_service || null, unit_id || null, role_id || 3]
    );

    // Créer aussi dans l'annuaire
    await pool.query(
      `INSERT INTO annuaire (rio, nom, prenom, grade, numero_service, email, unit_id, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [rio, nom, prenom, grade, numero_service || '', email, unit_id || null, result.rows[0].id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'RIO ou email déjà existant' });
    }
    console.error('Erreur admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un utilisateur
router.delete('/users/:id', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier un utilisateur
router.put('/users/:id', async (req: AuthRequest, res) => {
  try {
    const { email, nom, prenom, grade, numero_service, unit_id, role_id, is_active, password } = req.body;

    let updateQuery = `
      UPDATE users
      SET email = $1,
          nom = $2,
          prenom = $3,
          grade = $4,
          numero_service = $5,
          unit_id = $6,
          role_id = $7,
          is_active = COALESCE($8, is_active)
    `;
    const params: any[] = [email, nom, prenom, grade, numero_service || null, unit_id || null, role_id, is_active];

    // Si un nouveau mot de passe est fourni, le hasher
    if (password && password.trim() !== '') {
      const passwordHash = await bcrypt.hash(password, 10);
      updateQuery += `, password_hash = $${params.length + 1}`;
      params.push(passwordHash);
    }

    updateQuery += ` WHERE id = $${params.length + 1} RETURNING id, rio, email, nom, prenom, grade, role_id, unit_id, is_active`;
    params.push(req.params.id);

    const result = await pool.query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// GESTION DES RÔLES
// ============================================

// Récupérer tous les rôles
router.get('/roles', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('SELECT * FROM roles ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les permissions d'un rôle
router.get('/roles/:id/permissions', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT p.* FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// GESTION DES UNITÉS
// ============================================

// Récupérer toutes les unités
router.get('/units', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('SELECT * FROM units ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une unité
router.post('/units', async (req: AuthRequest, res) => {
  try {
    const { code, name, type, parent_unit_id } = req.body;

    if (!code || !name || !type) {
      return res.status(400).json({ error: 'Code, nom et type requis' });
    }

    const result = await pool.query(
      'INSERT INTO units (code, name, type, parent_unit_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [code, name, type, parent_unit_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Code unité déjà existant' });
    }
    console.error('Erreur admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une unité
router.delete('/units/:id', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('DELETE FROM units WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Unité non trouvée' });
    }
    res.json({ message: 'Unité supprimée avec succès' });
  } catch (error: any) {
    if (error.code === '23503') {
      return res.status(409).json({ error: 'Impossible de supprimer : unité utilisée' });
    }
    console.error('Erreur admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier une unité
router.put('/units/:id', async (req: AuthRequest, res) => {
  try {
    const { code, name, type, parent_unit_id } = req.body;

    const result = await pool.query(
      'UPDATE units SET code = COALESCE($1, code), name = COALESCE($2, name), type = COALESCE($3, type), parent_unit_id = COALESCE($4, parent_unit_id) WHERE id = $5 RETURNING *',
      [code, name, type, parent_unit_id, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Unité non trouvée' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// LOGS SYSTÈME
// ============================================

// Récupérer les logs
router.get('/logs', async (req: AuthRequest, res) => {
  try {
    const { module, user_id, start_date, end_date, limit = 100 } = req.query;

    let query = `
      SELECT sl.*, u.rio, u.nom, u.prenom
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (module) {
      query += ` AND sl.module = $${paramCount}`;
      params.push(module);
      paramCount++;
    }

    if (user_id) {
      query += ` AND sl.user_id = $${paramCount}`;
      params.push(user_id);
      paramCount++;
    }

    if (start_date) {
      query += ` AND sl.created_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND sl.created_at <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` ORDER BY sl.created_at DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit as string));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Statistiques système
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const stats = {
      users: (await pool.query('SELECT COUNT(*) as count FROM users')).rows[0].count,
      active_users: (await pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = true')).rows[0].count,
      units: (await pool.query('SELECT COUNT(*) as count FROM units')).rows[0].count,
      interventions: (await pool.query('SELECT COUNT(*) as count FROM interventions')).rows[0].count,
      active_interventions: (await pool.query("SELECT COUNT(*) as count FROM interventions WHERE status = 'en_cours'")).rows[0].count,
      incidents_graves: (await pool.query('SELECT COUNT(*) as count FROM incidents_graves')).rows[0].count,
      messages: (await pool.query('SELECT COUNT(*) as count FROM messages')).rows[0].count,
    };

    res.json(stats);
  } catch (error) {
    console.error('Erreur admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
