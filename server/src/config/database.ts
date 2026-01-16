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
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('❌ Erreur de connexion PostgreSQL:', err);
  console.error('💡 Vérifiez que PostgreSQL est démarré et que les credentials dans server/.env sont corrects.');
});

// Tester la connexion au démarrage
pool.query('SELECT NOW()')
  .then(() => {
    console.log('✅ Connexion à PostgreSQL réussie');
  })
  .catch((err) => {
    console.error('❌ Impossible de se connecter à PostgreSQL:', err.message);
    console.error('💡 Vérifiez:');
    console.error('   - PostgreSQL est démarré');
    console.error('   - La base de données "gendbuntu" existe');
    console.error('   - Les credentials dans server/.env sont corrects');
  });

export default pool;
