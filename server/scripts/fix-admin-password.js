const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'gendbuntu',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function fixAdminPassword() {
  try {
    console.log('🔧 Génération du hash pour Admin123!...');
    
    // Générer le hash
    const password = 'Admin123!';
    const hash = await bcrypt.hash(password, 10);
    
    console.log('✅ Hash généré:', hash);
    
    // Mettre à jour dans la base de données
    const result = await pool.query(
      `UPDATE users 
       SET password_hash = $1 
       WHERE email = 'admin@gendbuntu.local' 
       RETURNING id, email, rio`,
      [hash]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Mot de passe administrateur mis à jour avec succès !');
      console.log('📧 Email:', result.rows[0].email);
      console.log('🔑 Mot de passe: Admin123!');
    } else {
      // Si l'utilisateur n'existe pas, le créer
      console.log('⚠️  Utilisateur admin non trouvé, création...');
      
      const createResult = await pool.query(
        `INSERT INTO users (rio, email, password_hash, nom, prenom, grade, numero_service, unit_id, role_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, email, rio`,
        ['ADMIN001', 'admin@gendbuntu.local', hash, 'ADMIN', 'Système', 'Administrateur', 'ADMIN001', 1, 1]
      );
      
      console.log('✅ Utilisateur administrateur créé !');
      console.log('📧 Email:', createResult.rows[0].email);
      console.log('🔑 Mot de passe: Admin123!');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    await pool.end();
    process.exit(1);
  }
}

fixAdminPassword();
