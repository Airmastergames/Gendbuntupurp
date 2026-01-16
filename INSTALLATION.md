# 📖 Guide d'installation détaillé - GendBuntu

Ce guide vous accompagne pas à pas pour installer GendBuntu sur votre machine locale.

## 🎯 Vue d'ensemble

GendBuntu nécessite :
1. Node.js (pour le frontend et backend)
2. PostgreSQL (pour la base de données)
3. Un navigateur web moderne

Temps estimé : 30-45 minutes

---

## 📥 ÉTAPE 1 : Installer Node.js

### Windows

1. Allez sur [https://nodejs.org/](https://nodejs.org/)
2. Téléchargez la version **LTS** (Long Term Support)
3. Exécutez l'installateur
4. Suivez les instructions (cliquez sur "Next" jusqu'à la fin)
5. **Redémarrez votre ordinateur** (important !)

### Vérification

Ouvrez **PowerShell** ou **Invite de commandes** et tapez :
```bash
node --version
npm --version
```

Vous devriez voir des numéros de version (ex: v18.17.0 et 9.6.7).

✅ **Si ça fonctionne, passez à l'étape 2 !**

---

## 🗄️ ÉTAPE 2 : Installer PostgreSQL

### Windows

1. Allez sur [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Cliquez sur "Download the installer"
3. Téléchargez l'installateur (ex: postgresql-15-x64.exe)
4. Exécutez l'installateur
5. **Important** : Notez le mot de passe que vous définissez pour l'utilisateur `postgres` (vous en aurez besoin !)
6. Laissez le port par défaut (5432)
7. Laissez toutes les options par défaut et terminez l'installation

### Vérification

PostgreSQL devrait être démarré automatiquement. Vérifiez dans le menu Démarrer, cherchez "pgAdmin 4" et ouvrez-le.

✅ **Si pgAdmin s'ouvre, PostgreSQL est installé !**

---

## 📂 ÉTAPE 3 : Préparer le projet

1. **Téléchargez ou clonez le projet GendBuntu**
   - Si vous avez le projet en ZIP, décompressez-le
   - Placez-le dans un dossier facile d'accès (ex: `C:\Users\VotreNom\Desktop\GendBuntu`)

2. **Ouvrez PowerShell dans le dossier du projet**
   - Cliquez droit sur le dossier GendBuntu
   - Sélectionnez "Ouvrir dans PowerShell" ou "Ouvrir dans le terminal"

---

## 🗃️ ÉTAPE 4 : Créer la base de données

### Méthode 1 : Avec pgAdmin (recommandé pour débutants)

1. Ouvrez **pgAdmin 4** (depuis le menu Démarrer)
2. Connectez-vous avec le mot de passe que vous avez défini lors de l'installation
3. Dans le panneau de gauche, cliquez droit sur **"Databases"**
4. Sélectionnez **"Create" > "Database..."**
5. Dans "Database" : tapez `gendbuntu`
6. Cliquez sur **"Save"**

### Méthode 2 : Avec la ligne de commande

1. Ouvrez PowerShell
2. Tapez :
```bash
psql -U postgres
```
3. Entrez votre mot de passe PostgreSQL
4. Tapez :
```sql
CREATE DATABASE gendbuntu;
```
5. Tapez :
```sql
\q
```

✅ **Base de données créée !**

---

## 📦 ÉTAPE 5 : Installer les dépendances

Dans PowerShell, dans le dossier GendBuntu, exécutez :

```bash
# Étape 5.1 : Installer les dépendances principales
npm install

# Étape 5.2 : Installer les dépendances du serveur
cd server
npm install

# Étape 5.3 : Installer les dépendances du client
cd ../client
npm install

# Étape 5.4 : Revenir à la racine
cd ..
```

⏱️ **Cela peut prendre 5-10 minutes** (téléchargement des packages)

✅ **Quand c'est terminé, passez à l'étape 6 !**

---

## 🗄️ ÉTAPE 6 : Configurer la base de données

### Méthode 1 : Avec pgAdmin

1. Dans pgAdmin, cliquez sur la base de données `gendbuntu`
2. Cliquez sur l'icône **"Query Tool"** (ou F5)
3. Ouvrez le fichier `database/schema.sql` dans un éditeur de texte
4. Copiez tout le contenu
5. Collez-le dans pgAdmin Query Tool
6. Cliquez sur **"Execute"** (ou F5)
7. Répétez avec `database/seed.sql`

### Méthode 2 : Avec la ligne de commande

Dans PowerShell, dans le dossier GendBuntu :

```bash
# Exécuter le schéma
psql -U postgres -d gendbuntu -f database/schema.sql

# Exécuter les données initiales
psql -U postgres -d gendbuntu -f database/seed.sql
```

Vous devrez entrer votre mot de passe PostgreSQL à chaque fois.

✅ **Base de données configurée !**

---

## ⚙️ ÉTAPE 7 : Configurer les variables d'environnement

1. Dans le dossier `server/`, créez un fichier nommé `.env`
   - Si vous ne voyez pas l'extension, créez un fichier texte et renommez-le en `.env`

2. Ouvrez ce fichier avec le Bloc-notes et copiez ce contenu :

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=gendbuntu
DB_USER=postgres
DB_PASSWORD=VOTRE_MOT_DE_PASSE_POSTGRES

JWT_SECRET=gendbuntu-secret-key-change-in-production-2024
JWT_EXPIRES_IN=7d

DISCORD_WEBHOOK_URL=
```

3. **Remplacez `VOTRE_MOT_DE_PASSE_POSTGRES`** par le mot de passe que vous avez défini pour PostgreSQL

4. Sauvegardez le fichier

✅ **Configuration terminée !**

---

## 📁 ÉTAPE 8 : Créer les dossiers d'uploads

Dans PowerShell, dans le dossier GendBuntu :

```bash
# Créer les dossiers nécessaires
mkdir server\uploads
mkdir server\uploads\messagerie
mkdir server\uploads\comptes-rendus
```

✅ **Dossiers créés !**

---

## 🚀 ÉTAPE 9 : Démarrer l'application

Dans PowerShell, dans le dossier GendBuntu :

```bash
npm run dev
```

⏱️ **Attendez quelques secondes...**

Vous devriez voir :
- Le serveur backend démarrer sur le port 5000
- Le frontend démarrer sur le port 3000
- Votre navigateur s'ouvrir automatiquement sur http://localhost:3000

✅ **L'application est lancée !**

---

## 🔐 ÉTAPE 10 : Se connecter

1. Sur la page de connexion, utilisez :
   - **Email** : `admin@gendbuntu.local`
   - **Mot de passe** : `Admin123!`

2. Cliquez sur "Se connecter"

✅ **Vous êtes connecté !**

---

## 🎉 Félicitations !

GendBuntu est maintenant installé et fonctionnel sur votre machine !

---

## ❓ Problèmes courants

### "node n'est pas reconnu"
- Redémarrez votre ordinateur après l'installation de Node.js
- Vérifiez que Node.js est bien installé : `node --version`

### "psql n'est pas reconnu"
- Ajoutez PostgreSQL au PATH Windows
- Ou utilisez pgAdmin à la place

### "Erreur de connexion à la base de données"
- Vérifiez que PostgreSQL est démarré (Services Windows)
- Vérifiez le mot de passe dans `server/.env`
- Vérifiez que la base de données `gendbuntu` existe

### "Port 5000 déjà utilisé"
- Changez `PORT=5000` en `PORT=5001` dans `server/.env`
- Redémarrez l'application

### "Module non trouvé"
- Supprimez `node_modules` dans `server/` et `client/`
- Réinstallez : `npm install` dans chaque dossier

---

## 📞 Besoin d'aide ?

Consultez le fichier `README.md` pour plus d'informations.

---

**Bon courage ! 🎖️**
