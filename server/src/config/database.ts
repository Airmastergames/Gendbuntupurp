import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'gendbuntu',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Augmenté à 10 secondes pour Docker
});

pool.on('error', (err) => {
  console.error('❌ Erreur de connexion PostgreSQL:', err);
  console.error('💡 Vérifiez que PostgreSQL est démarré et que les credentials sont corrects.');
});

// Fonction pour tester la connexion avec retry
async function testConnection(retries = 10, delay = 2000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT NOW()');
      console.log('✅ Connexion à PostgreSQL réussie');
      return;
    } catch (err: any) {
      if (i === retries - 1) {
        console.error('❌ Impossible de se connecter à PostgreSQL après', retries, 'tentatives');
        console.error('Erreur:', err.message);
        console.error('💡 Vérifiez:');
        console.error('   - PostgreSQL est démarré');
        console.error('   - La base de données "' + (process.env.DB_NAME || 'gendbuntu') + '" existe');
        console.error('   - Les credentials dans .env sont corrects');
        throw err;
      }
      console.log(`⏳ Tentative de connexion ${i + 1}/${retries}... (attente ${delay}ms)`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Tester la connexion au démarrage avec retry
testConnection().catch((err) => {
  console.error('❌ Échec de la connexion à la base de données');
  process.exit(1);
});

export default pool;
