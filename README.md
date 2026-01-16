# 🎖️ GendBuntu - Système de gestion Gendarmerie Nationale

Système complet de gestion pour la Gendarmerie Nationale avec architecture moderne, sécurisée et modulaire.

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [Structure du projet](#-structure-du-projet)
- [Documentation API](#-documentation-api)

## 🧩 Fonctionnalités

### 1. Pulsar - Gestion des emplois du temps
- Planning journalier / hebdomadaire / mensuel
- Gestion des services, patrouilles, astreintes
- Attribution aux unités et personnels
- Registre PV avec génération automatique de numéros uniques
- Historique des PV
- Lien avec LRPGN

### 2. LRPGN - Outils OPJ
- Gestion des PVE (Procès-Verbaux d'Enquête)
- Gestion des PV (Procès-Verbaux)
- Fonctions utiles OPJ
- Lien avec le registre Pulsar
- Génération automatique de documents officiels
- Historique et traçabilité complète

### 3. Système de messagerie interne
- Boîte mail complète (réception, envoi, brouillons, archivage)
- Messagerie interne sécurisée
- Pièces jointes
- Notifications
- Liaison avec annuaire

### 4. Annuaire interne
- Champs obligatoires : RIO, Nom, Prénom, Grade, Numéro de service, Email, Unité
- Recherche avancée
- Filtrage par grade / unité

### 5. BDSP - Gestion des interventions (CORG)
- Création de fiches d'intervention
- Visualisation en temps réel
- Affectation d'unités par le CORG
- Statut d'intervention (en cours, terminée, critique)
- Historique et journal des actions

### 6. Application de compte-rendu
- Création de comptes rendus opérationnels
- Exportation en PDF (format officiel défini)
- Upload automatique du PDF sur Discord via webhook
- Archivage interne

### 7. EventGrave - Gestion des incidents graves
- Suivi des incidents terrain
- Gestion des militaires blessés
- Niveaux de gravité
- Chronologie des événements
- Liaison avec BDSP et comptes rendus

### 8. Panneau d'administration
- Gestion des utilisateurs
- Gestion des rôles et permissions
- Gestion des unités
- Logs système
- Paramétrage global
- Supervision base de données

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Base de données**: PostgreSQL
- **Authentification**: JWT (JSON Web Tokens)
- **Style**: Thème militaire sombre (GendBuntu)

## 📦 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

1. **Node.js** (version 18 ou supérieure)
   - Télécharger depuis [nodejs.org](https://nodejs.org/)
   - Vérifier l'installation : `node --version`

2. **PostgreSQL** (version 14 ou supérieure)
   - Windows : [PostgreSQL Windows](https://www.postgresql.org/download/windows/)
   - macOS : `brew install postgresql`
   - Linux : `sudo apt-get install postgresql`

3. **Git** (optionnel, pour cloner le projet)
   - Télécharger depuis [git-scm.com](https://git-scm.com/)

## 🚀 Installation

### Étape 1 : Cloner ou télécharger le projet

Si vous utilisez Git :
```bash
git clone <url-du-projet>
cd GendBuntu
```

Sinon, décompressez l'archive du projet dans un dossier.

### Étape 2 : Installer PostgreSQL

1. **Installer PostgreSQL** (si pas déjà fait)
   - Suivez l'installateur pour Windows/macOS
   - Notez le mot de passe que vous définissez pour l'utilisateur `postgres`

2. **Créer la base de données**
   - Ouvrez pgAdmin (interface graphique) ou utilisez la ligne de commande
   - Créez une nouvelle base de données nommée `gendbuntu`

**Via ligne de commande (psql)** :
```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE gendbuntu;

# Quitter
\q
```

### Étape 3 : Installer les dépendances

Ouvrez un terminal dans le dossier du projet et exécutez :

```bash
# Installer les dépendances du projet principal
npm install

# Installer les dépendances du serveur
cd server
npm install

# Installer les dépendances du client
cd ../client
npm install

# Revenir à la racine
cd ..
```

### Étape 4 : Configurer la base de données

1. **Exécuter le schéma SQL**
   - Ouvrez pgAdmin ou utilisez psql
   - Connectez-vous à la base de données `gendbuntu`
   - Exécutez le fichier `database/schema.sql`
   - Exécutez le fichier `database/seed.sql` (données initiales)

**Via psql** :
```bash
psql -U postgres -d gendbuntu -f database/schema.sql
psql -U postgres -d gendbuntu -f database/seed.sql
```

### Étape 5 : Configurer les variables d'environnement

1. **Créer le fichier `.env` dans le dossier `server/`**

Copiez le contenu suivant et adaptez selon votre configuration :

```env
# Configuration serveur
PORT=5000
NODE_ENV=development

# Base de données PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gendbuntu
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe_postgres

# JWT Secret (changez cette valeur en production !)
JWT_SECRET=votre-secret-jwt-tres-securise-changez-en-production
JWT_EXPIRES_IN=7d

# Discord Webhook pour comptes rendus (optionnel)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/VOTRE_WEBHOOK_ID/VOTRE_WEBHOOK_TOKEN

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app
```

**Important** : Remplacez `votre_mot_de_passe_postgres` par le mot de passe que vous avez défini pour PostgreSQL.

### Étape 6 : Créer les dossiers nécessaires

Créez les dossiers pour les uploads :

```bash
# Windows (PowerShell)
mkdir server\uploads\messagerie
mkdir server\uploads\comptes-rendus

# Linux/macOS
mkdir -p server/uploads/messagerie
mkdir -p server/uploads/comptes-rendus
```

## 🎮 Utilisation

### Démarrer l'application

**Option 1 : Démarrer tout en une commande** (recommandé)
```bash
npm run dev
```

**Option 2 : Démarrer séparément**

Terminal 1 (Backend) :
```bash
cd server
npm run dev
```

Terminal 2 (Frontend) :
```bash
cd client
npm start
```

### Accéder à l'application

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:5000

### Compte administrateur par défaut

Après avoir exécuté `seed.sql`, vous pouvez vous connecter avec :
- **Email** : `admin@gendbuntu.local`
- **Mot de passe** : `Admin123!`

**⚠️ IMPORTANT** : Changez ce mot de passe immédiatement en production !

## 📁 Structure du projet

```
GendBuntu/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   ├── contexts/       # Contextes React (Auth)
│   │   ├── pages/          # Pages de l'application
│   │   └── App.tsx         # Point d'entrée
│   └── package.json
├── server/                 # Backend Node.js
│   ├── src/
│   │   ├── config/         # Configuration (DB)
│   │   ├── middleware/     # Middleware (Auth)
│   │   ├── routes/         # Routes API
│   │   └── index.ts        # Point d'entrée
│   └── package.json
├── database/               # Scripts SQL
│   ├── schema.sql          # Schéma de base de données
│   └── seed.sql            # Données initiales
├── package.json            # Scripts globaux
└── README.md              # Ce fichier
```

## 🔧 Configuration Discord Webhook (optionnel)

Pour activer l'envoi automatique des comptes rendus sur Discord :

1. Créez un serveur Discord (ou utilisez un existant)
2. Allez dans **Paramètres du serveur** > **Intégrations** > **Webhooks**
3. Créez un nouveau webhook
4. Copiez l'URL du webhook
5. Ajoutez-la dans `server/.env` : `DISCORD_WEBHOOK_URL=votre_url`

## 🛠️ Scripts disponibles

### Racine du projet
- `npm run dev` : Démarrer frontend et backend en parallèle
- `npm run install:all` : Installer toutes les dépendances
- `npm run build` : Build de production du frontend

### Serveur
- `npm run dev` : Démarrer en mode développement
- `npm run build` : Compiler TypeScript
- `npm start` : Démarrer en mode production

### Client
- `npm start` : Démarrer le serveur de développement
- `npm run build` : Build de production

## 🔒 Sécurité

- Les mots de passe sont hashés avec bcrypt
- Authentification JWT
- Protection CORS
- Validation des entrées
- Logs système pour traçabilité

## 📝 Notes importantes

1. **En production**, changez absolument :
   - Le `JWT_SECRET` dans `.env`
   - Le mot de passe administrateur par défaut
   - Les credentials de base de données

2. **Base de données** : Faites des sauvegardes régulières de PostgreSQL

3. **Uploads** : Les fichiers uploadés sont stockés dans `server/uploads/`. Assurez-vous que ce dossier existe et est accessible.

## 🐛 Dépannage

### Erreur de connexion à la base de données
- Vérifiez que PostgreSQL est démarré
- Vérifiez les credentials dans `server/.env`
- Vérifiez que la base de données `gendbuntu` existe

### Erreur "Port already in use"
- Changez le `PORT` dans `server/.env`
- Ou arrêtez le processus utilisant le port

### Erreur lors de l'installation des dépendances
- Vérifiez que Node.js est bien installé : `node --version`
- Supprimez `node_modules` et réinstallez : `rm -rf node_modules && npm install`

## 📞 Support

Pour toute question ou problème, consultez la documentation ou créez une issue.

## 📄 Licence

Ce projet est destiné à un usage interne.

---

**GendBuntu** - Système de gestion Gendarmerie Nationale
Version 1.0.0
