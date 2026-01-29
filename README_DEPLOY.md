# 📚 Documentation de Déploiement - Guide Rapide

## 📖 Guides disponibles

1. **[DEPLOY_COMPLET.md](DEPLOY_COMPLET.md)** - Guide complet avec Git et mise à jour automatique ⭐ **RECOMMANDÉ**
2. **[DEPLOY.md](DEPLOY.md)** - Guide de déploiement de base
3. **[DEPLOY_QUICK.md](DEPLOY_QUICK.md)** - Guide de déploiement rapide (5 minutes)
4. **[DATABASE.md](DATABASE.md)** - Documentation sur la base de données

## 🚀 Démarrage rapide

### Première installation

```bash
# 1. Connexion au VPS
ssh root@votre_ip_ovh

# 2. Installation Docker (automatique avec deploy.sh)
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Cloner le projet
cd /opt/apps
git clone https://github.com/votre-username/gendbuntu.git
cd gendbuntu/Gendbuntupurp

# 4. Configuration
cp env.example .env
nano .env  # Modifier DB_PASSWORD et JWT_SECRET

# 5. Déploiement
chmod +x deploy.sh update.sh backup.sh
./deploy.sh
```

### Mise à jour via Git

```bash
cd /opt/apps/gendbuntu/Gendbuntupurp
./update.sh
```

## 📝 Workflow recommandé

1. **Développement local** : Faire vos modifications et commiter
2. **Push vers Git** : `git push origin main`
3. **Sur le serveur** : `./update.sh` pour mettre à jour automatiquement

## 🔧 Scripts disponibles

- **`deploy.sh`** - Premier déploiement
- **`update.sh`** - Mise à jour via Git (reconstruit et redémarre)
- **`backup.sh`** - Sauvegarde de la base de données

## 📞 Support

Consultez [DEPLOY_COMPLET.md](DEPLOY_COMPLET.md) pour le guide détaillé avec toutes les options et le dépannage.
