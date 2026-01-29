import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import annuaireRoutes from './routes/annuaire';
import pulsarRoutes from './routes/pulsar';
import lrpgnRoutes from './routes/lrpgn';
import messagerieRoutes from './routes/messagerie';
import bdspRoutes from './routes/bdsp';
import comptesRendusRoutes from './routes/comptesRendus';
import eventGraveRoutes from './routes/eventGrave';
import adminRoutes from './routes/admin';
import dashboardRoutes from './routes/dashboard';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dossier pour les uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/annuaire', annuaireRoutes);
app.use('/api/pulsar', pulsarRoutes);
app.use('/api/lrpgn', lrpgnRoutes);
app.use('/api/messagerie', messagerieRoutes);
app.use('/api/bdsp', bdspRoutes);
app.use('/api/comptes-rendus', comptesRendusRoutes);
app.use('/api/eventgrave', eventGraveRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'GendBuntu API is running' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur GendBuntu démarré sur le port ${PORT}`);
  console.log(`📡 API disponible sur http://0.0.0.0:${PORT}/api`);
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Erreur: Le port ${PORT} est déjà utilisé.`);
    console.error(`💡 Solution: Changez le PORT dans server/.env ou arrêtez l'application utilisant ce port.`);
  } else {
    console.error('❌ Erreur lors du démarrage du serveur:', err);
  }
  process.exit(1);
});
