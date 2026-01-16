import express from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.use(authenticate);

// Générer un numéro de PV/PVE unique
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

// Récupérer tous les PV/PVE
router.get('/pv', async (req: AuthRequest, res) => {
  try {
    const { type, status, start_date, end_date } = req.query;

    let query = `
      SELECT pv.*, u.nom as creator_nom, u.prenom as creator_prenom,
             pr.numero_pv as registre_numero
      FROM lrpgn_pv pv
      LEFT JOIN users u ON pv.created_by = u.id
      LEFT JOIN pv_registre pr ON pv.linked_registre_id = pr.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (type) {
      query += ` AND pv.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (status) {
      query += ` AND pv.status = $${paramCount}`;
      params.push(status);
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
    console.error('Erreur LRPGN:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un PV/PVE
router.post('/pv', async (req: AuthRequest, res) => {
  try {
    const { type, contenu, linked_registre_id, status } = req.body;

    if (!type || !contenu) {
      return res.status(400).json({ error: 'Type et contenu requis' });
    }

    if (!['pv', 'pve'].includes(type.toLowerCase())) {
      return res.status(400).json({ error: 'Type doit être "pv" ou "pve"' });
    }

    const numero_pv = await generateNumeroLRPGN(type);

    const result = await pool.query(
      `INSERT INTO lrpgn_pv (numero_pv, type, contenu, linked_registre_id, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [numero_pv, type.toLowerCase(), JSON.stringify(contenu), linked_registre_id || null, status || 'draft', req.user!.id]
    );

    // Si lié au registre, mettre à jour le registre
    if (linked_registre_id) {
      await pool.query(
        'UPDATE pv_registre SET linked_lrpgn_id = $1 WHERE id = $2',
        [result.rows[0].id, linked_registre_id]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur LRPGN:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un PV/PVE par ID
router.get('/pv/:id', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT pv.*, u.nom as creator_nom, u.prenom as creator_prenom,
              pr.numero_pv as registre_numero
       FROM lrpgn_pv pv
       LEFT JOIN users u ON pv.created_by = u.id
       LEFT JOIN pv_registre pr ON pv.linked_registre_id = pr.id
       WHERE pv.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PV/PVE non trouvé' });
    }

    const pv = result.rows[0];
    if (pv.contenu && typeof pv.contenu === 'string') {
      pv.contenu = JSON.parse(pv.contenu);
    }

    res.json(pv);
  } catch (error) {
    console.error('Erreur LRPGN:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier un PV/PVE
router.put('/pv/:id', async (req: AuthRequest, res) => {
  try {
    const { type, contenu, status, linked_registre_id } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (type) {
      updates.push(`type = $${paramCount}`);
      params.push(type.toLowerCase());
      paramCount++;
    }

    if (contenu) {
      updates.push(`contenu = $${paramCount}`);
      params.push(JSON.stringify(contenu));
      paramCount++;
    }

    if (status) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (linked_registre_id !== undefined) {
      updates.push(`linked_registre_id = $${paramCount}`);
      params.push(linked_registre_id || null);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune modification fournie' });
    }

    params.push(req.params.id);
    const result = await pool.query(
      `UPDATE lrpgn_pv
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PV/PVE non trouvé' });
    }

    const pv = result.rows[0];
    if (pv.contenu && typeof pv.contenu === 'string') {
      pv.contenu = JSON.parse(pv.contenu);
    }

    res.json(pv);
  } catch (error) {
    console.error('Erreur LRPGN:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un PV/PVE
router.delete('/pv/:id', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('DELETE FROM lrpgn_pv WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PV/PVE non trouvé' });
    }

    res.json({ message: 'PV/PVE supprimé avec succès' });
  } catch (error) {
    console.error('Erreur LRPGN:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Générer un document officiel (PDF)
router.post('/pv/:id/generate-document', async (req: AuthRequest, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const result = await pool.query(
      `SELECT pv.*, u.nom as creator_nom, u.prenom as creator_prenom, u.grade as creator_grade
       FROM lrpgn_pv pv
       LEFT JOIN users u ON pv.created_by = u.id
       WHERE pv.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PV/PVE non trouvé' });
    }

    const pv = result.rows[0];
    const contenu = typeof pv.contenu === 'string' ? JSON.parse(pv.contenu) : pv.contenu;

    // Créer le PDF
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="pv-${pv.numero_pv}.pdf"`);
    doc.pipe(res);

    // En-tête
    doc.fontSize(20).text('PROCÈS-VERBAL', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(`Numéro: ${pv.numero_pv}`, { align: 'center' });
    doc.fontSize(12).text(`Type: ${pv.type.toUpperCase()}`, { align: 'center' });
    doc.moveDown();

    // Informations
    doc.fontSize(14).text('Informations', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`Date de création: ${new Date(pv.date_creation).toLocaleString('fr-FR')}`);
    if (pv.creator_nom) {
      doc.text(`Créé par: ${pv.creator_grade} ${pv.creator_nom} ${pv.creator_prenom}`);
    }
    doc.moveDown();

    // Contenu
    if (contenu) {
      if (contenu.titre) {
        doc.fontSize(14).text('Titre:', { underline: true });
        doc.fontSize(12).text(contenu.titre);
        doc.moveDown();
      }
      if (contenu.description) {
        doc.fontSize(14).text('Description:', { underline: true });
        doc.fontSize(12).text(contenu.description);
        doc.moveDown();
      }
      if (contenu.date_incident) {
        doc.text(`Date de l'incident: ${contenu.date_incident}`);
      }
      if (contenu.lieu) {
        doc.text(`Lieu: ${contenu.lieu}`);
      }
    }

    doc.end();
  } catch (error) {
    console.error('Erreur LRPGN:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
