# 🔧 Correction de l'erreur ECONNREFUSED

## Problème

L'erreur `Proxy error: Could not proxy request /api/auth/login from localhost:3000 to http://localhost:5000/ (ECONNREFUSED)` signifie que **le serveur backend n'est pas démarré**.

## ✅ Solution rapide

### Étape 1 : Démarrer le serveur backend

Ouvrez un **nouveau terminal** et exécutez :

```bash
cd server
npm run dev
```

Vous devriez voir :
```
🚀 Serveur GendBuntu démarré sur le port 5000
✅ Connexion à PostgreSQL réussie
```

### Étape 2 : Vérifier que le backend fonctionne

Ouvrez votre navigateur et allez sur : http://localhost:5000/api/health

Vous devriez voir :
```json
{"status":"OK","message":"GendBuntu API is running"}
```

### Étape 3 : Démarrer le frontend (dans un autre terminal)

```bash
cd client
npm start
```

---

## ⚠️ Si le backend ne démarre pas

### Vérification 1 : Le fichier .env existe-t-il ?

Créez le fichier `server/.env` avec ce contenu :

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gendbuntu
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe_postgres
JWT_SECRET=gendbuntu-secret-key-change-in-production-2024
JWT_EXPIRES_IN=7d
```

**Important** : Remplacez `votre_mot_de_passe_postgres` par votre vrai mot de passe PostgreSQL.

### Vérification 2 : PostgreSQL est-il démarré ?

**Windows** :
1. Appuyez sur `Win + R`
2. Tapez `services.msc`
3. Cherchez "postgresql"
4. Vérifiez que c'est "En cours d'exécution"

**macOS** :
```bash
brew services start postgresql
```

**Linux** :
```bash
sudo systemctl start postgresql
```

### Vérification 3 : La base de données existe-t-elle ?

Dans pgAdmin ou psql :

```sql
CREATE DATABASE gendbuntu;
```

Puis exécutez les scripts SQL :
```bash
psql -U postgres -d gendbuntu -f database/schema.sql
psql -U postgres -d gendbuntu -f database/seed.sql
```

### Vérification 4 : Les dépendances sont-elles installées ?

```bash
cd server
npm install
```

---

## 🚀 Démarrage correct (2 terminaux)

### Terminal 1 - Backend
```bash
cd server
npm run dev
```

### Terminal 2 - Frontend
```bash
cd client
npm start
```

Ou utilisez la commande globale (dans la racine du projet) :
```bash
npm run dev
```

Cette commande démarre les deux en même temps.

---

## 📝 Messages d'erreur courants

### "Cannot find module"
```bash
cd server
npm install
```

### "Port 5000 already in use"
Changez le port dans `server/.env` :
```env
PORT=5001
```

Et dans `client/package.json` :
```json
"proxy": "http://localhost:5001"
```

### "PostgreSQL connection refused"
1. Vérifiez que PostgreSQL est démarré
2. Vérifiez le mot de passe dans `server/.env`
3. Vérifiez que la base `gendbuntu` existe

---

## ✅ Vérification finale

1. Backend démarré sur http://localhost:5000 ✅
2. Test API : http://localhost:5000/api/health retourne OK ✅
3. Frontend démarré sur http://localhost:3000 ✅
4. Connexion fonctionne ✅

---

**Si le problème persiste, consultez `DEPANNAGE.md` pour plus de détails.**
