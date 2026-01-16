import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import './BDSP.css';
import '../pages/SharedForms.css';

const BDSP: React.FC = () => {
  const [interventions, setInterventions] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedIntervention, setSelectedIntervention] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [units, setUnits] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    adresse: '',
    priority: 3,
  });

  useEffect(() => {
    fetchInterventions();
    fetchUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const fetchInterventions = async () => {
    try {
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      
      const response = await axios.get('/api/bdsp', { params });
      setInterventions(response.data);
    } catch (error) {
      toast.error('Erreur chargement interventions');
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await axios.get('/api/admin/units');
      setUnits(response.data);
    } catch (error) {
      // Ignore
    }
  };

  const handleInterventionClick = async (id: number) => {
    try {
      const response = await axios.get(`/api/bdsp/${id}`);
      setSelectedIntervention(response.data);
    } catch (error) {
      toast.error('Erreur chargement intervention');
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'priority-critical';
      case 2: return 'priority-high';
      case 3: return 'priority-normal';
      case 4: return 'priority-low';
      default: return 'priority-normal';
    }
  };

  const handleCreateIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/bdsp', formData);
      toast.success('Intervention créée avec succès');
      setShowForm(false);
      setFormData({ type: '', description: '', adresse: '', priority: 3 });
      fetchInterventions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur création intervention');
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await axios.put(`/api/bdsp/${selectedIntervention.id}`, { status: newStatus });
      toast.success('Statut modifié avec succès');
      setShowStatusModal(false);
      handleInterventionClick(selectedIntervention.id);
      fetchInterventions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur modification statut');
    }
  };

  const handleAssignUnit = async (unitId: number) => {
    try {
      await axios.post(`/api/bdsp/${selectedIntervention.id}/assign-unit`, { unit_id: unitId });
      toast.success('Unité affectée avec succès');
      handleInterventionClick(selectedIntervention.id);
      fetchInterventions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur affectation unité');
    }
  };

  return (
    <div className="bdsp">
      <div className="page-header">
        <h1>BDSP - Gestion des interventions</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Nouvelle intervention</button>
      </div>

      <div className="filters">
        <button
          className={`filter-btn ${filterStatus === '' ? 'active' : ''}`}
          onClick={() => setFilterStatus('')}
        >
          Toutes
        </button>
        <button
          className={`filter-btn ${filterStatus === 'en_cours' ? 'active' : ''}`}
          onClick={() => setFilterStatus('en_cours')}
        >
          En cours
        </button>
        <button
          className={`filter-btn ${filterStatus === 'terminee' ? 'active' : ''}`}
          onClick={() => setFilterStatus('terminee')}
        >
          Terminées
        </button>
        <button
          className={`filter-btn ${filterStatus === 'critique' ? 'active' : ''}`}
          onClick={() => setFilterStatus('critique')}
        >
          Critiques
        </button>
      </div>

      <div className="interventions-layout">
        <div className="interventions-list">
          {interventions.length === 0 ? (
            <div className="empty-state">Aucune intervention</div>
          ) : (
            interventions.map((intervention) => (
              <div
                key={intervention.id}
                className={`intervention-card ${selectedIntervention?.id === intervention.id ? 'selected' : ''}`}
                onClick={() => handleInterventionClick(intervention.id)}
              >
                <div className="intervention-header">
                  <h3>{intervention.numero_intervention}</h3>
                  <span className={`priority-badge ${getPriorityColor(intervention.priority)}`}>
                    Priorité {intervention.priority}
                  </span>
                </div>
                <p className="intervention-type">{intervention.type}</p>
                <p className="intervention-description">{intervention.description.substring(0, 100)}...</p>
                <div className="intervention-meta">
                  <span className={`status-badge status-${intervention.status}`}>
                    {intervention.status}
                  </span>
                  <span>{new Date(intervention.date_creation).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedIntervention && (
          <div className="intervention-details">
            <div className="detail-header">
              <h2>{selectedIntervention.numero_intervention}</h2>
              <div className="detail-actions">
                <button className="btn-small" onClick={() => setShowStatusModal(true)}>Modifier statut</button>
              </div>
            </div>
            <div className="detail-section">
              <h3>Informations</h3>
              <p><strong>Type:</strong> {selectedIntervention.type}</p>
              <p><strong>Description:</strong> {selectedIntervention.description}</p>
              <p><strong>Statut:</strong> 
                <span className={`status-badge status-${selectedIntervention.status}`} style={{ marginLeft: '0.5rem' }}>
                  {selectedIntervention.status}
                </span>
              </p>
              <p><strong>Priorité:</strong> {selectedIntervention.priority}</p>
              {selectedIntervention.adresse && <p><strong>Adresse:</strong> {selectedIntervention.adresse}</p>}
              {selectedIntervention.unit_name && <p><strong>Unité affectée:</strong> {selectedIntervention.unit_name}</p>}
            </div>
            {selectedIntervention.assigned_units && selectedIntervention.assigned_units.length > 0 && (
              <div className="detail-section">
                <h3>Unités affectées</h3>
                {selectedIntervention.assigned_units.map((au: any) => (
                  <div key={au.id} className="assigned-unit">
                    <p>{au.unit_name} ({au.unit_code})</p>
                    <p className="assigned-date">Affectée le {new Date(au.assigned_at).toLocaleString('fr-FR')}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="detail-section">
              <h3>Affecter une unité</h3>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAssignUnit(parseInt(e.target.value));
                    e.target.value = '';
                  }
                }}
                className="unit-select"
              >
                <option value="">Sélectionner une unité...</option>
                {units.filter(u => !selectedIntervention.assigned_units?.some((au: any) => au.unit_id === u.id)).map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>
            {selectedIntervention.logs && selectedIntervention.logs.length > 0 && (
              <div className="detail-section">
                <h3>Journal des actions</h3>
                <div className="logs-container">
                  {selectedIntervention.logs.map((log: any) => (
                    <div key={log.id} className="log-entry">
                      <div className="log-header">
                        <strong>{log.action}</strong>
                        <span>{new Date(log.created_at).toLocaleString('fr-FR')}</span>
                      </div>
                      {log.nom && (
                        <p className="log-user">Par: {log.nom} {log.prenom}</p>
                      )}
                      {log.details && (
                        <pre className="log-details">{JSON.stringify(log.details, null, 2)}</pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nouvelle intervention">
        <form onSubmit={handleCreateIntervention} className="form-modal">
          <div className="form-group">
            <label>Type *</label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              placeholder="Ex: Accident, Vol, etc."
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
          <div className="form-group">
            <label>Adresse</label>
            <input
              type="text"
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Priorité</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            >
              <option value={1}>1 - Critique</option>
              <option value={2}>2 - Haute</option>
              <option value={3}>3 - Normale</option>
              <option value={4}>4 - Basse</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              Créer
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Modifier le statut">
        <div className="form-modal">
          <div className="form-group">
            <label>Nouveau statut *</label>
            <select
              onChange={(e) => {
                handleUpdateStatus(e.target.value);
              }}
              defaultValue={selectedIntervention?.status}
            >
              <option value="en_cours">En cours</option>
              <option value="terminee">Terminée</option>
              <option value="critique">Critique</option>
              <option value="annulee">Annulée</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowStatusModal(false)}>
              Annuler
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BDSP;
