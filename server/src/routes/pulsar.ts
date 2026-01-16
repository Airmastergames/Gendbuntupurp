import express from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.use(authenticate);

// ============================================
// SERVICES / PLANNINGS
// ============================================

// Récupérer tous les services
router.get('/services', async (req: AuthRequest, res) => {
  try {
    const { start_date, end_date, unit_id, type } = req.query;

    let query = `
      SELECT s.*, u.name as unit_name, creator.nom as creator_nom, creator.prenom as creator_prenom
      FROM services s
      LEFT JOIN units u ON s.unit_id = u.id
      LEFT JOIN users creator ON s.created_by = creator.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (start_date) {
      query += ` AND s.end_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND s.start_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    if (unit_id) {
      query += ` AND s.unit_id = $${paramCount}`;
      params.push(unit_id);
      paramCount++;
    }

    if (type) {
      query += ` AND s.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    query += ` ORDER BY s.start_date DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur services:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un service
router.post('/services', async (req: AuthRequest, res) => {
  try {
    const { title, description, start_date, end_date, type, unit_id, assignments } = req.body;

    if (!title || !start_date || !end_date || !type) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const result = await pool.query(
      `INSERT INTO services (title, description, start_date, end_date, type, unit_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, description || null, start_date, end_date, type, unit_id || null, req.user!.id]
    );

    const service = result.rows[0];

    // Ajouter les affectations
    if (assignments && Array.isArray(assignments)) {
      for (const assignment of assignments) {
        await pool.query(
          'INSERT INTO service_assignments (service_id, user_id, role_in_service) VALUES ($1, $2, $3)',
          [service.id, assignment.user_id, assignment.role_in_service || null]
        );
      }
    }

    res.status(201).json(service);
  } catch (error) {
    console.error('Erreur services:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un service avec ses affectations
router.get('/services/:id', async (req: AuthRequest, res) => {
  try {
    const serviceResult = await pool.query(
      `SELECT s.*, u.name as unit_name, creator.nom as creator_nom, creator.prenom as creator_prenom
       FROM services s
       LEFT JOIN units u ON s.unit_id = u.id
       LEFT JOIN users creator ON s.created_by = creator.id
       WHERE s.id = $1`,
      [req.params.id]
    );

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service non trouvé' });
    }

    const assignmentsResult = await pool.query(
      `SELECT sa.*, u.rio, u.nom, u.prenom, u.grade
       FROM service_assignments sa
       JOIN users u ON sa.user_id = u.id
       WHERE sa.service_id = $1`,
      [req.params.id]
    );

    const service = serviceResult.rows[0];
    service.assignments = assignmentsResult.rows;

    res.json(service);
  } catch (error) {
    console.error('Erreur services:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// REGISTRE PV
// ============================================

// Générer un numéro de PV unique
const generateNumeroPV = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM pv_registre WHERE numero_pv LIKE $1',
    [`PV-${year}-%`]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `PV-${year}-${String(count).padStart(6, '0')}`;
};

// Générer un numéro de PV/PVE LRPGN unique
const generateNumeroLRPGN = async (type: string): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = type.toUpperCase();
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM lrpgn_pv WHERE numero_pv LIKE $1',
    [`${prefix}-${year}-%`]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `${prefix}-${year}-${String(count).padStart(6, '0')}`;
};

// Récupérer tous les PV du registre
router.get('/pv', async (req: AuthRequest, res) => {
  try {
    const { status, type_pv, start_date, end_date } = req.query;

    let query = `
      SELECT pv.*, u.nom as creator_nom, u.prenom as creator_prenom
      FROM pv_registre pv
      LEFT JOIN users u ON pv.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      query += ` AND pv.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (type_pv) {
      query += ` AND pv.type_pv = $${paramCount}`;
      params.push(type_pv);
      paramCount++;
    }

    if (start_date) {
      query += ` AND pv.date_creation >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND pv.date_creation <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` ORDER BY pv.date_creation DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur PV:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un PV dans le registre
router.post('/pv', async (req: AuthRequest, res) => {
  try {
    const { type_pv, description, status } = req.body;

    if (!type_pv) {
      return res.status(400).json({ error: 'Type de PV requis' });
    }

    const numero_pv = await generateNumeroPV();

    const result = await pool.query(
      `INSERT INTO pv_registre (numero_pv, type_pv, description, status, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [numero_pv, type_pv, description || null, status || 'draft', req.user!.id]
    );

    const pvRegistre = result.rows[0];

    // Créer automatiquement un PV dans LRPGN lié au registre
    try {
      const lrpgnNumero = await generateNumeroLRPGN('pv');
      const lrpgnContenu = {
        titre: `PV Registre ${numero_pv}`,
        description: description || '',
        date_incident: new Date().toISOString(),
        lieu: '',
      };

      const lrpgnResult = await pool.query(
        `INSERT INTO lrpgn_pv (numero_pv, type, contenu, linked_registre_id, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [lrpgnNumero, 'pv', JSON.stringify(lrpgnContenu), pvRegistre.id, 'draft', req.user!.id]
      );

      // Mettre à jour le registre avec le lien LRPGN
      await pool.query(
        'UPDATE pv_registre SET linked_lrpgn_id = $1 WHERE id = $2',
        [lrpgnResult.rows[0].id, pvRegistre.id]
      );
    } catch (lrpgnError) {
      console.error('Erreur création LRPGN automatique:', lrpgnError);
      // On continue même si la création LRPGN échoue
    }

    res.status(201).json(pvRegistre);
  } catch (error) {
    console.error('Erreur PV:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un PV par ID
router.get('/pv/:id', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT pv.*, u.nom as creator_nom, u.prenom as creator_prenom
       FROM pv_registre pv
       LEFT JOIN users u ON pv.created_by = u.id
       WHERE pv.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PV non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur PV:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un service
router.delete('/services/:id', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('DELETE FROM services WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service non trouvé' });
    }
    res.json({ message: 'Service supprimé avec succès' });
  } catch (error) {
    console.error('Erreur services:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier un PV
router.put('/pv/:id', async (req: AuthRequest, res) => {
  try {
    const { description, status, linked_lrpgn_id } = req.body;

    const result = await pool.query(
      `UPDATE pv_registre
       SET description = $1, status = $2, linked_lrpgn_id = $3
       WHERE id = $4
       RETURNING *`,
      [description || null, status || null, linked_lrpgn_id || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PV non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur PV:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un PV
router.delete('/pv/:id', async (req: AuthRequest, res) => {
  try {
    // Récupérer le PV pour trouver le lien LRPGN
    const pvResult = await pool.query('SELECT linked_lrpgn_id FROM pv_registre WHERE id = $1', [req.params.id]);
    
    if (pvResult.rows.length === 0) {
      return res.status(404).json({ error: 'PV non trouvé' });
    }

    const linkedLrpgnId = pvResult.rows[0].linked_lrpgn_id;

    // Supprimer le PV du registre
    await pool.query('DELETE FROM pv_registre WHERE id = $1', [req.params.id]);

    // Supprimer aussi le PV lié dans LRPGN s'il existe
    if (linkedLrpgnId) {
      try {
        await pool.query('DELETE FROM lrpgn_pv WHERE id = $1', [linkedLrpgnId]);
      } catch (lrpgnError) {
        console.error('Erreur suppression LRPGN:', lrpgnError);
        // On continue même si la suppression LRPGN échoue
      }
    }

    res.json({ message: 'PV supprimé avec succès' });
  } catch (error) {
    console.error('Erreur PV:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
