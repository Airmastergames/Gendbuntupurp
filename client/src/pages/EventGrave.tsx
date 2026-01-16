import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import './EventGrave.css';
import '../pages/SharedForms.css';

const EventGrave: React.FC = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [filterGravite, setFilterGravite] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [comptesRendus, setComptesRendus] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    niveau_gravite: 'moyen',
    date_incident: '',
    lieu: '',
    intervention_id: null as number | null,
    compte_rendu_id: null as number | null,
  });
  const [newMilitaire, setNewMilitaire] = useState({
    user_id: '',
    etat: 'blesse_leger',
    description: '',
  });
  const [newChronologie, setNewChronologie] = useState({
    evenement: '',
    date_evenement: '',
  });

  useEffect(() => {
    fetchIncidents();
    fetchInterventions();
    fetchComptesRendus();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterGravite]);

  const fetchIncidents = async () => {
    try {
      const params: any = {};
      if (filterGravite) params.niveau_gravite = filterGravite;
      
      const response = await axios.get('/api/eventgrave', { params });
      setIncidents(response.data);
    } catch (error) {
      toast.error('Erreur chargement incidents');
    }
  };

  const fetchInterventions = async () => {
    try {
      const response = await axios.get('/api/bdsp');
      setInterventions(response.data);
    } catch (error) {
      // Ignore
    }
  };

  const fetchComptesRendus = async () => {
    try {
      const response = await axios.get('/api/comptes-rendus');
      setComptesRendus(response.data);
    } catch (error) {
      // Ignore
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      // Ignore
    }
  };

  const handleViewIncident = async (id: number) => {
    try {
      const response = await axios.get(`/api/eventgrave/${id}`);
      setSelectedIncident(response.data);
    } catch (error) {
      toast.error('Erreur chargement incident');
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/eventgrave', formData);
      toast.success('Incident créé avec succès');
      setShowForm(false);
      setFormData({
        titre: '',
        description: '',
        niveau_gravite: 'moyen',
        date_incident: '',
        lieu: '',
        intervention_id: null,
        compte_rendu_id: null,
      });
      fetchIncidents();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur création incident');
    }
  };

  const handleEditIncident = (incident: any) => {
    setSelectedIncident(incident);
    setFormData({
      titre: incident.titre,
      description: incident.description,
      niveau_gravite: incident.niveau_gravite,
      date_incident: incident.date_incident ? new Date(incident.date_incident).toISOString().slice(0, 16) : '',
      lieu: incident.lieu || '',
      intervention_id: incident.intervention_id,
      compte_rendu_id: incident.compte_rendu_id,
    });
    setShowForm(true);
  };

  const handleUpdateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`/api/eventgrave/${selectedIncident.id}`, formData);
      toast.success('Incident modifié avec succès');
      setShowForm(false);
      setSelectedIncident(null);
      fetchIncidents();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur modification incident');
    }
  };

  const handleDeleteIncident = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet incident ?')) return;
    try {
      await axios.delete(`/api/eventgrave/${id}`);
      toast.success('Incident supprimé');
      fetchIncidents();
      if (selectedIncident?.id === id) {
        setSelectedIncident(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur suppression');
    }
  };

  const handleAddMilitaire = async () => {
    if (!newMilitaire.user_id || !newMilitaire.etat) {
      toast.error('Sélectionnez un militaire et un état');
      return;
    }
    try {
      await axios.post(`/api/eventgrave/${selectedIncident.id}/militaires`, {
        user_id: parseInt(newMilitaire.user_id),
        etat: newMilitaire.etat,
        description: newMilitaire.description,
      });
      toast.success('Militaire ajouté');
      setNewMilitaire({ user_id: '', etat: 'blesse_leger', description: '' });
      handleViewIncident(selectedIncident.id);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur ajout militaire');
    }
  };

  const handleAddChronologie = async () => {
    if (!newChronologie.evenement) {
      toast.error('Saisissez un événement');
      return;
    }
    try {
      await axios.post(`/api/eventgrave/${selectedIncident.id}/chronologie`, {
        evenement: newChronologie.evenement,
        date_evenement: newChronologie.date_evenement || new Date().toISOString(),
      });
      toast.success('Événement ajouté à la chronologie');
      setNewChronologie({ evenement: '', date_evenement: '' });
      handleViewIncident(selectedIncident.id);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur ajout événement');
    }
  };

  const getGraviteColor = (gravite: string) => {
    switch (gravite) {
      case 'critique': return 'gravite-critique';
      case 'grave': return 'gravite-grave';
      case 'moyen': return 'gravite-moyen';
      case 'leger': return 'gravite-leger';
      default: return '';
    }
  };

  return (
    <div className="eventgrave">
      <div className="page-header">
        <h1>EventGrave - Gestion des incidents graves</h1>
        <button className="btn-primary" onClick={() => {
          setSelectedIncident(null);
          setFormData({
            titre: '',
            description: '',
            niveau_gravite: 'moyen',
            date_incident: '',
            lieu: '',
            intervention_id: null,
            compte_rendu_id: null,
          });
          setShowForm(true);
        }}>
          + Nouvel incident
        </button>
      </div>

      <div className="filters">
        <button
          className={`filter-btn ${filterGravite === '' ? 'active' : ''}`}
          onClick={() => setFilterGravite('')}
        >
          Tous
        </button>
        <button
          className={`filter-btn ${filterGravite === 'critique' ? 'active' : ''}`}
          onClick={() => setFilterGravite('critique')}
        >
          Critique
        </button>
        <button
          className={`filter-btn ${filterGravite === 'grave' ? 'active' : ''}`}
          onClick={() => setFilterGravite('grave')}
        >
          Grave
        </button>
        <button
          className={`filter-btn ${filterGravite === 'moyen' ? 'active' : ''}`}
          onClick={() => setFilterGravite('moyen')}
        >
          Moyen
        </button>
        <button
          className={`filter-btn ${filterGravite === 'leger' ? 'active' : ''}`}
          onClick={() => setFilterGravite('leger')}
        >
          Léger
        </button>
      </div>

      <div className="incidents-grid">
        {incidents.length === 0 ? (
          <div className="empty-state">Aucun incident grave</div>
        ) : (
          incidents.map((incident) => (
            <div key={incident.id} className={`incident-card ${getGraviteColor(incident.niveau_gravite)}`}>
              <div className="incident-header">
                <h3>{incident.numero_incident}</h3>
                <span className={`gravite-badge gravite-${incident.niveau_gravite}`}>
                  {incident.niveau_gravite}
                </span>
              </div>
              <h4 className="incident-title">{incident.titre}</h4>
              <p className="incident-description">{incident.description.substring(0, 150)}...</p>
              <div className="incident-meta">
                <p>Date: {new Date(incident.date_incident).toLocaleDateString('fr-FR')}</p>
                <p>Statut: {incident.status}</p>
              </div>
              <div className="incident-actions">
                <button className="btn-small" onClick={() => handleViewIncident(incident.id)}>Voir détails</button>
                <button className="btn-small" onClick={() => handleEditIncident(incident)}>Modifier</button>
                <button className="btn-small btn-danger" onClick={() => handleDeleteIncident(incident.id)}>Supprimer</button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => {
        setShowForm(false);
        setSelectedIncident(null);
      }} title={selectedIncident ? 'Modifier incident' : 'Nouvel incident grave'}>
        <form onSubmit={selectedIncident ? handleUpdateIncident : handleCreateIncident} className="form-modal">
          <div className="form-group">
            <label>Titre *</label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Niveau de gravité *</label>
              <select
                value={formData.niveau_gravite}
                onChange={(e) => setFormData({ ...formData, niveau_gravite: e.target.value })}
                required
              >
                <option value="leger">Léger</option>
                <option value="moyen">Moyen</option>
                <option value="grave">Grave</option>
                <option value="critique">Critique</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date de l'incident *</label>
              <input
                type="datetime-local"
                value={formData.date_incident}
                onChange={(e) => setFormData({ ...formData, date_incident: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Lieu</label>
            <input
              type="text"
              value={formData.lieu}
              onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Lier à une intervention</label>
              <select
                value={formData.intervention_id || ''}
                onChange={(e) => setFormData({ ...formData, intervention_id: e.target.value ? parseInt(e.target.value) : null })}
              >
                <option value="">Aucune</option>
                {interventions.map((intervention) => (
                  <option key={intervention.id} value={intervention.id}>{intervention.numero_intervention}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Lier à un compte-rendu</label>
              <select
                value={formData.compte_rendu_id || ''}
                onChange={(e) => setFormData({ ...formData, compte_rendu_id: e.target.value ? parseInt(e.target.value) : null })}
              >
                <option value="">Aucun</option>
                {comptesRendus.map((cr) => (
                  <option key={cr.id} value={cr.id}>{cr.numero_cr}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => {
              setShowForm(false);
              setSelectedIncident(null);
            }}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              {selectedIncident ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!selectedIncident && !showForm} onClose={() => setSelectedIncident(null)} title={`Incident: ${selectedIncident?.numero_incident}`}>
        {selectedIncident && (
          <div className="detail-view">
            <div className="detail-section">
              <h3>Informations</h3>
              <p><strong>Numéro:</strong> {selectedIncident.numero_incident}</p>
              <p><strong>Titre:</strong> {selectedIncident.titre}</p>
              <p><strong>Niveau de gravité:</strong> 
                <span className={`gravite-badge gravite-${selectedIncident.niveau_gravite}`} style={{ marginLeft: '0.5rem' }}>
                  {selectedIncident.niveau_gravite}
                </span>
              </p>
              <p><strong>Statut:</strong> {selectedIncident.status}</p>
              <p><strong>Date incident:</strong> {new Date(selectedIncident.date_incident).toLocaleString('fr-FR')}</p>
              {selectedIncident.lieu && <p><strong>Lieu:</strong> {selectedIncident.lieu}</p>}
              {selectedIncident.intervention_id && (
                <p><strong>Intervention liée:</strong> {selectedIncident.numero_intervention}</p>
              )}
              {selectedIncident.compte_rendu_id && (
                <p><strong>Compte-rendu lié:</strong> {selectedIncident.numero_cr}</p>
              )}
              {selectedIncident.creator_nom && (
                <p><strong>Créé par:</strong> {selectedIncident.creator_nom} {selectedIncident.creator_prenom}</p>
              )}
            </div>
            <div className="detail-section">
              <h3>Description</h3>
              <div className="incident-description-full">
                {selectedIncident.description.split('\n').map((line: string, i: number) => (
                  <p key={i}>{line || '\u00A0'}</p>
                ))}
              </div>
            </div>
            {selectedIncident.militaires && selectedIncident.militaires.length > 0 && (
              <div className="detail-section">
                <h3>Militaires impliqués</h3>
                {selectedIncident.militaires.map((mil: any) => (
                  <div key={mil.id} className="militaire-item">
                    <p><strong>{mil.nom} {mil.prenom}</strong> ({mil.grade}) - RIO: {mil.rio}</p>
                    <p>État: {mil.etat}</p>
                    {mil.description && <p>Description: {mil.description}</p>}
                  </div>
                ))}
              </div>
            )}
            <div className="detail-section">
              <h3>Ajouter un militaire</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Militaire *</label>
                  <select
                    value={newMilitaire.user_id}
                    onChange={(e) => setNewMilitaire({ ...newMilitaire, user_id: e.target.value })}
                  >
                    <option value="">Sélectionner...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.nom} {user.prenom} ({user.grade})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>État *</label>
                  <select
                    value={newMilitaire.etat}
                    onChange={(e) => setNewMilitaire({ ...newMilitaire, etat: e.target.value })}
                  >
                    <option value="blesse_leger">Blessé léger</option>
                    <option value="blesse_grave">Blessé grave</option>
                    <option value="decede">Décédé</option>
                    <option value="sain">Sain et sauf</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newMilitaire.description}
                  onChange={(e) => setNewMilitaire({ ...newMilitaire, description: e.target.value })}
                  rows={2}
                />
              </div>
              <button type="button" className="btn-small" onClick={handleAddMilitaire}>Ajouter</button>
            </div>
            {selectedIncident.chronologie && selectedIncident.chronologie.length > 0 && (
              <div className="detail-section">
                <h3>Chronologie des événements</h3>
                <div className="chronologie-list">
                  {selectedIncident.chronologie.map((event: any) => (
                    <div key={event.id} className="chronologie-item">
                      <div className="chronologie-date">{new Date(event.date_evenement).toLocaleString('fr-FR')}</div>
                      <div className="chronologie-event">{event.evenement}</div>
                      {event.nom && (
                        <div className="chronologie-user">Par: {event.nom} {event.prenom}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="detail-section">
              <h3>Ajouter un événement</h3>
              <div className="form-group">
                <label>Événement *</label>
                <textarea
                  value={newChronologie.evenement}
                  onChange={(e) => setNewChronologie({ ...newChronologie, evenement: e.target.value })}
                  rows={3}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="datetime-local"
                  value={newChronologie.date_evenement}
                  onChange={(e) => setNewChronologie({ ...newChronologie, date_evenement: e.target.value })}
                />
              </div>
              <button type="button" className="btn-small" onClick={handleAddChronologie}>Ajouter</button>
            </div>
            <div className="detail-actions">
              <button className="btn-primary" onClick={() => handleEditIncident(selectedIncident)}>Modifier</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EventGrave;
