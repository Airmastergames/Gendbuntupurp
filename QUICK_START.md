# ⚡ Démarrage rapide - GendBuntu

Guide ultra-rapide pour démarrer GendBuntu en 5 minutes (si vous avez déjà Node.js et PostgreSQL).

## Prérequis installés ✅

- ✅ Node.js 18+
- ✅ PostgreSQL 14+
- ✅ Base de données `gendbuntu` créée

## Installation express

```bash
# 1. Installer toutes les dépendances
npm run install:all

# 2. Configurer la base de données
psql -U postgres -d gendbuntu -f database/schema.sql
psql -U postgres -d gendbuntu -f database/seed.sql

# 3. Créer le fichier server/.env
# Copiez le contenu ci-dessous et adaptez le mot de passe PostgreSQL

# 4. Créer les dossiers
mkdir server\uploads\messagerie
mkdir server\uploads\comptes-rendus

# 5. Démarrer
npm run dev
```

## Fichier server/.env minimal

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gendbuntu
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
JWT_SECRET=changez-moi-en-production
JWT_EXPIRES_IN=7d
```

## Connexion

- URL : http://localhost:3000
- Email : `admin@gendbuntu.local`
- Mot de passe : `Admin123!`

---

Pour plus de détails, consultez `INSTALLATION.md` ou `README.md`.
