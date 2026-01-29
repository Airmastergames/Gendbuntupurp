# Dockerfile pour le client React
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY tsconfig.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY public ./public
COPY src ./src

# Variables d'environnement pour le build
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Build de l'application React
RUN npm run build

# Image de production avec Nginx
FROM nginx:alpine

# Copier les fichiers buildés
COPY --from=builder /app/build /usr/share/nginx/html

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port 80
EXPOSE 80

# Commande de démarrage
CMD ["nginx", "-g", "daemon off;"]
