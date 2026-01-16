import express from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.use(authenticate);

// Générer un numéro d'incident unique
const generateNumeroIncident = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM incidents_graves WHERE numero_incident LIKE $1',
    [`INC-${year}-%`]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `INC-${year}-${String(count).padStart(6, '0')}`;
};

// Récupérer tous les incidents graves
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { niveau_gravite, status, start_date, end_date } = req.query;

    let query = `
      SELECT ig.*, u.nom as creator_nom, u.prenom as creator_prenom,
             i.numero_intervention, cr.numero_cr
      FROM incidents_graves ig
      LEFT JOIN users u ON ig.created_by = u.id
      LEFT JOIN interventions i ON ig.intervention_id = i.id
      LEFT JOIN comptes_rendus cr ON ig.compte_rendu_id = cr.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (niveau_gravite) {
      query += ` AND ig.niveau_gravite = $${paramCount}`;
      params.push(niveau_gravite);
      paramCount++;
    }

    if (status) {
      query += ` AND ig.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (start_date) {
      query += ` AND ig.date_incident >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND ig.date_incident <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` ORDER BY 
      CASE ig.niveau_gravite
        WHEN 'critique' THEN 1
        WHEN 'grave' THEN 2
        WHEN 'moyen' THEN 3
        WHEN 'leger' THEN 4
      END,
      ig.date_incident DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur EventGrave:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un incident grave
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { titre, description, niveau_gravite, date_incident, lieu, intervention_id, compte_rendu_id } = req.body;

    if (!titre || !description || !niveau_gravite || !date_incident) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    if (!['critique', 'grave', 'moyen', 'leger'].includes(niveau_gravite)) {
      return res.status(400).json({ error: 'Niveau de gravité invalide' });
    }

    const numero_incident = await generateNumeroIncident();

    const result = await pool.query(
      `INSERT INTO incidents_graves (numero_incident, titre, description, niveau_gravite, date_incident, lieu, intervention_id, compte_rendu_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        numero_incident,
        titre,
        description,
        niveau_gravite,
        date_incident,
        lieu || null,
        intervention_id || null,
        compte_rendu_id || null,
        req.user!.id
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur EventGrave:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un incident par ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const incidentResult = await pool.query(
      `SELECT ig.*, u.nom as creator_nom, u.prenom as creator_prenom,
              i.numero_intervention, cr.numero_cr
       FROM incidents_graves ig
       LEFT JOIN users u ON ig.created_by = u.id
       LEFT JOIN interventions i ON ig.intervention_id = i.id
       LEFT JOIN comptes_rendus cr ON ig.compte_rendu_id = cr.id
       WHERE ig.id = $1`,
      [req.params.id]
    );

    if (incidentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Incident non trouvé' });
    }

    const incident = incidentResult.rows[0];

    // Récupérer les militaires impliqués
    const militairesResult = await pool.query(
      `SELECT im.*, u.rio, u.nom, u.prenom, u.grade
       FROM incident_militaires im
       JOIN users u ON im.user_id = u.id
       WHERE im.incident_id = $1`,
      [req.params.id]
    );
    incident.militaires = militairesResult.rows;

    // Récupérer la chronologie
    const chronologieResult = await pool.query(
      `SELECT ic.*, u.rio, u.nom, u.prenom
       FROM incident_chronologie ic
       LEFT JOIN users u ON ic.user_id = u.id
       WHERE ic.incident_id = $1
       ORDER BY ic.date_evenement ASC`,
      [req.params.id]
    );
    incident.chronologie = chronologieResult.rows;

    res.json(incident);
  } catch (error) {
    console.error('Erreur EventGrave:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier un incident
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { titre, description, niveau_gravite, status, lieu, intervention_id, compte_rendu_id } = req.body;

    const result = await pool.query(
      `UPDATE incidents_graves
       SET titre = COALESCE($1, titre),
           description = COALESCE($2, description),
           niveau_gravite = COALESCE($3, niveau_gravite),
           status = COALESCE($4, status),
           lieu = COALESCE($5, lieu),
           intervention_id = COALESCE($6, intervention_id),
           compte_rendu_id = COALESCE($7, compte_rendu_id)
       WHERE id = $8
       RETURNING *`,
      [
        titre || null,
        description || null,
        niveau_gravite || null,
        status || null,
        lieu || null,
        intervention_id || null,
        compte_rendu_id || null,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incident non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur EventGrave:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Ajouter un militaire à un incident
router.post('/:id/militaires', async (req: AuthRequest, res) => {
  try {
    const { user_id, etat, description } = req.body;

    if (!user_id || !etat) {
      return res.status(400).json({ error: 'ID utilisateur et état requis' });
    }

    await pool.query(
      'INSERT INTO incident_militaires (incident_id, user_id, etat, description) VALUES ($1, $2, $3, $4)',
      [req.params.id, user_id, etat, description || null]
    );

    res.json({ message: 'Militaire ajouté à l\'incident' });
  } catch (error) {
    console.error('Erreur EventGrave:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Ajouter un événement à la chronologie
router.post('/:id/chronologie', async (req: AuthRequest, res) => {
  try {
    const { evenement, date_evenement } = req.body;

    if (!evenement) {
      return res.status(400).json({ error: 'Événement requis' });
    }

    const result = await pool.query(
      'INSERT INTO incident_chronologie (incident_id, user_id, evenement, date_evenement) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.id, req.user!.id, evenement, date_evenement || new Date()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur EventGrave:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un incident
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('DELETE FROM incidents_graves WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incident non trouvé' });
    }

    res.json({ message: 'Incident supprimé avec succès' });
  } catch (error) {
    console.error('Erreur EventGrave:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
