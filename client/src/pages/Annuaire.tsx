import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import './Annuaire.css';
import '../pages/SharedForms.css';

const Annuaire: React.FC = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [grades, setGrades] = useState<string[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    rio: '',
    nom: '',
    prenom: '',
    grade: '',
    numero_service: '',
    email: '',
    unit_id: null as number | null,
    telephone: '',
    fonction: '',
  });

  useEffect(() => {
    fetchContacts();
    fetchGrades();
    fetchUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterGrade, filterUnit]);

  const fetchContacts = async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (filterGrade) params.grade = filterGrade;
      if (filterUnit) params.unit_id = filterUnit;
      
      const response = await axios.get('/api/annuaire', { params });
      setContacts(response.data);
    } catch (error) {
      toast.error('Erreur chargement annuaire');
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await axios.get('/api/annuaire/grades/list');
      setGrades(response.data);
    } catch (error) {
      // Ignore
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

  const [selectedContact, setSelectedContact] = useState<any>(null);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/annuaire', formData);
      toast.success('Contact ajouté avec succès');
      setShowForm(false);
      setFormData({
        rio: '',
        nom: '',
        prenom: '',
        grade: '',
        numero_service: '',
        email: '',
        unit_id: null,
        telephone: '',
        fonction: '',
      });
      fetchContacts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur ajout contact');
    }
  };

  const handleEditContact = (contact: any) => {
    setSelectedContact(contact);
    setFormData({
      rio: contact.rio,
      nom: contact.nom,
      prenom: contact.prenom,
      grade: contact.grade,
      numero_service: contact.numero_service,
      email: contact.email,
      unit_id: contact.unit_id,
      telephone: contact.telephone || '',
      fonction: contact.fonction || '',
    });
    setShowForm(true);
  };

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`/api/annuaire/${selectedContact.id}`, formData);
      toast.success('Contact modifié avec succès');
      setShowForm(false);
      setSelectedContact(null);
      setFormData({
        rio: '',
        nom: '',
        prenom: '',
        grade: '',
        numero_service: '',
        email: '',
        unit_id: null,
        telephone: '',
        fonction: '',
      });
      fetchContacts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur modification contact');
    }
  };

  const handleDeleteContact = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) return;
    try {
      await axios.delete(`/api/annuaire/${id}`);
      toast.success('Contact supprimé');
      fetchContacts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur suppression');
    }
  };

  return (
    <div className="annuaire">
      <div className="page-header">
        <h1>Annuaire interne</h1>
        <button className="btn-primary" onClick={() => {
          setSelectedContact(null);
          setFormData({
            rio: '',
            nom: '',
            prenom: '',
            grade: '',
            numero_service: '',
            email: '',
            unit_id: null,
            telephone: '',
            fonction: '',
          });
          setShowForm(true);
        }}>+ Ajouter un contact</button>
      </div>

      <div className="annuaire-filters">
        <input
          type="text"
          placeholder="Rechercher (nom, prénom, RIO, email)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
          className="filter-select"
        >
          <option value="">Tous les grades</option>
          {grades.map((grade) => (
            <option key={grade} value={grade}>{grade}</option>
          ))}
        </select>
        <select
          value={filterUnit}
          onChange={(e) => setFilterUnit(e.target.value)}
          className="filter-select"
        >
          <option value="">Toutes les unités</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>{unit.name}</option>
          ))}
        </select>
      </div>

      <div className="contacts-grid">
        {contacts.length === 0 ? (
          <div className="empty-state">Aucun contact trouvé</div>
        ) : (
          contacts.map((contact) => (
          <div key={contact.id} className="contact-card">
            <div className="contact-header">
              <h3>{contact.prenom} {contact.nom}</h3>
              <span className="contact-grade">{contact.grade}</span>
            </div>
            <div className="contact-info">
              <p><strong>RIO:</strong> {contact.rio}</p>
              <p><strong>N° Service:</strong> {contact.numero_service}</p>
              <p><strong>Email:</strong> {contact.email}</p>
              {contact.telephone && <p><strong>Téléphone:</strong> {contact.telephone}</p>}
              {contact.unit_name && <p><strong>Unité:</strong> {contact.unit_name}</p>}
              {contact.fonction && <p><strong>Fonction:</strong> {contact.fonction}</p>}
            </div>
            <div className="contact-actions">
              <button className="btn-small" onClick={() => {
                // Rediriger vers messagerie avec ce contact pré-sélectionné
                window.location.href = `/messagerie?to=${contact.user_id || contact.id}`;
              }}>Envoyer message</button>
              <button className="btn-small" onClick={() => handleEditContact(contact)}>Modifier</button>
              <button className="btn-small btn-danger" onClick={() => handleDeleteContact(contact.id)}>Supprimer</button>
            </div>
          </div>
          ))
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => {
        setShowForm(false);
        setSelectedContact(null);
        setFormData({
          rio: '',
          nom: '',
          prenom: '',
          grade: '',
          numero_service: '',
          email: '',
          unit_id: null,
          telephone: '',
          fonction: '',
        });
      }} title={selectedContact ? 'Modifier le contact' : 'Ajouter un contact'}>
        <form onSubmit={selectedContact ? handleUpdateContact : handleCreateContact} className="form-modal">
          <div className="form-row">
            <div className="form-group">
              <label>RIO *</label>
              <input
                type="text"
                value={formData.rio}
                onChange={(e) => setFormData({ ...formData, rio: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Numéro de service *</label>
              <input
                type="text"
                value={formData.numero_service}
                onChange={(e) => setFormData({ ...formData, numero_service: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Nom *</label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Prénom *</label>
              <input
                type="text"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Grade *</label>
              <input
                type="text"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Unité</label>
              <select
                value={formData.unit_id || ''}
                onChange={(e) => setFormData({ ...formData, unit_id: e.target.value ? parseInt(e.target.value) : null })}
              >
                <option value="">Sélectionner une unité</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Fonction</label>
            <input
              type="text"
              value={formData.fonction}
              onChange={(e) => setFormData({ ...formData, fonction: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => {
              setShowForm(false);
              setSelectedContact(null);
              setFormData({
                rio: '',
                nom: '',
                prenom: '',
                grade: '',
                numero_service: '',
                email: '',
                unit_id: null,
                telephone: '',
                fonction: '',
              });
            }}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              {selectedContact ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Annuaire;
