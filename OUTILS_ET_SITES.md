# 🛠️ Outils et sites à utiliser - GendBuntu

## 📦 Logiciels à installer (GRATUITS)

### 1. Node.js
- **Site** : https://nodejs.org/
- **Version** : LTS (Long Term Support) - Version 18 ou supérieure
- **Gratuit** : ✅ Oui
- **Pourquoi** : Nécessaire pour exécuter le frontend (React) et le backend (Node.js)

### 2. PostgreSQL
- **Site** : https://www.postgresql.org/download/
- **Version** : 14 ou supérieure
- **Gratuit** : ✅ Oui
- **Pourquoi** : Base de données pour stocker toutes les données
- **Alternative Windows** : https://www.postgresql.org/download/windows/
- **Alternative macOS** : `brew install postgresql` (via Homebrew)

### 3. pgAdmin (optionnel mais recommandé)
- **Site** : https://www.pgadmin.org/download/
- **Gratuit** : ✅ Oui
- **Pourquoi** : Interface graphique pour gérer PostgreSQL facilement
- **Note** : Inclus avec l'installation PostgreSQL sur Windows

### 4. Git (optionnel)
- **Site** : https://git-scm.com/downloads
- **Gratuit** : ✅ Oui
- **Pourquoi** : Pour cloner le projet (si vous utilisez Git)
- **Note** : Pas obligatoire si vous téléchargez le projet en ZIP

### 5. Visual Studio Code (recommandé)
- **Site** : https://code.visualstudio.com/
- **Gratuit** : ✅ Oui
- **Pourquoi** : Éditeur de code moderne et gratuit
- **Extensions utiles** :
  - ESLint
  - Prettier
  - PostgreSQL (pour se connecter à la DB)

## 🌐 Services en ligne (optionnels)

### 1. Discord (pour les webhooks)
- **Site** : https://discord.com/
- **Gratuit** : ✅ Oui
- **Pourquoi** : Pour recevoir automatiquement les comptes rendus sur Discord
- **Comment** :
  1. Créer un serveur Discord
  2. Paramètres > Intégrations > Webhooks
  3. Créer un webhook
  4. Copier l'URL dans `server/.env`

### 2. GitHub (optionnel)
- **Site** : https://github.com/
- **Gratuit** : ✅ Oui
- **Pourquoi** : Pour sauvegarder votre code en ligne (backup)

## 📚 Documentation et ressources

### Documentation officielle
- **Node.js** : https://nodejs.org/docs/
- **React** : https://react.dev/
- **PostgreSQL** : https://www.postgresql.org/docs/
- **Express** : https://expressjs.com/

### Tutoriels utiles
- **Node.js débutant** : https://nodejs.org/en/docs/guides/getting-started-guide/
- **PostgreSQL débutant** : https://www.postgresql.org/docs/current/tutorial.html
- **React débutant** : https://react.dev/learn

## 🔧 Outils de développement (optionnels)

### 1. Postman (pour tester l'API)
- **Site** : https://www.postman.com/downloads/
- **Gratuit** : ✅ Oui (version gratuite disponible)
- **Pourquoi** : Tester les endpoints API facilement

### 2. DBeaver (alternative à pgAdmin)
- **Site** : https://dbeaver.io/download/
- **Gratuit** : ✅ Oui
- **Pourquoi** : Interface graphique alternative pour PostgreSQL

### 3. Insomnia (alternative à Postman)
- **Site** : https://insomnia.rest/download
- **Gratuit** : ✅ Oui
- **Pourquoi** : Alternative à Postman pour tester l'API

## 📦 Packages npm utilisés (déjà inclus)

Tous ces packages sont **gratuits** et **open source** :

### Frontend
- `react` - Framework UI
- `react-router-dom` - Navigation
- `axios` - Appels HTTP
- `react-toastify` - Notifications

### Backend
- `express` - Framework web
- `pg` - Client PostgreSQL
- `bcryptjs` - Hashage mots de passe
- `jsonwebtoken` - Authentification JWT
- `pdfkit` - Génération PDF
- `multer` - Upload fichiers
- `form-data` - Envoi fichiers Discord

## 💰 Coût total

**0€ - Tout est gratuit !**

- ✅ Node.js : Gratuit
- ✅ PostgreSQL : Gratuit
- ✅ React : Gratuit
- ✅ Tous les packages npm : Gratuits
- ✅ Discord : Gratuit
- ✅ GitHub : Gratuit

## 🚀 Installation rapide des outils

### Windows
1. Téléchargez Node.js depuis nodejs.org
2. Téléchargez PostgreSQL depuis postgresql.org/download/windows/
3. Installez les deux
4. Redémarrez votre ordinateur

### macOS
```bash
# Installer Homebrew (si pas déjà fait)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installer Node.js
brew install node

# Installer PostgreSQL
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu/Debian)
```bash
# Installer Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

## ✅ Checklist avant de commencer

- [ ] Node.js installé (`node --version` fonctionne)
- [ ] PostgreSQL installé et démarré
- [ ] Base de données `gendbuntu` créée
- [ ] Fichier `server/.env` configuré
- [ ] Toutes les dépendances installées (`npm run install:all`)

---

**Tous les outils sont gratuits et open source ! 🎉**
