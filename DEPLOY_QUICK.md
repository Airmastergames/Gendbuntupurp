# Déploiement Rapide sur VPS OVH

## Installation en 5 minutes

### 1. Connexion au serveur
```bash
ssh root@votre_ip_ovh
```

### 2. Installation de Docker (si nécessaire)
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 3. Installation de Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 4. Transférer le projet
Depuis votre machine locale:
```bash
scp -r Gendbuntupurp root@votre_ip_ovh:/root/
```

### 5. Sur le serveur
```bash
cd /root/Gendbuntupurp
cp env.example .env
nano .env  # Modifiez DB_PASSWORD et JWT_SECRET
chmod +x deploy.sh
./deploy.sh
```

### 6. Accéder à l'application
Ouvrez votre navigateur: `http://votre_ip_ovh`

## Commandes utiles

```bash
# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down

# Redémarrer
docker-compose restart

# Mise à jour
git pull  # si vous utilisez Git
docker-compose up -d --build
```

## Configuration SSL (optionnel)

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
sudo certbot --nginx -d votre-domaine.com
```
