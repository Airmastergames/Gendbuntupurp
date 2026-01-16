import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import './Admin.css';
import '../pages/SharedForms.css';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'units' | 'logs' | 'stats'>('stats');
  const [users, setUsers] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    rio: '',
    email: '',
    password: '',
    nom: '',
    prenom: '',
    grade: '',
    numero_service: '',
    unit_id: null as number | null,
    role_id: 3,
  });
  const [unitForm, setUnitForm] = useState({
    code: '',
    name: '',
    type: 'brigade',
    parent_unit_id: null as number | null,
  });

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
      fetchRoles();
    }
    if (activeTab === 'units') fetchUnits();
    if (activeTab === 'logs') fetchLogs();
    if (activeTab === 'stats') fetchStats();
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Erreur chargement utilisateurs');
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await axios.get('/api/admin/units');
      setUnits(response.data);
    } catch (error) {
      toast.error('Erreur chargement unités');
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get('/api/admin/roles');
      setRoles(response.data);
    } catch (error) {
      // Ignore
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await axios.get('/api/admin/logs');
      setLogs(response.data);
    } catch (error) {
      toast.error('Erreur chargement logs');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Erreur chargement statistiques');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/users', userForm);
      toast.success('Utilisateur créé avec succès');
      setShowUserForm(false);
      setUserForm({
        rio: '',
        email: '',
        password: '',
        nom: '',
        prenom: '',
        grade: '',
        numero_service: '',
        unit_id: null,
        role_id: 3,
      });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur création utilisateur');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/users/${selectedUser.id}`, userForm);
      toast.success('Utilisateur modifié avec succès');
      setSelectedUser(null);
      setShowUserForm(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur modification utilisateur');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    try {
      await axios.delete(`/api/admin/users/${id}`);
      toast.success('Utilisateur supprimé');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur suppression');
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setUserForm({
      rio: user.rio,
      email: user.email,
      password: '',
      nom: user.nom,
      prenom: user.prenom,
      grade: user.grade,
      numero_service: user.numero_service || '',
      unit_id: user.unit_id,
      role_id: user.role_id,
    });
    setShowUserForm(true);
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/units', unitForm);
      toast.success('Unité créée avec succès');
      setShowUnitForm(false);
      setUnitForm({ code: '', name: '', type: 'brigade', parent_unit_id: null });
      fetchUnits();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur création unité');
    }
  };

  const handleUpdateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/units/${selectedUnit.id}`, unitForm);
      toast.success('Unité modifiée avec succès');
      setSelectedUnit(null);
      setShowUnitForm(false);
      fetchUnits();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur modification unité');
    }
  };

  const handleDeleteUnit = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette unité ?')) return;
    try {
      await axios.delete(`/api/admin/units/${id}`);
      toast.success('Unité supprimée');
      fetchUnits();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur suppression');
    }
  };

  const handleEditUnit = (unit: any) => {
    setSelectedUnit(unit);
    setUnitForm({
      code: unit.code,
      name: unit.name,
      type: unit.type,
      parent_unit_id: unit.parent_unit_id,
    });
    setShowUnitForm(true);
  };

  return (
    <div className="admin">
      <div className="page-header">
        <h1>Panneau d'administration</h1>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistiques
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Utilisateurs
        </button>
        <button
          className={`admin-tab ${activeTab === 'units' ? 'active' : ''}`}
          onClick={() => setActiveTab('units')}
        >
          Unités
        </button>
        <button
          className={`admin-tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Logs système
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'stats' && stats && (
          <div className="stats-admin">
            <h2>Statistiques système</h2>
            <div className="stats-grid-admin">
              <div className="stat-item">
                <div className="stat-value">{stats.users}</div>
                <div className="stat-label">Utilisateurs totaux</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.active_users}</div>
                <div className="stat-label">Utilisateurs actifs</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.units}</div>
                <div className="stat-label">Unités</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.interventions}</div>
                <div className="stat-label">Interventions</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.active_interventions}</div>
                <div className="stat-label">Interventions en cours</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.incidents_graves}</div>
                <div className="stat-label">Incidents graves</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-admin">
            <div className="section-header">
              <h2>Gestion des utilisateurs</h2>
              <button className="btn-primary" onClick={() => {
                setSelectedUser(null);
                setUserForm({
                  rio: '',
                  email: '',
                  password: '',
                  nom: '',
                  prenom: '',
                  grade: '',
                  numero_service: '',
                  unit_id: null,
                  role_id: 3,
                });
                setShowUserForm(true);
              }}>
                + Ajouter utilisateur
              </button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>RIO</th>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Grade</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.rio}</td>
                    <td>{user.nom}</td>
                    <td>{user.prenom}</td>
                    <td>{user.grade}</td>
                    <td>{user.email}</td>
                    <td>{user.role_name}</td>
                    <td>
                      <span className={user.is_active ? 'status-active' : 'status-inactive'}>
                        {user.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-small" onClick={() => handleEditUser(user)}>Modifier</button>
                        <button className="btn-small btn-danger" onClick={() => handleDeleteUser(user.id)}>Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'units' && (
          <div className="units-admin">
            <div className="section-header">
              <h2>Gestion des unités</h2>
              <button className="btn-primary" onClick={() => {
                setSelectedUnit(null);
                setUnitForm({ code: '', name: '', type: 'brigade', parent_unit_id: null });
                setShowUnitForm(true);
              }}>
                + Ajouter unité
              </button>
            </div>
            <div className="units-grid">
              {units.map((unit) => (
                <div key={unit.id} className="unit-card">
                  <div className="unit-header">
                    <h3>{unit.name}</h3>
                    <div className="unit-actions">
                      <button className="btn-small" onClick={() => handleEditUnit(unit)}>Modifier</button>
                      <button className="btn-small btn-danger" onClick={() => handleDeleteUnit(unit.id)}>Supprimer</button>
                    </div>
                  </div>
                  <p>Code: {unit.code}</p>
                  <p>Type: {unit.type}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="logs-admin">
            <h2>Logs système</h2>
            <div className="logs-list">
              {logs.length === 0 ? (
                <div className="empty-state">Aucun log</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="log-item">
                    <div className="log-header">
                      <span className="log-module">{log.module || 'Système'}</span>
                      <span className="log-date">{new Date(log.created_at).toLocaleString('fr-FR')}</span>
                    </div>
                    <div className="log-action">{log.action}</div>
                    {log.nom && (
                      <div className="log-user">Par: {log.nom} {log.prenom}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showUserForm} onClose={() => {
        setShowUserForm(false);
        setSelectedUser(null);
      }} title={selectedUser ? 'Modifier utilisateur' : 'Nouvel utilisateur'}>
        <form onSubmit={selectedUser ? handleUpdateUser : handleCreateUser} className="form-modal">
          <div className="form-row">
            <div className="form-group">
              <label>RIO *</label>
              <input
                type="text"
                value={userForm.rio}
                onChange={(e) => setUserForm({ ...userForm, rio: e.target.value })}
                required
                disabled={!!selectedUser}
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Nom *</label>
              <input
                type="text"
                value={userForm.nom}
                onChange={(e) => setUserForm({ ...userForm, nom: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Prénom *</label>
              <input
                type="text"
                value={userForm.prenom}
                onChange={(e) => setUserForm({ ...userForm, prenom: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Grade *</label>
              <input
                type="text"
                value={userForm.grade}
                onChange={(e) => setUserForm({ ...userForm, grade: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Numéro de service</label>
              <input
                type="text"
                value={userForm.numero_service}
                onChange={(e) => setUserForm({ ...userForm, numero_service: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Mot de passe {!selectedUser && '*'}</label>
              <input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                required={!selectedUser}
                placeholder={selectedUser ? 'Laisser vide pour ne pas changer' : ''}
              />
            </div>
            <div className="form-group">
              <label>Rôle *</label>
              <select
                value={userForm.role_id}
                onChange={(e) => setUserForm({ ...userForm, role_id: parseInt(e.target.value) })}
                required
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Unité</label>
            <select
              value={userForm.unit_id || ''}
              onChange={(e) => setUserForm({ ...userForm, unit_id: e.target.value ? parseInt(e.target.value) : null })}
            >
              <option value="">Aucune unité</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => {
              setShowUserForm(false);
              setSelectedUser(null);
            }}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              {selectedUser ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showUnitForm} onClose={() => {
        setShowUnitForm(false);
        setSelectedUnit(null);
      }} title={selectedUnit ? 'Modifier unité' : 'Nouvelle unité'}>
        <form onSubmit={selectedUnit ? handleUpdateUnit : handleCreateUnit} className="form-modal">
          <div className="form-group">
            <label>Code *</label>
            <input
              type="text"
              value={unitForm.code}
              onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value })}
              required
              disabled={!!selectedUnit}
            />
          </div>
          <div className="form-group">
            <label>Nom *</label>
            <input
              type="text"
              value={unitForm.name}
              onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Type *</label>
              <select
                value={unitForm.type}
                onChange={(e) => setUnitForm({ ...unitForm, type: e.target.value })}
                required
              >
                <option value="brigade">Brigade</option>
                <option value="compagnie">Compagnie</option>
                <option value="section">Section</option>
                <option value="psig">PSIG</option>
              </select>
            </div>
            <div className="form-group">
              <label>Unité parente</label>
              <select
                value={unitForm.parent_unit_id || ''}
                onChange={(e) => setUnitForm({ ...unitForm, parent_unit_id: e.target.value ? parseInt(e.target.value) : null })}
              >
                <option value="">Aucune</option>
                {units.filter(u => u.id !== selectedUnit?.id).map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => {
              setShowUnitForm(false);
              setSelectedUnit(null);
            }}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              {selectedUnit ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Admin;
