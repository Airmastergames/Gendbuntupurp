-- ============================================
-- GendBuntu - Schéma de base de données
-- ============================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: roles
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: permissions
-- ============================================
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: role_permissions
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ============================================
-- TABLE: units
-- ============================================
CREATE TABLE IF NOT EXISTS units (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'brigade', 'compagnie', 'section', etc.
    parent_unit_id INTEGER REFERENCES units(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    rio VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    grade VARCHAR(50) NOT NULL,
    numero_service VARCHAR(50),
    unit_id INTEGER REFERENCES units(id),
    role_id INTEGER REFERENCES roles(id) DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: annuaire
-- ============================================
CREATE TABLE IF NOT EXISTS annuaire (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rio VARCHAR(20) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    grade VARCHAR(50) NOT NULL,
    numero_service VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    unit_id INTEGER REFERENCES units(id),
    telephone VARCHAR(20),
    fonction VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: services (Pulsar)
-- ============================================
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'patrouille', 'astreinte', 'service', etc.
    unit_id INTEGER REFERENCES units(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: service_assignments
-- ============================================
CREATE TABLE IF NOT EXISTS service_assignments (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_in_service VARCHAR(50), -- 'chef', 'equipier', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: pv_registre (Pulsar)
-- ============================================
CREATE TABLE IF NOT EXISTS pv_registre (
    id SERIAL PRIMARY KEY,
    numero_pv VARCHAR(50) UNIQUE NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    type_pv VARCHAR(50) NOT NULL, -- 'pv', 'pve', etc.
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'validated', 'archived'
    linked_lrpgn_id INTEGER, -- Lien avec LRPGN si applicable
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: lrpgn_pv
-- ============================================
CREATE TABLE IF NOT EXISTS lrpgn_pv (
    id SERIAL PRIMARY KEY,
    numero_pv VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'pv', 'pve'
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    contenu JSONB, -- Contenu structuré du PV
    document_path VARCHAR(500), -- Chemin vers le document généré
    linked_registre_id INTEGER REFERENCES pv_registre(id),
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: messages (Messagerie)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_draft BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: message_recipients
-- ============================================
CREATE TABLE IF NOT EXISTS message_recipients (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: message_attachments
-- ============================================
CREATE TABLE IF NOT EXISTS message_attachments (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: interventions (BDSP)
-- ============================================
CREATE TABLE IF NOT EXISTS interventions (
    id SERIAL PRIMARY KEY,
    numero_intervention VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    adresse TEXT,
    coordonnees JSONB, -- {lat, lng}
    status VARCHAR(50) DEFAULT 'en_cours', -- 'en_cours', 'terminee', 'critique', 'annulee'
    priority INTEGER DEFAULT 3, -- 1=critique, 2=haute, 3=normale, 4=basse
    created_by INTEGER REFERENCES users(id),
    assigned_unit_id INTEGER REFERENCES units(id),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_debut TIMESTAMP,
    date_fin TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: intervention_units
-- ============================================
CREATE TABLE IF NOT EXISTS intervention_units (
    id SERIAL PRIMARY KEY,
    intervention_id INTEGER REFERENCES interventions(id) ON DELETE CASCADE,
    unit_id INTEGER REFERENCES units(id),
    assigned_by INTEGER REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: intervention_logs
-- ============================================
CREATE TABLE IF NOT EXISTS intervention_logs (
    id SERIAL PRIMARY KEY,
    intervention_id INTEGER REFERENCES interventions(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(200) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: comptes_rendus
-- ============================================
CREATE TABLE IF NOT EXISTS comptes_rendus (
    id SERIAL PRIMARY KEY,
    numero_cr VARCHAR(50) UNIQUE NOT NULL,
    titre VARCHAR(500) NOT NULL,
    contenu TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    date_incident TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    pdf_path VARCHAR(500),
    discord_webhook_sent BOOLEAN DEFAULT false,
    discord_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: incidents_graves (EventGrave)
-- ============================================
CREATE TABLE IF NOT EXISTS incidents_graves (
    id SERIAL PRIMARY KEY,
    numero_incident VARCHAR(50) UNIQUE NOT NULL,
    titre VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    niveau_gravite VARCHAR(50) NOT NULL, -- 'critique', 'grave', 'moyen', 'leger'
    date_incident TIMESTAMP NOT NULL,
    lieu TEXT,
    created_by INTEGER REFERENCES users(id),
    intervention_id INTEGER REFERENCES interventions(id),
    compte_rendu_id INTEGER REFERENCES comptes_rendus(id),
    status VARCHAR(50) DEFAULT 'en_cours', -- 'en_cours', 'resolu', 'archive'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: incident_militaires
-- ============================================
CREATE TABLE IF NOT EXISTS incident_militaires (
    id SERIAL PRIMARY KEY,
    incident_id INTEGER REFERENCES incidents_graves(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    etat VARCHAR(50) NOT NULL, -- 'blesse', 'decede', 'sain', etc.
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: incident_chronologie
-- ============================================
CREATE TABLE IF NOT EXISTS incident_chronologie (
    id SERIAL PRIMARY KEY,
    incident_id INTEGER REFERENCES incidents_graves(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    evenement TEXT NOT NULL,
    date_evenement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: nat_inf (Notes d'Information)
-- ============================================
CREATE TABLE IF NOT EXISTS nat_inf (
    id SERIAL PRIMARY KEY,
    numero_nat_inf VARCHAR(50) UNIQUE NOT NULL,
    titre VARCHAR(500) NOT NULL,
    contenu TEXT NOT NULL,
    date_publication TIMESTAMP NOT NULL,
    date_expiration TIMESTAMP,
    status VARCHAR(50) DEFAULT 'en_vigueur', -- 'en_vigueur', 'expiree', 'archivee'
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: system_logs
-- ============================================
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(200) NOT NULL,
    module VARCHAR(50),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES pour performance
-- ============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_rio ON users(rio);
CREATE INDEX idx_users_unit ON users(unit_id);
CREATE INDEX idx_annuaire_rio ON annuaire(rio);
CREATE INDEX idx_annuaire_unit ON annuaire(unit_id);
CREATE INDEX idx_services_dates ON services(start_date, end_date);
CREATE INDEX idx_pv_registre_numero ON pv_registre(numero_pv);
CREATE INDEX idx_interventions_status ON interventions(status);
CREATE INDEX idx_interventions_dates ON interventions(date_creation);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_message_recipients_recipient ON message_recipients(recipient_id);
CREATE INDEX idx_system_logs_user ON system_logs(user_id);
CREATE INDEX idx_system_logs_module ON system_logs(module);
CREATE INDEX idx_nat_inf_numero ON nat_inf(numero_nat_inf);
CREATE INDEX idx_nat_inf_status ON nat_inf(status);
CREATE INDEX idx_nat_inf_dates ON nat_inf(date_publication, date_expiration);

-- ============================================
-- TRIGGERS pour updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annuaire_updated_at BEFORE UPDATE ON annuaire
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pv_registre_updated_at BEFORE UPDATE ON pv_registre
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lrpgn_pv_updated_at BEFORE UPDATE ON lrpgn_pv
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interventions_updated_at BEFORE UPDATE ON interventions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comptes_rendus_updated_at BEFORE UPDATE ON comptes_rendus
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_graves_updated_at BEFORE UPDATE ON incidents_graves
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nat_inf_updated_at BEFORE UPDATE ON nat_inf
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
