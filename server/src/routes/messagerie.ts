import express from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

router.use(authenticate);

// Configuration multer pour les pièces jointes
const uploadDir = path.join(__dirname, '../../uploads/messagerie');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

// Récupérer les messages reçus
router.get('/inbox', async (req: AuthRequest, res) => {
  try {
    const { is_read, is_archived } = req.query;

    let query = `
      SELECT m.*, mr.is_read, mr.is_archived, mr.read_at,
             sender.rio as sender_rio, sender.nom as sender_nom, sender.prenom as sender_prenom, sender.grade as sender_grade
      FROM messages m
      JOIN message_recipients mr ON m.id = mr.message_id
      JOIN users sender ON m.sender_id = sender.id
      WHERE mr.recipient_id = $1
    `;
    const params: any[] = [req.user!.id];
    let paramCount = 2;

    if (is_read !== undefined) {
      query += ` AND mr.is_read = $${paramCount}`;
      params.push(is_read === 'true');
      paramCount++;
    }

    if (is_archived !== undefined) {
      query += ` AND mr.is_archived = $${paramCount}`;
      params.push(is_archived === 'true');
      paramCount++;
    }

    query += ` ORDER BY m.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur messagerie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les messages envoyés
router.get('/sent', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, COUNT(mr.id) as recipient_count
       FROM messages m
       LEFT JOIN message_recipients mr ON m.id = mr.message_id
       WHERE m.sender_id = $1 AND m.is_draft = false
       GROUP BY m.id
       ORDER BY m.created_at DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur messagerie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les brouillons
router.get('/drafts', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM messages WHERE sender_id = $1 AND is_draft = true ORDER BY updated_at DESC',
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur messagerie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un message par ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const messageResult = await pool.query(
      `SELECT m.*, sender.rio as sender_rio, sender.nom as sender_nom, sender.prenom as sender_prenom, sender.grade as sender_grade
       FROM messages m
       JOIN users sender ON m.sender_id = sender.id
       WHERE m.id = $1`,
      [req.params.id]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    const message = messageResult.rows[0];

    // Récupérer les destinataires
    const recipientsResult = await pool.query(
      `SELECT mr.*, u.rio, u.nom, u.prenom, u.grade, u.email
       FROM message_recipients mr
       JOIN users u ON mr.recipient_id = u.id
       WHERE mr.message_id = $1`,
      [req.params.id]
    );
    message.recipients = recipientsResult.rows;

    // Récupérer les pièces jointes
    const attachmentsResult = await pool.query(
      'SELECT * FROM message_attachments WHERE message_id = $1',
      [req.params.id]
    );
    message.attachments = attachmentsResult.rows;

    // Si c'est un message reçu, le marquer comme lu
    if (!message.is_draft) {
      await pool.query(
        'UPDATE message_recipients SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE message_id = $1 AND recipient_id = $2',
        [req.params.id, req.user!.id]
      );
    }

    res.json(message);
  } catch (error) {
    console.error('Erreur messagerie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Envoyer un message
router.post('/', upload.array('attachments', 10), async (req: AuthRequest, res) => {
  try {
    const { subject, body, recipients, is_draft } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ error: 'Sujet et corps du message requis' });
    }

    let recipientsArray: number[] = [];
    if (recipients) {
      if (Array.isArray(recipients)) {
        recipientsArray = recipients.map(r => typeof r === 'string' ? parseInt(r) : r);
      } else if (typeof recipients === 'string') {
        try {
          const parsed = JSON.parse(recipients);
          recipientsArray = Array.isArray(parsed) ? parsed.map((r: any) => typeof r === 'string' ? parseInt(r) : r) : [parseInt(recipients)];
        } catch {
          recipientsArray = [parseInt(recipients)];
        }
      } else {
        recipientsArray = [recipients];
      }
    }

    if (!is_draft && recipientsArray.length === 0) {
      return res.status(400).json({ error: 'Au moins un destinataire requis' });
    }

    // Créer le message
    const messageResult = await pool.query(
      `INSERT INTO messages (subject, body, sender_id, is_draft)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [subject, body, req.user!.id, is_draft === 'true' || is_draft === true]
    );

    const message = messageResult.rows[0];

    // Ajouter les destinataires si ce n'est pas un brouillon
    if (!message.is_draft) {
      for (const recipientId of recipientsArray) {
        await pool.query(
          'INSERT INTO message_recipients (message_id, recipient_id) VALUES ($1, $2)',
          [message.id, recipientId]
        );
      }
    }

    // Ajouter les pièces jointes
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files as Express.Multer.File[]) {
        await pool.query(
          `INSERT INTO message_attachments (message_id, file_name, file_path, file_size, mime_type)
           VALUES ($1, $2, $3, $4, $5)`,
          [message.id, file.originalname, file.path, file.size, file.mimetype]
        );
      }
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Erreur messagerie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Archiver un message
router.post('/:id/archive', async (req: AuthRequest, res) => {
  try {
    await pool.query(
      'UPDATE message_recipients SET is_archived = true WHERE message_id = $1 AND recipient_id = $2',
      [req.params.id, req.user!.id]
    );
    res.json({ message: 'Message archivé' });
  } catch (error) {
    console.error('Erreur messagerie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un message (pour le destinataire)
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await pool.query(
      'DELETE FROM message_recipients WHERE message_id = $1 AND recipient_id = $2',
      [req.params.id, req.user!.id]
    );
    res.json({ message: 'Message supprimé' });
  } catch (error) {
    console.error('Erreur messagerie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Compter les messages non lus
router.get('/unread/count', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM message_recipients WHERE recipient_id = $1 AND is_read = false',
      [req.user!.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Erreur messagerie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
