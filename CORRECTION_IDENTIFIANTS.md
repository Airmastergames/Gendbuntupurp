# 🔧 Correction des identifiants de connexion

## Problème

Les identifiants par défaut ne fonctionnent pas :
- Email : `admin@gendbuntu.local`
- Mot de passe : `Admin123!`

## ✅ Solution rapide

### Option 1 : Script automatique (recommandé)

Dans le dossier `server/`, exécutez :

```bash
npm run fix:admin
```

Ce script va :
1. Générer un nouveau hash bcrypt pour le mot de passe `Admin123!`
2. Mettre à jour l'utilisateur admin dans la base de données
3. Ou créer l'utilisateur s'il n'existe pas

### Option 2 : Correction manuelle SQL

Si le script ne fonctionne pas, connectez-vous à PostgreSQL et exécutez :

```sql
-- Se connecter à la base de données
psql -U postgres -d gendbuntu

-- Supprimer l'ancien utilisateur (si existe)
DELETE FROM users WHERE email = 'admin@gendbuntu.local';

-- Créer un script Node.js temporaire pour générer le hash
-- Ou utilisez cette commande dans Node.js :
```

Puis dans Node.js :
```javascript
const bcrypt = require('bcryptjs');
bcrypt.hash('Admin123!', 10).then(hash => console.log(hash));
```

Copiez le hash généré et exécutez :

```sql
INSERT INTO users (rio, email, password_hash, nom, prenom, grade, numero_service, unit_id, role_id)
VALUES (
  'ADMIN001',
  'admin@gendbuntu.local',
  'COLLER_LE_HASH_ICI',
  'ADMIN',
  'Système',
  'Administrateur',
  'ADMIN001',
  1,
  1
);
```

## 🔍 Vérifications

### 1. Vérifier que l'utilisateur existe

```sql
SELECT id, email, rio, is_active FROM users WHERE email = 'admin@gendbuntu.local';
```

### 2. Vérifier que la base de données est bien initialisée

```sql
-- Vérifier les rôles
SELECT * FROM roles;

-- Vérifier les unités
SELECT * FROM units;
```

Si ces tables sont vides, exécutez :
```bash
psql -U postgres -d gendbuntu -f database/schema.sql
psql -U postgres -d gendbuntu -f database/seed.sql
```

## 🚀 Après correction

1. Redémarrez le serveur backend
2. Essayez de vous connecter avec :
   - **Email** : `admin@gendbuntu.local`
   - **Mot de passe** : `Admin123!`

## ⚠️ Si ça ne fonctionne toujours pas

1. **Vérifiez les logs du serveur** pour voir l'erreur exacte
2. **Vérifiez la console du navigateur** (F12) pour voir les erreurs
3. **Vérifiez que PostgreSQL est bien démarré**
4. **Vérifiez le fichier `server/.env`** avec les bonnes credentials

## 📝 Créer un nouvel utilisateur admin

Si vous préférez créer un nouvel utilisateur avec un autre mot de passe :

1. Connectez-vous à l'API (une fois que vous avez un compte qui fonctionne)
2. Utilisez le panneau d'administration pour créer un nouvel utilisateur
3. Ou utilisez directement SQL avec un hash généré

---

**Le script `npm run fix:admin` devrait résoudre le problème !**
