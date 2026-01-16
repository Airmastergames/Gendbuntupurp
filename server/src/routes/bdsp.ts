import express from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.use(authenticate);

// Générer un numéro d'intervention unique
const generateNumeroIntervention = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM interventions WHERE numero_intervention LIKE $1',
    [`INT-${year}-%`]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `INT-${year}-${String(count).padStart(6, '0')}`;
};

// Récupérer toutes les interventions
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status, priority, unit_id, start_date, end_date } = req.query;

    let query = `
      SELECT i.*, u.name as unit_name, creator.nom as creator_nom, creator.prenom as creator_prenom
      FROM interventions i
      LEFT JOIN units u ON i.assigned_unit_id = u.id
      LEFT JOIN users creator ON i.created_by = creator.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      query += ` AND i.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (priority) {
      query += ` AND i.priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }

    if (unit_id) {
      query += ` AND i.assigned_unit_id = $${paramCount}`;
      params.push(unit_id);
      paramCount++;
    }

    if (start_date) {
      query += ` AND i.date_creation >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND i.date_creation <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` ORDER BY i.priority ASC, i.date_creation DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur BDSP:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une intervention
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { type, description, adresse, coordonnees, priority, assigned_unit_id } = req.body;

    if (!type || !description) {
      return res.status(400).json({ error: 'Type et description requis' });
    }

    const numero_intervention = await generateNumeroIntervention();

    const result = await pool.query(
      `INSERT INTO interventions (numero_intervention, type, description, adresse, coordonnees, priority, assigned_unit_id, created_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'en_cours')
       RETURNING *`,
      [
        numero_intervention,
        type,
        description,
        adresse || null,
        coordonnees ? JSON.stringify(coordonnees) : null,
        priority || 3,
        assigned_unit_id || null,
        req.user!.id
      ]
    );

    const intervention = result.rows[0];

    // Ajouter un log
    await pool.query(
      `INSERT INTO intervention_logs (intervention_id, user_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [
        intervention.id,
        req.user!.id,
        'Création de l\'intervention',
        JSON.stringify({ type, description, priority })
      ]
    );

    res.status(201).json(intervention);
  } catch (error) {
    console.error('Erreur BDSP:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer une intervention par ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const interventionResult = await pool.query(
      `SELECT i.*, u.name as unit_name, creator.nom as creator_nom, creator.prenom as creator_prenom
       FROM interventions i
       LEFT JOIN units u ON i.assigned_unit_id = u.id
       LEFT JOIN users creator ON i.created_by = creator.id
       WHERE i.id = $1`,
      [req.params.id]
    );

    if (interventionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Intervention non trouvée' });
    }

    const intervention = interventionResult.rows[0];

    // Récupérer les unités affectées
    const unitsResult = await pool.query(
      `SELECT iu.*, u.name as unit_name, u.code as unit_code
       FROM intervention_units iu
       JOIN units u ON iu.unit_id = u.id
       WHERE iu.intervention_id = $1`,
      [req.params.id]
    );
    intervention.assigned_units = unitsResult.rows;

    // Récupérer les logs
    const logsResult = await pool.query(
      `SELECT il.*, u.rio, u.nom, u.prenom
       FROM intervention_logs il
       LEFT JOIN users u ON il.user_id = u.id
       WHERE il.intervention_id = $1
       ORDER BY il.created_at DESC`,
      [req.params.id]
    );
    intervention.logs = logsResult.rows;

    res.json(intervention);
  } catch (error) {
    console.error('Erreur BDSP:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier une intervention
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { type, description, adresse, coordonnees, status, priority, assigned_unit_id, date_debut, date_fin } = req.body;

    const result = await pool.query(
      `UPDATE interventions
       SET type = COALESCE($1, type),
           description = COALESCE($2, description),
           adresse = COALESCE($3, adresse),
           coordonnees = COALESCE($4, coordonnees),
           status = COALESCE($5, status),
           priority = COALESCE($6, priority),
           assigned_unit_id = COALESCE($7, assigned_unit_id),
           date_debut = COALESCE($8, date_debut),
           date_fin = COALESCE($9, date_fin)
       WHERE id = $10
       RETURNING *`,
      [
        type || null,
        description || null,
        adresse || null,
        coordonnees ? JSON.stringify(coordonnees) : null,
        status || null,
        priority || null,
        assigned_unit_id || null,
        date_debut || null,
        date_fin || null,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Intervention non trouvée' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Intervention non trouvée' });
    }

    // Ajouter un log
    const logAction = status ? `Statut modifié: ${status}` : 'Modification de l\'intervention';
    await pool.query(
      `INSERT INTO intervention_logs (intervention_id, user_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [
        req.params.id,
        req.user!.id,
        logAction,
        JSON.stringify(req.body)
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur BDSP:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Affecter une unité à une intervention
router.post('/:id/assign-unit', async (req: AuthRequest, res) => {
  try {
    const { unit_id } = req.body;

    if (!unit_id) {
      return res.status(400).json({ error: 'ID unité requis' });
    }

    // Vérifier si l'intervention existe
    const interventionCheck = await pool.query('SELECT id FROM interventions WHERE id = $1', [req.params.id]);
    if (interventionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Intervention non trouvée' });
    }

    // Vérifier si l'affectation existe déjà
    const existingCheck = await pool.query(
      'SELECT id FROM intervention_units WHERE intervention_id = $1 AND unit_id = $2',
      [req.params.id, unit_id]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Unité déjà affectée' });
    }

    // Créer l'affectation
    await pool.query(
      'INSERT INTO intervention_units (intervention_id, unit_id, assigned_by) VALUES ($1, $2, $3)',
      [req.params.id, unit_id, req.user!.id]
    );

    // Ajouter un log
    await pool.query(
      `INSERT INTO intervention_logs (intervention_id, user_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [
        req.params.id,
        req.user!.id,
        'Affectation unité',
        JSON.stringify({ unit_id })
      ]
    );

    res.json({ message: 'Unité affectée avec succès' });
  } catch (error) {
    console.error('Erreur BDSP:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
