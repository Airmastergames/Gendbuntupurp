import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import './LRPGN.css';
import '../pages/SharedForms.css';

const LRPGN: React.FC = () => {
  const [pvList, setPvList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pv' | 'pve'>('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedPV, setSelectedPV] = useState<any>(null);
  const [registrePV, setRegistrePV] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    type: 'pv',
    contenu: {
      titre: '',
      description: '',
      date_incident: '',
      lieu: '',
    },
    linked_registre_id: null as number | null,
  });

  useEffect(() => {
    fetchPV();
    fetchRegistrePV();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchPV = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filter !== 'all') {
        params.type = filter;
      }
      const response = await axios.get('/api/lrpgn/pv', { params });
      setPvList(response.data);
    } catch (error) {
      toast.error('Erreur chargement PV/PVE');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrePV = async () => {
    try {
      const response = await axios.get('/api/pulsar/pv');
      setRegistrePV(response.data);
    } catch (error) {
      // Ignore
    }
  };

  const handleCreatePV = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/lrpgn/pv', formData);
      toast.success('PV/PVE créé avec succès');
      setShowForm(false);
      setFormData({
        type: 'pv',
        contenu: { titre: '', description: '', date_incident: '', lieu: '' },
        linked_registre_id: null,
      });
      fetchPV();
      fetchRegistrePV();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur création PV/PVE');
    }
  };

  const handleViewPV = async (id: number) => {
    try {
      const response = await axios.get(`/api/lrpgn/pv/${id}`);
      setSelectedPV(response.data);
    } catch (error) {
      toast.error('Erreur chargement PV/PVE');
    }
  };

  const handleEditPV = (pv: any) => {
    setSelectedPV(pv);
    const contenu = typeof pv.contenu === 'string' ? JSON.parse(pv.contenu) : pv.contenu;
    setFormData({
      type: pv.type,
      contenu: contenu || { titre: '', description: '', date_incident: '', lieu: '' },
      linked_registre_id: pv.linked_registre_id,
    });
    setShowForm(true);
  };

  const handleUpdatePV = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`/api/lrpgn/pv/${selectedPV.id}`, formData);
      toast.success('PV/PVE modifié avec succès');
      setShowForm(false);
      setSelectedPV(null);
      fetchPV();
      fetchRegistrePV();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur modification PV/PVE');
    }
  };

  const handleDeletePV = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce PV/PVE ?')) return;
    try {
      await axios.delete(`/api/lrpgn/pv/${id}`);
      toast.success('PV/PVE supprimé');
      fetchPV();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur suppression');
    }
  };

  const handleGeneratePDF = async (id: number) => {
    try {
      const response = await axios.post(`/api/lrpgn/pv/${id}/generate-document`, {}, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pv-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF généré et téléchargé');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur génération PDF');
    }
  };

  return (
    <div className="lrpgn">
      <div className="page-header">
        <h1>LRPGN - Outils OPJ</h1>
        <button className="btn-primary" onClick={() => {
          setSelectedPV(null);
          setFormData({
            type: 'pv',
            contenu: { titre: '', description: '', date_incident: '', lieu: '' },
            linked_registre_id: null,
          });
          setShowForm(true);
        }}>
          + Nouveau PV/PVE
        </button>
      </div>

      <div className="filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tous
        </button>
        <button
          className={`filter-btn ${filter === 'pv' ? 'active' : ''}`}
          onClick={() => setFilter('pv')}
        >
          PV
        </button>
        <button
          className={`filter-btn ${filter === 'pve' ? 'active' : ''}`}
          onClick={() => setFilter('pve')}
        >
          PVE
        </button>
      </div>

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : (
        <div className="pv-grid">
          {pvList.length === 0 ? (
            <div className="empty-state">Aucun PV/PVE</div>
          ) : (
            pvList.map((pv) => (
              <div key={pv.id} className="pv-card">
                <div className="pv-header">
                  <h3>{pv.numero_pv}</h3>
                  <span className={`pv-type type-${pv.type}`}>{pv.type.toUpperCase()}</span>
                </div>
                <div className="pv-info">
                  <p>Date: {new Date(pv.date_creation).toLocaleDateString('fr-FR')}</p>
                  <p>Créé par: {pv.creator_nom} {pv.creator_prenom}</p>
                  {pv.registre_numero && (
                    <p>Registre: {pv.registre_numero}</p>
                  )}
                </div>
                <div className="pv-actions">
                  <button className="btn-small" onClick={() => handleViewPV(pv.id)}>Voir</button>
                  <button className="btn-small" onClick={() => handleEditPV(pv)}>Modifier</button>
                  <button className="btn-small" onClick={() => handleGeneratePDF(pv.id)}>Générer PDF</button>
                  <button className="btn-small btn-danger" onClick={() => handleDeletePV(pv.id)}>Supprimer</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => {
        setShowForm(false);
        setSelectedPV(null);
      }} title={selectedPV ? 'Modifier PV/PVE' : 'Nouveau PV/PVE'}>
        <form onSubmit={selectedPV ? handleUpdatePV : handleCreatePV} className="form-modal">
          <div className="form-group">
            <label>Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'pv' | 'pve' })}
              required
            >
              <option value="pv">PV</option>
              <option value="pve">PVE</option>
            </select>
          </div>
          <div className="form-group">
            <label>Lier au registre PV</label>
            <select
              value={formData.linked_registre_id || ''}
              onChange={(e) => setFormData({ ...formData, linked_registre_id: e.target.value ? parseInt(e.target.value) : null })}
            >
              <option value="">Aucun lien</option>
              {registrePV.map((pv) => (
                <option key={pv.id} value={pv.id}>{pv.numero_pv} - {pv.type_pv}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Titre *</label>
            <input
              type="text"
              value={formData.contenu.titre}
              onChange={(e) => setFormData({
                ...formData,
                contenu: { ...formData.contenu, titre: e.target.value },
              })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={formData.contenu.description}
              onChange={(e) => setFormData({
                ...formData,
                contenu: { ...formData.contenu, description: e.target.value },
              })}
              rows={6}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date incident</label>
              <input
                type="datetime-local"
                value={formData.contenu.date_incident}
                onChange={(e) => setFormData({
                  ...formData,
                  contenu: { ...formData.contenu, date_incident: e.target.value },
                })}
              />
            </div>
            <div className="form-group">
              <label>Lieu</label>
              <input
                type="text"
                value={formData.contenu.lieu}
                onChange={(e) => setFormData({
                  ...formData,
                  contenu: { ...formData.contenu, lieu: e.target.value },
                })}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => {
              setShowForm(false);
              setSelectedPV(null);
            }}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              {selectedPV ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!selectedPV && !showForm} onClose={() => setSelectedPV(null)} title={`PV/PVE: ${selectedPV?.numero_pv}`}>
        {selectedPV && (
          <div className="detail-view">
            <div className="detail-section">
              <h3>Informations</h3>
              <p><strong>Numéro:</strong> {selectedPV.numero_pv}</p>
              <p><strong>Type:</strong> {selectedPV.type.toUpperCase()}</p>
              <p><strong>Statut:</strong> {selectedPV.status}</p>
              <p><strong>Date création:</strong> {new Date(selectedPV.date_creation).toLocaleString('fr-FR')}</p>
              {selectedPV.registre_numero && (
                <p><strong>Lien registre:</strong> {selectedPV.registre_numero}</p>
              )}
              {selectedPV.creator_nom && (
                <p><strong>Créé par:</strong> {selectedPV.creator_nom} {selectedPV.creator_prenom}</p>
              )}
            </div>
            {selectedPV.contenu && (
              <div className="detail-section">
                <h3>Contenu</h3>
                {typeof selectedPV.contenu === 'string' ? (
                  <pre>{selectedPV.contenu}</pre>
                ) : (
                  <>
                    {selectedPV.contenu.titre && <p><strong>Titre:</strong> {selectedPV.contenu.titre}</p>}
                    {selectedPV.contenu.description && <p><strong>Description:</strong> {selectedPV.contenu.description}</p>}
                    {selectedPV.contenu.date_incident && <p><strong>Date incident:</strong> {selectedPV.contenu.date_incident}</p>}
                    {selectedPV.contenu.lieu && <p><strong>Lieu:</strong> {selectedPV.contenu.lieu}</p>}
                  </>
                )}
              </div>
            )}
            <div className="detail-actions">
              <button className="btn-primary" onClick={() => handleEditPV(selectedPV)}>Modifier</button>
              <button className="btn-primary" onClick={() => handleGeneratePDF(selectedPV.id)}>Générer PDF</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LRPGN;
