#!/bin/bash

# Script de déploiement pour VPS Linux OVH
# Usage: ./deploy.sh

set -e

echo "🚀 Déploiement de GendBuntu sur VPS OVH"
echo "========================================"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé${NC}"
    echo "Installation de Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker installé${NC}"
    echo -e "${YELLOW}⚠️  Vous devez vous déconnecter et reconnecter pour que les changements prennent effet${NC}"
    exit 1
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose n'est pas installé${NC}"
    echo "Installation de Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose installé${NC}"
fi

# Vérifier si le fichier .env existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Le fichier .env n'existe pas${NC}"
    echo "Création du fichier .env à partir de env.example..."
    cp env.example .env
    echo -e "${YELLOW}⚠️  Veuillez modifier le fichier .env avec vos configurations avant de continuer${NC}"
    echo "Éditez le fichier .env et relancez ce script."
    exit 1
fi

# Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
docker-compose down || true

# Construire les images
echo "🔨 Construction des images Docker..."
docker-compose build --no-cache

# Démarrer les services
echo "🚀 Démarrage des services..."
docker-compose up -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 10

# Vérifier l'état des services
echo "📊 État des services:"
docker-compose ps

# Afficher les logs
echo ""
echo -e "${GREEN}✅ Déploiement terminé!${NC}"
echo ""
echo "📝 Commandes utiles:"
echo "  - Voir les logs: docker-compose logs -f"
echo "  - Arrêter: docker-compose down"
echo "  - Redémarrer: docker-compose restart"
echo "  - Voir l'état: docker-compose ps"
echo ""
echo "🌐 L'application devrait être accessible sur http://$(hostname -I | awk '{print $1}')"
