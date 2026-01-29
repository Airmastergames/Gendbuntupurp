#!/bin/bash

# Script d'initialisation de la base de données
# Ce script est exécuté automatiquement par PostgreSQL lors du premier démarrage
# grâce au montage dans /docker-entrypoint-initdb.d/

set -e

echo "🗄️  Initialisation de la base de données GendBuntu..."

# Attendre que PostgreSQL soit prêt
until pg_isready -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-gendbuntu}"; do
  echo "⏳ Attente de PostgreSQL..."
  sleep 1
done

echo "✅ PostgreSQL est prêt"

# Les scripts schema.sql et seed.sql sont automatiquement exécutés
# par PostgreSQL via /docker-entrypoint-initdb.d/

echo "✅ Base de données initialisée avec succès"
