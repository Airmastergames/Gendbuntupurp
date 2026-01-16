import express from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const result = await pool.query(
      'SELECT id, rio, email, password_hash, nom, prenom, grade, role_id, unit_id, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Compte désactivé' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    // Mettre à jour last_login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Générer le token JWT
    const jwtSecret = process.env.JWT_SECRET || 'secret';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    const token = jwt.sign(
      {
        id: user.id,
        rio: user.rio,
        email: user.email,
        role_id: user.role_id,
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn } as SignOptions
    );

    res.json({
      token,
      user: {
        id: user.id,
        rio: user.rio,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        grade: user.grade,
        role_id: user.role_id,
        unit_id: user.unit_id,
      },
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Vérifier le token
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.rio, u.email, u.nom, u.prenom, u.grade, u.numero_service, 
              u.role_id, u.unit_id, r.name as role_name, un.name as unit_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN units un ON u.unit_id = un.id
       WHERE u.id = $1`,
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur me:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Changer le mot de passe
router.post('/change-password', authenticate, async (req: AuthRequest, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis' });
    }

    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user!.id]);
    const user = result.rows[0];

    const isValid = await bcrypt.compare(oldPassword, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Ancien mot de passe incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user!.id]);

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Erreur change-password:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
