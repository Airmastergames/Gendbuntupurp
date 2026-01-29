# Dockerfile pour le serveur Node.js
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY tsconfig.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY src ./src

# Compiler TypeScript
RUN npm run build

# Image de production
FROM node:18-alpine

WORKDIR /app

# Installer wget pour le healthcheck
RUN apk add --no-cache wget

# Copier les fichiers nécessaires
COPY package*.json ./
COPY --from=builder /app/dist ./dist

# Installer uniquement les dépendances de production
RUN npm ci --only=production

# Créer les dossiers pour les uploads
RUN mkdir -p uploads/comptes-rendus uploads/messagerie

# Exposer le port
EXPOSE 5000

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=5000

# Commande de démarrage
CMD ["node", "dist/index.js"]
