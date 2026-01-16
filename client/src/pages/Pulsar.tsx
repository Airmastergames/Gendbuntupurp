import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import './Pulsar.css';
import '../pages/SharedForms.css';

const Pulsar: React.FC = () => {
  const [services, setServices] = useState<any[]>([]);
  const [pvList, setPvList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'services' | 'pv'>('services');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showPvForm, setShowPvForm] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedPV, setSelectedPV] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);

  useEffect(() => {
    fetchServices();
    fetchPV();
    fetchUnits();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get('/api/pulsar/services');
      setServices(response.data);
    } catch (error) {
      toast.error('Erreur chargement services');
    }
  };

  const fetchPV = async () => {
    try {
      const response = await axios.get('/api/pulsar/pv');
      setPvList(response.data);
    } catch (error) {
      toast.error('Erreur chargement PV');
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

  const [serviceForm, setServiceForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    type: 'service',
    unit_id: null as number | null,
    assignments: [] as number[],
  });

  const [pvForm, setPvForm] = useState({
    type_pv: 'pv',
    description: '',
    status: 'draft',
  });

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/pulsar/services', serviceForm);
      toast.success('Service créé avec succès');
      setShowServiceForm(false);
      setServiceForm({ title: '', description: '', start_date: '', end_date: '', type: 'service', unit_id: null, assignments: [] });
      fetchServices();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur création service');
    }
  };

  const handleCreatePV = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/pulsar/pv', pvForm);
      toast.success('PV créé avec succès');
      setShowPvForm(false);
      setPvForm({ type_pv: 'pv', description: '', status: 'draft' });
      fetchPV();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur création PV');
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return;
    try {
      await axios.delete(`/api/pulsar/services/${id}`);
      toast.success('Service supprimé');
      fetchServices();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur suppression');
    }
  };

  const handleDeletePV = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce PV ?')) return;
    try {
      await axios.delete(`/api/pulsar/pv/${id}`);
      toast.success('PV supprimé');
      fetchPV();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur suppression');
    }
  };

  const handleViewService = async (id: number) => {
    try {
      const response = await axios.get(`/api/pulsar/services/${id}`);
      setSelectedService(response.data);
    } catch (error) {
      toast.error('Erreur chargement service');
    }
  };

  const handleViewPV = async (id: number) => {
    try {
      const response = await axios.get(`/api/pulsar/pv/${id}`);
      setSelectedPV(response.data);
    } catch (error) {
      toast.error('Erreur chargement PV');
    }
  };

  return (
    <div className="pulsar">
      <div className="page-header">
        <h1>Pulsar - Gestion des emplois du temps</h1>
        <div className="header-actions">
          {activeTab === 'services' && (
            <button className="btn-primary" onClick={() => {
              setServiceForm({ title: '', description: '', start_date: '', end_date: '', type: 'service', unit_id: null, assignments: [] });
              setShowServiceForm(true);
            }}>
              + Nouveau service
            </button>
          )}
          {activeTab === 'pv' && (
            <button className="btn-primary" onClick={() => {
              setPvForm({ type_pv: 'pv', description: '', status: 'draft' });
              setShowPvForm(true);
            }}>
              + Nouveau PV
            </button>
          )}
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          Services / Planning
        </button>
        <button
          className={`tab ${activeTab === 'pv' ? 'active' : ''}`}
          onClick={() => setActiveTab('pv')}
        >
          Registre PV
        </button>
      </div>

      {activeTab === 'services' && (
        <div className="services-list">
          {services.length === 0 ? (
            <div className="empty-state">Aucun service planifié</div>
          ) : (
            services.map((service) => (
              <div key={service.id} className="service-card">
                <div className="service-header">
                  <h3>{service.title}</h3>
                  <span className="service-type">{service.type}</span>
                </div>
                <p className="service-description">{service.description || 'Aucune description'}</p>
                <div className="service-dates">
                  <span>Du {new Date(service.start_date).toLocaleString('fr-FR')}</span>
                  <span>Au {new Date(service.end_date).toLocaleString('fr-FR')}</span>
                </div>
                {service.unit_name && (
                  <div className="service-unit">Unité: {service.unit_name}</div>
                )}
                <div className="service-actions">
                  <button className="btn-small" onClick={() => handleViewService(service.id)}>Voir</button>
                  <button className="btn-small btn-danger" onClick={() => handleDeleteService(service.id)}>Supprimer</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'pv' && (
        <div className="pv-list">
          {pvList.length === 0 ? (
            <div className="empty-state">Aucun PV enregistré</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Numéro PV</th>
                  <th>Type</th>
                  <th>Date création</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pvList.map((pv) => (
                  <tr key={pv.id}>
                    <td>{pv.numero_pv}</td>
                    <td>{pv.type_pv}</td>
                    <td>{new Date(pv.date_creation).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <span className={`status-badge status-${pv.status}`}>
                        {pv.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-small" onClick={() => handleViewPV(pv.id)}>Voir</button>
                        <button className="btn-small btn-danger" onClick={() => handleDeletePV(pv.id)}>Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal isOpen={showServiceForm} onClose={() => setShowServiceForm(false)} title="Nouveau service">
        <form onSubmit={handleCreateService} className="form-modal">
          <div className="form-group">
            <label>Titre *</label>
            <input
              type="text"
              value={serviceForm.title}
              onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={serviceForm.description}
              onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
              rows={4}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date de début *</label>
              <input
                type="datetime-local"
                value={serviceForm.start_date}
                onChange={(e) => setServiceForm({ ...serviceForm, start_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Date de fin *</label>
              <input
                type="datetime-local"
                value={serviceForm.end_date}
                onChange={(e) => setServiceForm({ ...serviceForm, end_date: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Type *</label>
              <select
                value={serviceForm.type}
                onChange={(e) => setServiceForm({ ...serviceForm, type: e.target.value })}
                required
              >
                <option value="service">Service</option>
                <option value="patrouille">Patrouille</option>
                <option value="astreinte">Astreinte</option>
              </select>
            </div>
            <div className="form-group">
              <label>Unité</label>
              <select
                value={serviceForm.unit_id || ''}
                onChange={(e) => setServiceForm({ ...serviceForm, unit_id: e.target.value ? parseInt(e.target.value) : null })}
              >
                <option value="">Aucune unité</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowServiceForm(false)}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              Créer
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showPvForm} onClose={() => setShowPvForm(false)} title="Nouveau PV">
        <form onSubmit={handleCreatePV} className="form-modal">
          <div className="form-group">
            <label>Type de PV *</label>
            <select
              value={pvForm.type_pv}
              onChange={(e) => setPvForm({ ...pvForm, type_pv: e.target.value })}
              required
            >
              <option value="pv">PV</option>
              <option value="pve">PVE</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={pvForm.description}
              onChange={(e) => setPvForm({ ...pvForm, description: e.target.value })}
              rows={4}
            />
          </div>
          <div className="form-group">
            <label>Statut</label>
            <select
              value={pvForm.status}
              onChange={(e) => setPvForm({ ...pvForm, status: e.target.value })}
            >
              <option value="draft">Brouillon</option>
              <option value="validated">Validé</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowPvForm(false)}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              Créer
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!selectedService} onClose={() => setSelectedService(null)} title={`Service: ${selectedService?.title}`}>
        {selectedService && (
          <div className="detail-view">
            <div className="detail-section">
              <h3>Informations</h3>
              <p><strong>Type:</strong> {selectedService.type}</p>
              <p><strong>Description:</strong> {selectedService.description || 'Aucune'}</p>
              <p><strong>Début:</strong> {new Date(selectedService.start_date).toLocaleString('fr-FR')}</p>
              <p><strong>Fin:</strong> {new Date(selectedService.end_date).toLocaleString('fr-FR')}</p>
              {selectedService.unit_name && <p><strong>Unité:</strong> {selectedService.unit_name}</p>}
            </div>
            {selectedService.assignments && selectedService.assignments.length > 0 && (
              <div className="detail-section">
                <h3>Personnel affecté</h3>
                {selectedService.assignments.map((assignment: any) => (
                  <div key={assignment.id} className="assignment-item">
                    <p>{assignment.nom} {assignment.prenom} ({assignment.grade}) - {assignment.role_in_service || 'Équipier'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={!!selectedPV} onClose={() => setSelectedPV(null)} title={`PV: ${selectedPV?.numero_pv}`}>
        {selectedPV && (
          <div className="detail-view">
            <div className="detail-section">
              <h3>Informations</h3>
              <p><strong>Numéro:</strong> {selectedPV.numero_pv}</p>
              <p><strong>Type:</strong> {selectedPV.type_pv}</p>
              <p><strong>Statut:</strong> {selectedPV.status}</p>
              <p><strong>Date création:</strong> {new Date(selectedPV.date_creation).toLocaleString('fr-FR')}</p>
              <p><strong>Description:</strong> {selectedPV.description || 'Aucune'}</p>
              {selectedPV.creator_nom && (
                <p><strong>Créé par:</strong> {selectedPV.creator_nom} {selectedPV.creator_prenom}</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Pulsar;
