import express from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.use(authenticate);

// Générer un numéro de compte-rendu unique
const generateNumeroCR = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM comptes_rendus WHERE numero_cr LIKE $1',
    [`CR-${year}-%`]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `CR-${year}-${String(count).padStart(6, '0')}`;
};

// Générer le PDF du compte-rendu
const generatePDF = async (cr: any, user: any): Promise<string> => {
  const uploadDir = path.join(__dirname, '../../uploads/comptes-rendus');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `CR-${cr.numero_cr}-${Date.now()}.pdf`;
  const filepath = path.join(uploadDir, filename);

  const doc = new PDFDocument({ margin: 50 });

  doc.pipe(fs.createWriteStream(filepath));

  // En-tête
  doc.fontSize(16).text('COMPTE-RENDU OPÉRATIONNEL', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`N° ${cr.numero_cr}`, { align: 'center' });
  doc.moveDown(2);

  // Informations générales
  doc.fontSize(10);
  doc.text(`Date de l'incident: ${cr.date_incident ? new Date(cr.date_incident).toLocaleDateString('fr-FR') : 'N/A'}`);
  doc.text(`Type: ${cr.type}`);
  doc.text(`Rédigé par: ${user.nom} ${user.prenom} - ${user.grade}`);
  doc.text(`Date de rédaction: ${new Date(cr.created_at).toLocaleDateString('fr-FR')}`);
  doc.moveDown();

  // Titre
  doc.fontSize(14).text(cr.titre, { underline: true });
  doc.moveDown();

  // Contenu
  doc.fontSize(11);
  const lines = cr.contenu.split('\n');
  lines.forEach((line: string) => {
    doc.text(line);
  });

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(filepath));
    doc.on('error', reject);
  });
};

// Envoyer le PDF sur Discord via webhook
const sendToDiscord = async (filepath: string, cr: any): Promise<void> => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL non configuré');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filepath), {
      filename: path.basename(filepath),
      contentType: 'application/pdf',
    });
    formData.append('content', `📄 Nouveau compte-rendu: ${cr.numero_cr}\n${cr.titre}`);

    await axios.post(webhookUrl, formData, {
      headers: formData.getHeaders(),
    });
  } catch (error) {
    console.error('Erreur envoi Discord:', error);
    throw error;
  }
};

// Récupérer tous les comptes rendus
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { type, start_date, end_date } = req.query;

    let query = `
      SELECT cr.*, u.nom as creator_nom, u.prenom as creator_prenom, u.grade as creator_grade
      FROM comptes_rendus cr
      LEFT JOIN users u ON cr.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (type) {
      query += ` AND cr.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (start_date) {
      query += ` AND cr.date_incident >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND cr.date_incident <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` ORDER BY cr.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur comptes rendus:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un compte-rendu
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { titre, contenu, type, date_incident } = req.body;

    if (!titre || !contenu || !type) {
      return res.status(400).json({ error: 'Titre, contenu et type requis' });
    }

    const numero_cr = await generateNumeroCR();

    // Récupérer les infos utilisateur
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user!.id]);
    const user = userResult.rows[0];

    // Créer le compte-rendu
    const result = await pool.query(
      `INSERT INTO comptes_rendus (numero_cr, titre, contenu, type, date_incident, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [numero_cr, titre, contenu, type, date_incident || null, req.user!.id]
    );

    const cr = result.rows[0];

    // Générer le PDF
    try {
      const pdfPath = await generatePDF(cr, user);
      await pool.query('UPDATE comptes_rendus SET pdf_path = $1 WHERE id = $2', [pdfPath, cr.id]);
      cr.pdf_path = pdfPath;

      // Envoyer sur Discord
      try {
        await sendToDiscord(pdfPath, cr);
        await pool.query(
          'UPDATE comptes_rendus SET discord_webhook_sent = true, discord_sent_at = CURRENT_TIMESTAMP WHERE id = $1',
          [cr.id]
        );
        cr.discord_webhook_sent = true;
      } catch (discordError) {
        console.error('Erreur Discord (non bloquant):', discordError);
      }
    } catch (pdfError) {
      console.error('Erreur génération PDF:', pdfError);
    }

    res.status(201).json(cr);
  } catch (error) {
    console.error('Erreur comptes rendus:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un compte-rendu par ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT cr.*, u.nom as creator_nom, u.prenom as creator_prenom, u.grade as creator_grade
       FROM comptes_rendus cr
       LEFT JOIN users u ON cr.created_by = u.id
       WHERE cr.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compte-rendu non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur comptes rendus:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Télécharger le PDF
router.get('/:id/pdf', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('SELECT pdf_path FROM comptes_rendus WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0 || !result.rows[0].pdf_path) {
      return res.status(404).json({ error: 'PDF non trouvé' });
    }

    const filepath = result.rows[0].pdf_path;
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Fichier PDF introuvable' });
    }

    res.download(filepath);
  } catch (error) {
    console.error('Erreur comptes rendus:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un compte-rendu par ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT cr.*, u.nom as creator_nom, u.prenom as creator_prenom, u.grade as creator_grade
       FROM comptes_rendus cr
       LEFT JOIN users u ON cr.created_by = u.id
       WHERE cr.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compte-rendu non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur comptes rendus:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier un compte-rendu
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { titre, contenu, type, date_incident } = req.body;

    const result = await pool.query(
      `UPDATE comptes_rendus
       SET titre = COALESCE($1, titre),
           contenu = COALESCE($2, contenu),
           type = COALESCE($3, type),
           date_incident = COALESCE($4, date_incident)
       WHERE id = $5
       RETURNING *`,
      [titre || null, contenu || null, type || null, date_incident || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compte-rendu non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur comptes rendus:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un compte-rendu
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('DELETE FROM comptes_rendus WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compte-rendu non trouvé' });
    }

    res.json({ message: 'Compte-rendu supprimé avec succès' });
  } catch (error) {
    console.error('Erreur comptes rendus:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
