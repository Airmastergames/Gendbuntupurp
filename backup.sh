#!/bin/bash

# Script de sauvegarde pour GendBuntu
# Usage: ./backup.sh

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Créer le dossier de sauvegarde s'il n'existe pas
mkdir -p $BACKUP_DIR

echo "💾 Sauvegarde de la base de données..."

# Sauvegarder la base de données
docker-compose exec -T postgres pg_dump -U postgres gendbuntu > $BACKUP_FILE

# Compresser la sauvegarde
gzip $BACKUP_FILE

echo "✅ Sauvegarde créée: ${BACKUP_FILE}.gz"

# Garder uniquement les 7 dernières sauvegardes
cd $BACKUP_DIR
ls -t backup_*.sql.gz | tail -n +8 | xargs -r rm

echo "🧹 Anciennes sauvegardes supprimées (conservation des 7 dernières)"
