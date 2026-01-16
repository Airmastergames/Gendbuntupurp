import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import './ComptesRendus.css';
import '../pages/SharedForms.css';

const ComptesRendus: React.FC = () => {
  const [comptesRendus, setComptesRendus] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedCR, setSelectedCR] = useState<any>(null);
  const [formData, setFormData] = useState({
    titre: '',
    contenu: '',
    type: '',
    date_incident: '',
  });

  useEffect(() => {
    fetchComptesRendus();
  }, []);

  const fetchComptesRendus = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/comptes-rendus');
      setComptesRendus(response.data);
    } catch (error) {
      toast.error('Erreur chargement comptes rendus');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCR = async (id: number) => {
    try {
      const response = await axios.get(`/api/comptes-rendus/${id}`);
      setSelectedCR(response.data);
    } catch (error) {
      toast.error('Erreur chargement compte-rendu');
    }
  };

  const handleEditCR = (cr: any) => {
    setSelectedCR(cr);
    setFormData({
      titre: cr.titre,
      contenu: cr.contenu,
      type: cr.type,
      date_incident: cr.date_incident ? new Date(cr.date_incident).toISOString().slice(0, 16) : '',
    });
    setShowForm(true);
  };

  const handleUpdateCR = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`/api/comptes-rendus/${selectedCR.id}`, formData);
      toast.success('Compte-rendu modifié avec succès');
      setShowForm(false);
      setSelectedCR(null);
      setFormData({ titre: '', contenu: '', type: '', date_incident: '' });
      fetchComptesRendus();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur modification compte-rendu');
    }
  };

  const handleDeleteCR = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce compte-rendu ?')) return;
    try {
      await axios.delete(`/api/comptes-rendus/${id}`);
      toast.success('Compte-rendu supprimé');
      fetchComptesRendus();
      if (selectedCR?.id === id) {
        setSelectedCR(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur suppression');
    }
  };

  const downloadPDF = async (id: number) => {
    try {
      const response = await axios.get(`/api/comptes-rendus/${id}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `compte-rendu-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Erreur téléchargement PDF');
    }
  };

  const handleCreateCR = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/comptes-rendus', formData);
      toast.success('Compte-rendu créé avec succès');
      setShowForm(false);
      setFormData({ titre: '', contenu: '', type: '', date_incident: '' });
      fetchComptesRendus();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur création compte-rendu');
    }
  };

  return (
    <div className="comptes-rendus">
      <div className="page-header">
        <h1>Comptes rendus opérationnels</h1>
        <button className="btn-primary" onClick={() => {
          setSelectedCR(null);
          setFormData({ titre: '', contenu: '', type: '', date_incident: '' });
          setShowForm(true);
        }}>
          + Nouveau compte-rendu
        </button>
      </div>

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : (
        <div className="cr-list">
          {comptesRendus.length === 0 ? (
            <div className="empty-state">Aucun compte-rendu</div>
          ) : (
            comptesRendus.map((cr) => (
              <div key={cr.id} className="cr-card">
                <div className="cr-header">
                  <h3>{cr.numero_cr} - {cr.titre}</h3>
                  <div className="cr-badges">
                    <span className="cr-type">{cr.type}</span>
                    {cr.discord_webhook_sent && (
                      <span className="discord-sent">✓ Discord</span>
                    )}
                  </div>
                </div>
                <div className="cr-info">
                  <p>Date incident: {cr.date_incident ? new Date(cr.date_incident).toLocaleDateString('fr-FR') : 'N/A'}</p>
                  <p>Créé par: {cr.creator_nom} {cr.creator_prenom} ({cr.creator_grade})</p>
                  <p>Date création: {new Date(cr.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="cr-actions">
                  <button className="btn-small" onClick={() => handleViewCR(cr.id)}>Voir</button>
                  <button className="btn-small" onClick={() => handleEditCR(cr)}>Modifier</button>
                  <button className="btn-small" onClick={() => downloadPDF(cr.id)}>
                    Télécharger PDF
                  </button>
                  <button className="btn-small btn-danger" onClick={() => handleDeleteCR(cr.id)}>Supprimer</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => {
        setShowForm(false);
        setSelectedCR(null);
      }} title={selectedCR ? 'Modifier compte-rendu' : 'Nouveau compte-rendu'}>
        <form onSubmit={selectedCR ? handleUpdateCR : handleCreateCR} className="form-modal">
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
            <label>Type *</label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              placeholder="Ex: Intervention, Accident, etc."
              required
            />
          </div>
          <div className="form-group">
            <label>Date de l'incident</label>
            <input
              type="datetime-local"
              value={formData.date_incident}
              onChange={(e) => setFormData({ ...formData, date_incident: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Contenu *</label>
            <textarea
              value={formData.contenu}
              onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
              rows={10}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => {
              setShowForm(false);
              setSelectedCR(null);
            }}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              {selectedCR ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!selectedCR && !showForm} onClose={() => setSelectedCR(null)} title={`Compte-rendu: ${selectedCR?.numero_cr}`}>
        {selectedCR && (
          <div className="detail-view">
            <div className="detail-section">
              <h3>Informations</h3>
              <p><strong>Numéro:</strong> {selectedCR.numero_cr}</p>
              <p><strong>Titre:</strong> {selectedCR.titre}</p>
              <p><strong>Type:</strong> {selectedCR.type}</p>
              <p><strong>Date incident:</strong> {selectedCR.date_incident ? new Date(selectedCR.date_incident).toLocaleString('fr-FR') : 'N/A'}</p>
              <p><strong>Date création:</strong> {new Date(selectedCR.created_at).toLocaleString('fr-FR')}</p>
              {selectedCR.creator_nom && (
                <p><strong>Créé par:</strong> {selectedCR.creator_nom} {selectedCR.creator_prenom} ({selectedCR.creator_grade})</p>
              )}
              {selectedCR.discord_webhook_sent && (
                <p><strong>Statut Discord:</strong> ✓ Envoyé</p>
              )}
            </div>
            <div className="detail-section">
              <h3>Contenu</h3>
              <div className="cr-content">
                {selectedCR.contenu.split('\n').map((line: string, i: number) => (
                  <p key={i}>{line || '\u00A0'}</p>
                ))}
              </div>
            </div>
            <div className="detail-actions">
              <button className="btn-primary" onClick={() => handleEditCR(selectedCR)}>Modifier</button>
              <button className="btn-primary" onClick={() => downloadPDF(selectedCR.id)}>Télécharger PDF</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ComptesRendus;
