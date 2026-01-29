# Configuration de la Base de Données

## Installation Automatique avec Docker

Lors du déploiement avec Docker Compose, la base de données PostgreSQL est **automatiquement installée et initialisée** :

1. **Création de la base de données** : PostgreSQL crée automatiquement la base `gendbuntu` au démarrage
2. **Exécution du schéma** : Le fichier `database/schema.sql` est automatiquement exécuté pour créer toutes les tables
3. **Données initiales** : Le fichier `database/seed.sql` est automatiquement exécuté pour insérer les données de base (rôles, permissions, utilisateur admin)

### Comment ça fonctionne ?

Les fichiers SQL sont montés dans `/docker-entrypoint-initdb.d/` du conteneur PostgreSQL :

```yaml
volumes:
  - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro
  - ./database/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql:ro
```

PostgreSQL exécute automatiquement tous les fichiers `.sql` dans ce dossier **lors de la première initialisation** du volume de données.

## Vérification de l'Installation

### Vérifier que la base de données est créée

```bash
docker-compose exec postgres psql -U postgres -l | grep gendbuntu
```

### Vérifier que les tables existent

```bash
docker-compose exec postgres psql -U postgres -d gendbuntu -c "\dt"
```

Vous devriez voir toutes les tables :
- roles
- permissions
- users
- units
- annuaire
- pulsar_services
- etc.

### Vérifier les données initiales

```bash
# Vérifier les rôles
docker-compose exec postgres psql -U postgres -d gendbuntu -c "SELECT * FROM roles;"

# Vérifier l'utilisateur admin
docker-compose exec postgres psql -U postgres -d gendbuntu -c "SELECT email, nom, prenom, role_id FROM users WHERE email = 'admin@gendbuntu.local';"
```

## Connexion à la Base de Données

### Depuis le conteneur Docker

```bash
# Accéder au shell PostgreSQL
docker-compose exec postgres psql -U postgres -d gendbuntu

# Exécuter une requête
docker-compose exec postgres psql -U postgres -d gendbuntu -c "SELECT COUNT(*) FROM users;"
```

### Depuis l'extérieur du conteneur

Si vous avez PostgreSQL installé localement et que le port 5432 est exposé :

```bash
psql -h localhost -p 5432 -U postgres -d gendbuntu
```

**Mot de passe** : Celui défini dans le fichier `.env` (variable `DB_PASSWORD`)

## Réinitialisation de la Base de Données

### ⚠️ ATTENTION : Cela supprimera toutes les données !

Si vous devez réinitialiser complètement la base de données :

```bash
# Arrêter les services
docker-compose down

# Supprimer le volume de données
docker volume rm gendbuntupurp_postgres_data

# Redémarrer (les scripts SQL seront réexécutés automatiquement)
docker-compose up -d
```

## Exécution Manuelle des Scripts SQL

Si pour une raison quelconque les scripts ne sont pas exécutés automatiquement :

```bash
# Exécuter le schéma
docker-compose exec -T postgres psql -U postgres -d gendbuntu < database/schema.sql

# Exécuter les données initiales
docker-compose exec -T postgres psql -U postgres -d gendbuntu < database/seed.sql
```

## Sauvegarde et Restauration

### Créer une sauvegarde

```bash
# Utiliser le script de sauvegarde
./backup.sh

# Ou manuellement
docker-compose exec postgres pg_dump -U postgres gendbuntu > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurer une sauvegarde

```bash
# Restaurer depuis un fichier de sauvegarde
docker-compose exec -T postgres psql -U postgres -d gendbuntu < backup_20240101_120000.sql
```

## Structure de la Base de Données

### Tables Principales

- **users** : Utilisateurs du système
- **roles** : Rôles (Administrateur, OPJ, Gendarme, etc.)
- **permissions** : Permissions par module
- **units** : Unités de la gendarmerie
- **annuaire** : Annuaire des contacts
- **pulsar_services** : Services Pulsar
- **messagerie** : Messages
- **comptes_rendus** : Comptes-rendus
- **event_grave** : Événements graves
- **bdsp** : Données BDSP
- **lrpgn** : Données LRPGN

### Utilisateur Admin par Défaut

- **Email** : `admin@gendbuntu.local`
- **Mot de passe** : `Admin123!`
- **Rôle** : Administrateur

⚠️ **Important** : Changez ce mot de passe après la première connexion !

## Dépannage

### Erreur : "database does not exist"

```bash
# Vérifier que la base de données existe
docker-compose exec postgres psql -U postgres -l

# Si elle n'existe pas, la créer manuellement
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE gendbuntu;"
```

### Erreur : "connection refused"

```bash
# Vérifier que PostgreSQL est démarré
docker-compose ps postgres

# Vérifier les logs
docker-compose logs postgres

# Redémarrer PostgreSQL
docker-compose restart postgres
```

### Les scripts SQL ne sont pas exécutés

Les scripts ne sont exécutés que lors de la **première initialisation**. Si le volume existe déjà, ils ne seront pas réexécutés.

Pour forcer la réexécution :

```bash
docker-compose down -v
docker-compose up -d
```

⚠️ **Cela supprimera toutes les données !**
