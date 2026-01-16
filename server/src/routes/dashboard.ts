import express from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

// Statistiques du tableau de bord (accessible à tous les utilisateurs authentifiés)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Récupérer les informations utilisateur complètes
    const userResult = await pool.query(
      `SELECT u.*, r.name as role_name, un.name as unit_name, un.code as unit_code
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN units un ON u.unit_id = un.id
       WHERE u.id = $1`,
      [userId]
    );

    const user = userResult.rows[0];

    // Statistiques générales
    const stats = {
      // Informations utilisateur
      user: {
        id: user.id,
        rio: user.rio,
        nom: user.nom,
        prenom: user.prenom,
        grade: user.grade,
        email: user.email,
        numero_service: user.numero_service,
        role_name: user.role_name,
        unit_name: user.unit_name,
        unit_code: user.unit_code,
        last_login: user.last_login,
      },
      // Statistiques globales
      users: parseInt((await pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = true')).rows[0].count),
      active_interventions: parseInt((await pool.query("SELECT COUNT(*) as count FROM interventions WHERE status = 'en_cours'")).rows[0].count),
      incidents_graves: parseInt((await pool.query('SELECT COUNT(*) as count FROM incidents_graves')).rows[0].count),
      // Messages non lus de l'utilisateur
      unread_messages: parseInt((await pool.query(
        `SELECT COUNT(*) as count 
         FROM message_recipients mr
         JOIN messages m ON mr.message_id = m.id
         WHERE mr.recipient_id = $1 AND mr.is_read = false AND m.is_draft = false`,
        [userId]
      )).rows[0].count),
      // Messages totaux non lus
      messages: parseInt((await pool.query(
        `SELECT COUNT(*) as count 
         FROM message_recipients mr
         JOIN messages m ON mr.message_id = m.id
         WHERE mr.recipient_id = $1 AND mr.is_read = false AND m.is_draft = false`,
        [userId]
      )).rows[0].count),
    };

    res.json(stats);
  } catch (error) {
    console.error('Erreur dashboard:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
