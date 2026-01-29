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
echo "  - Tester l'API: curl http://localhost:5000/api/health"
