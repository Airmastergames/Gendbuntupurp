# 🚀 Guide Complet de Déploiement sur VPS OVH avec Git

Ce guide vous explique étape par étape comment déployer GendBuntu sur un VPS Linux OVH en utilisant Git pour la gestion des mises à jour.

---

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Étape 1 : Configuration initiale du VPS](#étape-1--configuration-initiale-du-vps)
3. [Étape 2 : Installation des outils nécessaires](#étape-2--installation-des-outils-nécessaires)
4. [Étape 3 : Configuration Git](#étape-3--configuration-git)
5. [Étape 4 : Clonage du projet](#étape-4--clonage-du-projet)
6. [Étape 5 : Configuration de l'application](#étape-5--configuration-de-lapplication)
7. [Étape 6 : Premier déploiement](#étape-6--premier-déploiement)
8. [Étape 7 : Mise à jour via Git](#étape-7--mise-à-jour-via-git)
9. [Étape 8 : Configuration SSL (optionnel)](#étape-8--configuration-ssl-optionnel)
10. [Dépannage](#dépannage)

---

## Prérequis

- Un VPS Linux OVH (Ubuntu 20.04+ ou Debian 11+ recommandé)
- Accès SSH au serveur
- Un repository Git (GitHub, GitLab, Bitbucket, etc.)
- Un nom de domaine (optionnel mais recommandé pour SSL)

---

## Étape 1 : Configuration initiale du VPS

### 1.1 Connexion au serveur

Depuis votre machine locale, connectez-vous au VPS :

```bash
ssh root@votre_ip_ovh
# ou si vous avez créé un utilisateur
ssh utilisateur@votre_ip_ovh
```

### 1.2 Mise à jour du système

```bash
# Mettre à jour la liste des paquets
sudo apt update

# Mettre à jour le système
sudo apt upgrade -y

# Installer les outils de base
sudo apt install -y curl wget git nano ufw
```

### 1.3 Configuration du firewall (recommandé)

```bash
# Autoriser SSH
sudo ufw allow 22/tcp

# Autoriser HTTP
sudo ufw allow 80/tcp

# Autoriser HTTPS
sudo ufw allow 443/tcp

# Activer le firewall
sudo ufw enable

# Vérifier le statut
sudo ufw status
```

---

## Étape 2 : Installation des outils nécessaires

### 2.1 Installation de Docker

```bash
# Télécharger et exécuter le script d'installation Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Vérifier l'installation
docker --version

# Ajouter votre utilisateur au groupe docker (pour éviter d'utiliser sudo)
sudo usermod -aG docker $USER

# Redémarrer la session (ou se déconnecter/reconnecter)
# Si vous êtes root, vous pouvez ignorer cette étape
```

**Important** : Si vous avez ajouté votre utilisateur au groupe docker, déconnectez-vous et reconnectez-vous pour que les changements prennent effet.

### 2.2 Installation de Docker Compose

```bash
# Télécharger Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Rendre exécutable
sudo chmod +x /usr/local/bin/docker-compose

# Vérifier l'installation
docker-compose --version
```

### 2.3 Vérification de Git

```bash
# Vérifier si Git est installé
git --version

# Si ce n'est pas le cas, l'installer
sudo apt install -y git
```

---

## Étape 3 : Configuration Git

### 3.1 Configuration Git (si première utilisation)

```bash
# Configurer votre nom
git config --global user.name "Votre Nom"

# Configurer votre email
git config --global user.email "votre.email@example.com"

# Vérifier la configuration
git config --list
```

### 3.2 Configuration des clés SSH pour Git (recommandé)

Si votre repository Git utilise SSH :

```bash
# Générer une clé SSH (si vous n'en avez pas)
ssh-keygen -t ed25519 -C "votre.email@example.com"

# Afficher la clé publique
cat ~/.ssh/id_ed25519.pub
```

Copiez cette clé et ajoutez-la à votre compte GitHub/GitLab/Bitbucket dans les paramètres SSH Keys.

**Alternative** : Vous pouvez aussi utiliser HTTPS avec un token d'accès personnel.

---

## Étape 4 : Clonage du projet

### 4.1 Créer un dossier pour l'application

```bash
# Créer un dossier pour les applications
sudo mkdir -p /opt/apps
cd /opt/apps

# Ou utiliser votre dossier home
cd ~
mkdir apps
cd apps
```

### 4.2 Cloner le repository

**Avec HTTPS :**
```bash
git clone https://github.com/votre-username/gendbuntu.git
# ou
git clone https://gitlab.com/votre-username/gendbuntu.git
```

**Avec SSH :**
```bash
git clone git@github.com:votre-username/gendbuntu.git
# ou
git clone git@gitlab.com:votre-username/gendbuntu.git
```

### 4.3 Accéder au dossier du projet

```bash
cd gendbuntu/Gendbuntupurp
# ou selon la structure de votre repository
cd gendbuntu
```

---

## Étape 5 : Configuration de l'application

### 5.1 Créer le fichier .env

```bash
# Copier le fichier d'exemple
cp env.example .env

# Éditer le fichier .env
nano .env
```

### 5.2 Configurer les variables d'environnement

Modifiez le fichier `.env` avec vos valeurs :

```env
# Configuration de la base de données PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_NAME=gendbuntu
DB_USER=postgres
DB_PASSWORD=VOTRE_MOT_DE_PASSE_SECURISE_ICI

# Configuration JWT (Générez un secret fort !)
JWT_SECRET=VOTRE_SECRET_JWT_TRES_LONG_ET_SECURISE_ICI
JWT_EXPIRES_IN=24h

# Configuration de l'API
PORT=5000
NODE_ENV=production

# URL de l'API pour le client React
# Remplacez par votre IP ou domaine
REACT_APP_API_URL=http://votre_ip_ovh:5000
# ou avec domaine
# REACT_APP_API_URL=https://votre-domaine.com
```

**Génération d'un secret JWT sécurisé :**
```bash
# Générer un secret aléatoire
openssl rand -base64 32
```

**Sauvegarder et quitter nano :** `Ctrl+X`, puis `Y`, puis `Entrée`

### 5.3 Créer les dossiers nécessaires

```bash
# Créer les dossiers d'uploads
mkdir -p server/uploads/comptes-rendus
mkdir -p server/uploads/messagerie

# Donner les bonnes permissions
chmod -R 755 server/uploads
```

---

## Étape 6 : Premier déploiement

### 6.1 Rendre les scripts exécutables

```bash
chmod +x deploy.sh backup.sh
```

### 6.2 Lancer le déploiement

```bash
# Option 1 : Utiliser le script de déploiement
./deploy.sh

# Option 2 : Déploiement manuel
docker-compose build
docker-compose up -d
```

### 6.3 Vérifier le déploiement

```bash
# Voir l'état des conteneurs
docker-compose ps

# Voir les logs
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f server
docker-compose logs -f postgres
docker-compose logs -f client

# Tester l'API
curl http://localhost:5000/api/health
```

### 6.4 Vérifier l'initialisation de la base de données

```bash
# Vérifier que les tables existent
docker-compose exec postgres psql -U postgres -d gendbuntu -c "\dt"

# Vérifier les rôles
docker-compose exec postgres psql -U postgres -d gendbuntu -c "SELECT * FROM roles;"

# Vérifier l'utilisateur admin
docker-compose exec postgres psql -U postgres -d gendbuntu -c "SELECT email, nom, prenom FROM users WHERE email = 'admin@gendbuntu.local';"
```

### 6.5 Accéder à l'application

Ouvrez votre navigateur et allez sur :
- `http://votre_ip_ovh` (ou `http://votre-domaine.com` si configuré)

**Identifiants par défaut :**
- Email : `admin@gendbuntu.local`
- Mot de passe : `Admin123!`

⚠️ **Important** : Changez ce mot de passe après la première connexion !

---

## Étape 7 : Mise à jour via Git

### 7.1 Méthode manuelle (recommandée pour commencer)

```bash
# Se placer dans le dossier du projet
cd /opt/apps/gendbuntu/Gendbuntupurp
# ou
cd ~/apps/gendbuntu/Gendbuntupurp

# Récupérer les dernières modifications
git pull origin main
# ou
git pull origin master

# Arrêter les conteneurs
docker-compose down

# Reconstruire les images avec les nouvelles modifications
docker-compose build --no-cache

# Redémarrer les services
docker-compose up -d

# Vérifier que tout fonctionne
docker-compose ps
docker-compose logs -f
```

### 7.2 Créer un script de mise à jour automatique

Créez un fichier `update.sh` :

```bash
nano update.sh
```

Ajoutez ce contenu :

```bash
#!/bin/bash

# Script de mise à jour automatique via Git
# Usage: ./update.sh

set -e

echo "🔄 Mise à jour de GendBuntu..."
echo "================================"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Sauvegarder la base de données avant la mise à jour
echo -e "${YELLOW}💾 Sauvegarde de la base de données...${NC}"
if [ -f backup.sh ]; then
    ./backup.sh || echo -e "${RED}⚠️  Échec de la sauvegarde (non bloquant)${NC}"
fi

# Récupérer les dernières modifications
echo -e "${YELLOW}📥 Récupération des modifications depuis Git...${NC}"
git pull

# Arrêter les conteneurs
echo -e "${YELLOW}🛑 Arrêt des conteneurs...${NC}"
docker-compose down

# Reconstruire les images
echo -e "${YELLOW}🔨 Reconstruction des images Docker...${NC}"
docker-compose build --no-cache

# Redémarrer les services
echo -e "${YELLOW}🚀 Redémarrage des services...${NC}"
docker-compose up -d

# Attendre que les services démarrent
echo -e "${YELLOW}⏳ Attente du démarrage des services...${NC}"
sleep 10

# Vérifier l'état
echo -e "${YELLOW}📊 Vérification de l'état des services...${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}✅ Mise à jour terminée avec succès !${NC}"
echo ""
echo "📝 Commandes utiles:"
echo "  - Voir les logs: docker-compose logs -f"
echo "  - Voir l'état: docker-compose ps"
```

Rendre le script exécutable :

```bash
chmod +x update.sh
```

Utilisation :

```bash
./update.sh
```

### 7.3 Configuration d'un hook Git (avancé)

Pour automatiser les mises à jour lors d'un `git push`, créez un hook sur le serveur :

```bash
# Créer un dossier pour les hooks
mkdir -p /opt/apps/gendbuntu/.git/hooks

# Créer le hook post-receive
nano /opt/apps/gendbuntu/.git/hooks/post-receive
```

Ajoutez :

```bash
#!/bin/bash
cd /opt/apps/gendbuntu/Gendbuntupurp
./update.sh
```

Rendre exécutable :

```bash
chmod +x /opt/apps/gendbuntu/.git/hooks/post-receive
```

### 7.4 Workflow de développement recommandé

1. **Développement local** :
   ```bash
   # Faire vos modifications
   git add .
   git commit -m "Description des modifications"
   git push origin main
   ```

2. **Sur le serveur** :
   ```bash
   # Mettre à jour
   cd /opt/apps/gendbuntu/Gendbuntupurp
   ./update.sh
   ```

---

## Étape 8 : Configuration SSL (optionnel)

### 8.1 Installation de Nginx et Certbot

Si vous n'utilisez pas le conteneur client avec Nginx intégré :

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 8.2 Configuration Nginx

Créez un fichier de configuration :

```bash
sudo nano /etc/nginx/sites-available/gendbuntu
```

Ajoutez :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activer le site :

```bash
sudo ln -s /etc/nginx/sites-available/gendbuntu /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8.3 Obtenir un certificat SSL

```bash
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

Certbot configurera automatiquement Nginx pour utiliser HTTPS.

### 8.4 Renouvellement automatique

Certbot configure automatiquement le renouvellement. Vérifiez :

```bash
sudo certbot renew --dry-run
```

---

## Dépannage

### Les conteneurs ne démarrent pas

```bash
# Vérifier les logs
docker-compose logs

# Vérifier l'état
docker-compose ps

# Redémarrer
docker-compose restart
```

### Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL est démarré
docker-compose ps postgres

# Vérifier les logs PostgreSQL
docker-compose logs postgres

# Vérifier les variables d'environnement
docker-compose exec server env | grep DB_
```

### Les modifications Git ne s'appliquent pas

```bash
# Vérifier que vous êtes sur la bonne branche
git branch

# Vérifier les modifications
git status

# Forcer la mise à jour
git fetch origin
git reset --hard origin/main
```

### Problème de permissions

```bash
# Donner les permissions au dossier uploads
sudo chown -R $USER:$USER server/uploads
chmod -R 755 server/uploads
```

### Redémarrer complètement

```bash
# Arrêter et supprimer tous les conteneurs
docker-compose down

# Supprimer les volumes (⚠️ supprime les données !)
docker-compose down -v

# Reconstruire et redémarrer
docker-compose up -d --build
```

### Voir les logs en temps réel

```bash
# Tous les services
docker-compose logs -f

# Un service spécifique
docker-compose logs -f server
docker-compose logs -f postgres
docker-compose logs -f client
```

---

## Commandes utiles

### Gestion des conteneurs

```bash
# Voir l'état
docker-compose ps

# Arrêter
docker-compose stop

# Démarrer
docker-compose start

# Redémarrer
docker-compose restart

# Arrêter et supprimer
docker-compose down

# Reconstruire
docker-compose build

# Reconstruire sans cache
docker-compose build --no-cache
```

### Base de données

```bash
# Sauvegarder
./backup.sh

# Accéder à PostgreSQL
docker-compose exec postgres psql -U postgres -d gendbuntu

# Exporter la base de données
docker-compose exec postgres pg_dump -U postgres gendbuntu > backup.sql

# Importer une sauvegarde
docker-compose exec -T postgres psql -U postgres -d gendbuntu < backup.sql
```

### Mise à jour

```bash
# Mise à jour manuelle
git pull
docker-compose down
docker-compose up -d --build

# Mise à jour avec le script
./update.sh
```

---

## Sécurité

### 1. Changer les mots de passe par défaut

- Mot de passe PostgreSQL dans `.env`
- Secret JWT dans `.env`
- Mot de passe admin dans l'application

### 2. Configurer un firewall

```bash
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 3. Mises à jour régulières

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Mettre à jour Docker
sudo apt update
sudo apt install --only-upgrade docker-ce docker-ce-cli containerd.io

# Mettre à jour les images Docker
docker-compose pull
docker-compose up -d
```

### 4. Sauvegardes régulières

Configurez une tâche cron pour les sauvegardes automatiques :

```bash
# Éditer le crontab
crontab -e

# Ajouter une ligne pour sauvegarder tous les jours à 2h du matin
0 2 * * * cd /opt/apps/gendbuntu/Gendbuntupurp && ./backup.sh
```

---

## Support

En cas de problème :

1. Vérifiez les logs : `docker-compose logs -f`
2. Vérifiez l'état : `docker-compose ps`
3. Consultez la documentation : `DEPLOY.md`, `DATABASE.md`
4. Vérifiez les variables d'environnement dans `.env`

---

## Résumé des étapes rapides

```bash
# 1. Connexion au VPS
ssh root@votre_ip_ovh

# 2. Installation Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Cloner le projet
cd /opt/apps
git clone https://github.com/votre-username/gendbuntu.git
cd gendbuntu/Gendbuntupurp

# 4. Configuration
cp env.example .env
nano .env  # Modifier les valeurs

# 5. Déploiement
chmod +x deploy.sh update.sh backup.sh
./deploy.sh

# 6. Mise à jour (plus tard)
./update.sh
```

---

**Félicitations ! Votre application GendBuntu est maintenant déployée sur votre VPS OVH ! 🎉**
