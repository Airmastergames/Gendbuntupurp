-- ============================================
-- GendBuntu - Données initiales (Seed)
-- ============================================

-- Rôles par défaut
INSERT INTO roles (name, description) VALUES
('Administrateur', 'Accès complet au système'),
('OPJ', 'Officier de Police Judiciaire'),
('Gendarme', 'Utilisateur standard'),
('CORG', 'Centre Opérationnel et de Renseignement de la Gendarmerie'),
('Chef d''unité', 'Responsable d''unité')
ON CONFLICT (name) DO NOTHING;

-- Permissions par module
INSERT INTO permissions (name, description, module) VALUES
-- Pulsar
('pulsar:read', 'Lire les services et plannings', 'pulsar'),
('pulsar:write', 'Créer/modifier les services', 'pulsar'),
('pulsar:delete', 'Supprimer les services', 'pulsar'),
('pv:read', 'Lire le registre PV', 'pulsar'),
('pv:write', 'Créer/modifier les PV', 'pulsar'),
-- LRPGN
('lrpgn:read', 'Lire les PV/PVE', 'lrpgn'),
('lrpgn:write', 'Créer/modifier les PV/PVE', 'lrpgn'),
('lrpgn:delete', 'Supprimer les PV/PVE', 'lrpgn'),
-- Messagerie
('messagerie:read', 'Lire les messages', 'messagerie'),
('messagerie:write', 'Envoyer des messages', 'messagerie'),
('messagerie:delete', 'Supprimer les messages', 'messagerie'),
-- Annuaire
('annuaire:read', 'Lire l''annuaire', 'annuaire'),
('annuaire:write', 'Modifier l''annuaire', 'annuaire'),
-- BDSP
('bdsp:read', 'Lire les interventions', 'bdsp'),
('bdsp:write', 'Créer/modifier les interventions', 'bdsp'),
('bdsp:assign', 'Affecter des unités', 'bdsp'),
-- Comptes rendus
('cr:read', 'Lire les comptes rendus', 'comptes_rendus'),
('cr:write', 'Créer/modifier les comptes rendus', 'comptes_rendus'),
-- EventGrave
('eventgrave:read', 'Lire les incidents graves', 'eventgrave'),
('eventgrave:write', 'Créer/modifier les incidents graves', 'eventgrave'),
-- Administration
('admin:users', 'Gérer les utilisateurs', 'admin'),
('admin:roles', 'Gérer les rôles', 'admin'),
('admin:units', 'Gérer les unités', 'admin'),
('admin:logs', 'Voir les logs système', 'admin')
ON CONFLICT (name) DO NOTHING;

-- Attribution des permissions aux rôles
-- Administrateur : toutes les permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions
ON CONFLICT DO NOTHING;

-- OPJ : permissions LRPGN + lecture générale
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE module IN ('lrpgn', 'pulsar', 'annuaire', 'messagerie', 'comptes_rendus')
ON CONFLICT DO NOTHING;

-- CORG : permissions BDSP + lecture générale
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE module IN ('bdsp', 'eventgrave', 'annuaire', 'messagerie', 'comptes_rendus')
ON CONFLICT DO NOTHING;

-- Chef d'unité : permissions étendues
INSERT INTO role_permissions (role_id, permission_id)
SELECT 5, id FROM permissions WHERE module IN ('pulsar', 'annuaire', 'messagerie', 'comptes_rendus', 'bdsp')
ON CONFLICT DO NOTHING;

-- Unités par défaut
INSERT INTO units (code, name, type) VALUES
('BRIG001', 'Brigade Territoriale 001', 'brigade'),
('COMP001', 'Compagnie 001', 'compagnie'),
('SECT001', 'Section 001', 'section'),
('PSIG001', 'Peloton de Surveillance et d''Intervention de la Gendarmerie 001', 'psig')
ON CONFLICT (code) DO NOTHING;

-- Utilisateur administrateur par défaut
-- Mot de passe: Admin123! (à changer en production)
-- Hash bcrypt pour "Admin123!" (généré avec bcrypt, rounds=10)
INSERT INTO users (rio, email, password_hash, nom, prenom, grade, numero_service, unit_id, role_id) VALUES
('ADMIN001', 'admin@gendbuntu.local', '$2a$10$2VjhfZ8Z7MllNnaB43dvbukQqZYxh.9G8J8J03P0eNJKFRaG0pJ9G', 'ADMIN', 'Système', 'Administrateur', 'ADMIN001', 1, 1)
ON CONFLICT (rio) DO NOTHING;
