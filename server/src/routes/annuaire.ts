import express from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Tous les endpoints nécessitent une authentification
router.use(authenticate);

// Récupérer tous les contacts de l'annuaire
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { search, grade, unit_id } = req.query;

    let query = `
      SELECT a.*, u.name as unit_name
      FROM annuaire a
      LEFT JOIN units u ON a.unit_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (a.nom ILIKE $${paramCount} OR a.prenom ILIKE $${paramCount} OR a.rio ILIKE $${paramCount} OR a.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (grade) {
      query += ` AND a.grade = $${paramCount}`;
      params.push(grade);
      paramCount++;
    }

    if (unit_id) {
      query += ` AND a.unit_id = $${paramCount}`;
      params.push(unit_id);
      paramCount++;
    }

    query += ` ORDER BY a.nom, a.prenom`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur annuaire:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un contact par ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.name as unit_name
       FROM annuaire a
       LEFT JOIN units u ON a.unit_id = u.id
       WHERE a.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur annuaire:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un contact
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { rio, nom, prenom, grade, numero_service, email, unit_id, telephone, fonction } = req.body;

    // Vérifier les champs obligatoires
    if (!rio || !nom || !prenom || !grade || !numero_service || !email) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const result = await pool.query(
      `INSERT INTO annuaire (rio, nom, prenom, grade, numero_service, email, unit_id, telephone, fonction, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [rio, nom, prenom, grade, numero_service, email, unit_id || null, telephone || null, fonction || null, req.user!.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'RIO ou email déjà existant' });
    }
    console.error('Erreur annuaire:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier un contact
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { rio, nom, prenom, grade, numero_service, email, unit_id, telephone, fonction } = req.body;

    const result = await pool.query(
      `UPDATE annuaire
       SET rio = $1, nom = $2, prenom = $3, grade = $4, numero_service = $5, 
           email = $6, unit_id = $7, telephone = $8, fonction = $9
       WHERE id = $10
       RETURNING *`,
      [rio, nom, prenom, grade, numero_service, email, unit_id || null, telephone || null, fonction || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'RIO ou email déjà existant' });
    }
    console.error('Erreur annuaire:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un contact
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('DELETE FROM annuaire WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact non trouvé' });
    }

    res.json({ message: 'Contact supprimé avec succès' });
  } catch (error) {
    console.error('Erreur annuaire:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les grades disponibles
router.get('/grades/list', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT grade FROM annuaire ORDER BY grade');
    res.json(result.rows.map(r => r.grade));
  } catch (error) {
    console.error('Erreur annuaire:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
