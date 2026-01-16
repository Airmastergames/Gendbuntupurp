# 🔧 Guide de dépannage - GendBuntu

## ❌ Erreur: Proxy error - ECONNREFUSED

**Symptôme** : Le frontend ne peut pas se connecter au backend sur le port 5000.

**Causes possibles** :
1. Le serveur backend n'est pas démarré
2. Le port 5000 est déjà utilisé
3. Le fichier `.env` est manquant ou mal configuré
4. Les dépendances ne sont pas installées

### ✅ Solution 1 : Vérifier que le backend démarre

1. Ouvrez un **nouveau terminal** dans le dossier `server/`
2. Exécutez :
```bash
npm run dev
```

Vous devriez voir :
```
🚀 Serveur GendBuntu démarré sur le port 5000
✅ Connexion à PostgreSQL réussie
```

Si vous voyez une erreur, notez le message et consultez les solutions ci-dessous.

### ✅ Solution 2 : Vérifier le fichier .env

Assurez-vous que le fichier `server/.env` existe et contient :

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

### ✅ Solution 3 : Vérifier que PostgreSQL est démarré

**Windows** :
1. Appuyez sur `Win + R`
2. Tapez `services.msc` et appuyez sur Entrée
3. Cherchez "postgresql" dans la liste
4. Vérifiez que le statut est "En cours d'exécution"
5. Si ce n'est pas le cas, cliquez droit > Démarrer

**macOS/Linux** :
```bash
# Vérifier si PostgreSQL tourne
pg_isready

# Si ce n'est pas le cas, démarrer
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### ✅ Solution 4 : Vérifier que la base de données existe

Dans pgAdmin ou psql :

```sql
-- Lister les bases de données
\l

-- Vérifier que "gendbuntu" existe
```

Si elle n'existe pas :
```sql
CREATE DATABASE gendbuntu;
```

### ✅ Solution 5 : Réinstaller les dépendances

Si le serveur ne démarre toujours pas :

```bash
# Dans le dossier server/
rm -rf node_modules
npm install

# Dans le dossier client/
cd ../client
rm -rf node_modules
npm install
```

### ✅ Solution 6 : Changer le port

Si le port 5000 est déjà utilisé :

1. Modifiez `server/.env` :
```env
PORT=5001
```

2. Modifiez `client/package.json` :
```json
"proxy": "http://localhost:5001"
```

3. Redémarrez les deux serveurs

---

## ❌ Erreur: Cannot find module

**Symptôme** : `Error: Cannot find module 'xxx'`

**Solution** :
```bash
# Dans le dossier où l'erreur se produit
npm install
```

---

## ❌ Erreur: PostgreSQL connection refused

**Symptôme** : `❌ Impossible de se connecter à PostgreSQL`

**Solutions** :

1. **Vérifier que PostgreSQL est démarré** (voir Solution 3 ci-dessus)

2. **Vérifier les credentials dans `server/.env`** :
   - `DB_HOST=localhost`
   - `DB_PORT=5432`
   - `DB_NAME=gendbuntu`
   - `DB_USER=postgres`
   - `DB_PASSWORD=votre_mot_de_passe` ← **Important !**

3. **Vérifier que la base de données existe** :
```sql
CREATE DATABASE gendbuntu;
```

4. **Tester la connexion manuellement** :
```bash
psql -U postgres -d gendbuntu
```

---

## ❌ Erreur: Port already in use

**Symptôme** : `EADDRINUSE` ou `Port 5000 is already in use`

**Solution** :

1. **Trouver le processus utilisant le port** :
```bash
# Windows PowerShell
netstat -ano | findstr :5000

# macOS/Linux
lsof -i :5000
```

2. **Arrêter le processus** ou changer le port (voir Solution 6 ci-dessus)

---

## ❌ Erreur: SyntaxError ou TypeScript errors

**Symptôme** : Erreurs de compilation TypeScript

**Solution** :
```bash
# Vérifier que ts-node est installé
cd server
npm install ts-node --save-dev

# Vérifier la configuration TypeScript
npx tsc --noEmit
```

---

## ❌ Le frontend démarre mais affiche une page blanche

**Solutions** :

1. Ouvrez la console du navigateur (F12)
2. Vérifiez les erreurs dans l'onglet "Console"
3. Vérifiez l'onglet "Network" pour voir si les requêtes API échouent
4. Vérifiez que le backend est bien démarré

---

## ✅ Vérification complète

Pour vérifier que tout fonctionne :

1. **Backend** :
```bash
cd server
npm run dev
# Devrait afficher: 🚀 Serveur GendBuntu démarré sur le port 5000
```

2. **Test de l'API** :
Ouvrez http://localhost:5000/api/health dans votre navigateur.
Vous devriez voir : `{"status":"OK","message":"GendBuntu API is running"}`

3. **Frontend** :
```bash
cd client
npm start
# Devrait ouvrir http://localhost:3000
```

---

## 📞 Besoin d'aide supplémentaire ?

1. Vérifiez les logs dans les terminaux (backend et frontend)
2. Vérifiez la console du navigateur (F12)
3. Consultez `INSTALLATION.md` pour une installation complète
4. Vérifiez que toutes les étapes de `INSTALLATION.md` ont été suivies

---

**Bon courage ! 🎖️**
