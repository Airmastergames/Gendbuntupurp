# Guide de déploiement sur VPS Linux OVH

Ce guide vous explique comment déployer GendBuntu sur un serveur VPS Linux OVH.

## Prérequis

- Un VPS Linux OVH (Ubuntu 20.04+ ou Debian 11+ recommandé)
- Accès SSH au serveur
- Un nom de domaine (optionnel mais recommandé)

## Étape 1: Connexion au serveur

```bash
ssh root@votre_ip_ovh
# ou
ssh utilisateur@votre_ip_ovh
```

## Étape 2: Mise à jour du système

```bash
sudo apt update
sudo apt upgrade -y
```

## Étape 3: Installation de Docker et Docker Compose

Le script `deploy.sh` installera automatiquement Docker et Docker Compose si nécessaire, mais vous pouvez aussi les installer manuellement:

```bash
# Installation de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Installation de Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Vérification
docker --version
docker-compose --version
```

**Important:** Si vous venez d'ajouter votre utilisateur au groupe docker, déconnectez-vous et reconnectez-vous pour que les changements prennent effet.

## Étape 4: Cloner ou transférer le projet

### Option A: Cloner depuis Git

```bash
git clone <url-du-repo> gendbuntu
cd gendbuntu/Gendbuntupurp
```

### Option B: Transférer les fichiers via SCP

Depuis votre machine locale:

```bash
scp -r Gendbuntupurp utilisateur@votre_ip_ovh:/home/utilisateur/
```

Puis sur le serveur:

```bash
cd ~/Gendbuntupurp
```

## Étape 5: Configuration des variables d'environnement

```bash
# Copier le fichier d'exemple
cp env.example .env

# Éditer le fichier .env
nano .env
```

**Variables importantes à configurer:**

```env
# Mot de passe de la base de données (changez-le!)
DB_PASSWORD=votre_mot_de_passe_securise

# Secret JWT (changez-le! Utilisez un générateur de mots de passe)
JWT_SECRET=votre_secret_jwt_tres_long_et_securise

# URL de l'API (remplacez par votre IP ou domaine)
REACT_APP_API_URL=http://votre_ip_ou_domaine:5000
```

## Étape 6: Déploiement

```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Lancer le déploiement
./deploy.sh
```

Le script va:
1. Vérifier l'installation de Docker et Docker Compose
2. Construire les images Docker
3. Démarrer tous les services (PostgreSQL, serveur Node.js, client React)
4. Afficher l'état des services

## Étape 7: Vérification

```bash
# Voir les logs
docker-compose logs -f

# Voir l'état des services
docker-compose ps

# Tester l'API
curl http://localhost:5000/api/health
```

## Configuration avec un nom de domaine (optionnel)

### Installation de Nginx (si vous n'utilisez pas le conteneur client)

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

### Configuration Nginx

Créez un fichier `/etc/nginx/sites-available/gendbuntu`:

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

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

Activez le site:

```bash
sudo ln -s /etc/nginx/sites-available/gendbuntu /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Configuration SSL avec Let's Encrypt

```bash
sudo certbot --nginx -d votre-domaine.com
```

## Commandes utiles

### Gestion des conteneurs

```bash
# Voir les logs en temps réel
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f postgres

# Arrêter les services
docker-compose down

# Redémarrer les services
docker-compose restart

# Redémarrer un service spécifique
docker-compose restart server

# Voir l'état des services
docker-compose ps

# Accéder au shell d'un conteneur
docker-compose exec server sh
docker-compose exec postgres psql -U postgres -d gendbuntu
```

### Sauvegarde de la base de données

```bash
# Créer une sauvegarde
docker-compose exec postgres pg_dump -U postgres gendbuntu > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurer une sauvegarde
docker-compose exec -T postgres psql -U postgres gendbuntu < backup_20240101_120000.sql
```

### Mise à jour de l'application

```bash
# Arrêter les services
docker-compose down

# Récupérer les dernières modifications (si Git)
git pull

# Reconstruire et redémarrer
docker-compose up -d --build
```

## Dépannage

### Le serveur ne démarre pas

```bash
# Vérifier les logs
docker-compose logs server

# Vérifier la connexion à la base de données
docker-compose exec server sh
# Dans le shell: ping postgres
```

### Le client ne se connecte pas à l'API

1. Vérifiez que `REACT_APP_API_URL` dans `.env` pointe vers la bonne URL
2. Vérifiez que le port 5000 est accessible
3. Vérifiez les logs: `docker-compose logs client`

### Problèmes de permissions

```bash
# Donner les permissions au dossier uploads
sudo chown -R $USER:$USER server/uploads
chmod -R 755 server/uploads
```

### Redémarrer complètement

```bash
# Arrêter et supprimer tous les conteneurs et volumes
docker-compose down -v

# Reconstruire et redémarrer
docker-compose up -d --build
```

## Sécurité

1. **Changez tous les mots de passe par défaut** dans le fichier `.env`
2. **Utilisez un secret JWT fort** (générateur de mots de passe recommandé)
3. **Configurez un firewall** (UFW):

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

4. **Mettez à jour régulièrement** le système et les images Docker:

```bash
sudo apt update && sudo apt upgrade -y
docker-compose pull
docker-compose up -d
```

## Support

En cas de problème, consultez les logs avec `docker-compose logs -f` et vérifiez:
- Les variables d'environnement dans `.env`
- La connectivité réseau entre les conteneurs
- Les permissions des fichiers et dossiers
