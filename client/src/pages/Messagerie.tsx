import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import './Messagerie.css';
import '../pages/SharedForms.css';

const Messagerie: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'drafts'>('inbox');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCompose, setShowCompose] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [composeForm, setComposeForm] = useState({
    subject: '',
    body: '',
    recipients: [] as number[],
    is_draft: false,
  });

  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFolder]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setAllUsers(response.data.filter((u: any) => u.id !== user?.id));
    } catch (error) {
      // Ignore
    }
  };

  const fetchMessages = async () => {
    try {
      const endpoint = activeFolder === 'inbox' ? '/api/messagerie/inbox' : 
                      activeFolder === 'sent' ? '/api/messagerie/sent' : 
                      '/api/messagerie/drafts';
      const response = await axios.get(endpoint);
      setMessages(response.data);
    } catch (error) {
      toast.error('Erreur chargement messages');
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/api/messagerie/unread/count');
      setUnreadCount(response.data.count);
    } catch (error) {
      // Ignore
    }
  };

  const handleMessageClick = async (messageId: number) => {
    try {
      const response = await axios.get(`/api/messagerie/${messageId}`);
      setSelectedMessage(response.data);
      fetchUnreadCount();
    } catch (error) {
      toast.error('Erreur chargement message');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (composeForm.recipients.length === 0 && !composeForm.is_draft) {
      toast.error('Sélectionnez au moins un destinataire');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('subject', composeForm.subject);
      formData.append('body', composeForm.body);
      formData.append('recipients', JSON.stringify(composeForm.recipients));
      formData.append('is_draft', composeForm.is_draft.toString());

      await axios.post('/api/messagerie', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success(composeForm.is_draft ? 'Brouillon enregistré' : 'Message envoyé');
      setShowCompose(false);
      setComposeForm({ subject: '', body: '', recipients: [], is_draft: false });
      fetchMessages();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur envoi message');
    }
  };

  const handleArchive = async (messageId: number) => {
    try {
      await axios.post(`/api/messagerie/${messageId}/archive`);
      toast.success('Message archivé');
      fetchMessages();
      setSelectedMessage(null);
    } catch (error) {
      toast.error('Erreur archivage');
    }
  };

  const handleDelete = async (messageId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;
    try {
      await axios.delete(`/api/messagerie/${messageId}`);
      toast.success('Message supprimé');
      fetchMessages();
      setSelectedMessage(null);
    } catch (error) {
      toast.error('Erreur suppression');
    }
  };

  const handleReply = () => {
    if (!selectedMessage) return;
    setComposeForm({
      subject: `Re: ${selectedMessage.subject}`,
      body: `\n\n--- Message original ---\n${selectedMessage.body}`,
      recipients: [selectedMessage.sender_id],
      is_draft: false,
    });
    setShowCompose(true);
    setSelectedMessage(null);
  };

  const toggleRecipient = (userId: number) => {
    setComposeForm(prev => {
      const newRecipients = prev.recipients.includes(userId)
        ? prev.recipients.filter(id => id !== userId)
        : [...prev.recipients, userId];
      return { ...prev, recipients: newRecipients };
    });
  };

  return (
    <div className="messagerie">
      <div className="page-header">
        <h1>Messagerie interne</h1>
        <button className="btn-primary" onClick={() => {
          setComposeForm({ subject: '', body: '', recipients: [], is_draft: false });
          setShowCompose(true);
        }}>
          + Nouveau message
        </button>
      </div>

      <div className="messagerie-layout">
        <div className="messagerie-sidebar">
          <div className="folder-tabs">
            <button
              className={`folder-tab ${activeFolder === 'inbox' ? 'active' : ''}`}
              onClick={() => {
                setActiveFolder('inbox');
                setSelectedMessage(null);
              }}
            >
              📥 Boîte de réception {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button
              className={`folder-tab ${activeFolder === 'sent' ? 'active' : ''}`}
              onClick={() => {
                setActiveFolder('sent');
                setSelectedMessage(null);
              }}
            >
              📤 Envoyés
            </button>
            <button
              className={`folder-tab ${activeFolder === 'drafts' ? 'active' : ''}`}
              onClick={() => {
                setActiveFolder('drafts');
                setSelectedMessage(null);
              }}
            >
              📝 Brouillons
            </button>
          </div>

          <div className="messages-list">
            {messages.length === 0 ? (
              <div className="empty-messages">Aucun message</div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`message-item ${!message.is_read && activeFolder === 'inbox' ? 'unread' : ''} ${selectedMessage?.id === message.id ? 'selected' : ''}`}
                  onClick={() => handleMessageClick(message.id)}
                >
                  <div className="message-subject">{message.subject}</div>
                  <div className="message-meta">
                    {activeFolder === 'inbox' ? (
                      <span>{message.sender_nom} {message.sender_prenom}</span>
                    ) : (
                      <span>{message.recipient_count || 0} destinataire(s)</span>
                    )}
                    <span>{new Date(message.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="messagerie-content">
          {selectedMessage ? (
            <div className="message-view">
              <div className="message-header">
                <h2>{selectedMessage.subject}</h2>
                <div className="message-actions">
                  {activeFolder === 'inbox' && (
                    <button className="btn-small" onClick={handleReply}>Répondre</button>
                  )}
                  {activeFolder === 'inbox' && (
                    <button className="btn-small" onClick={() => handleArchive(selectedMessage.id)}>Archiver</button>
                  )}
                  <button className="btn-small btn-danger" onClick={() => handleDelete(selectedMessage.id)}>Supprimer</button>
                </div>
              </div>
              <div className="message-info">
                <p><strong>De:</strong> {selectedMessage.sender_nom} {selectedMessage.sender_prenom} ({selectedMessage.sender_grade})</p>
                <p><strong>Date:</strong> {new Date(selectedMessage.created_at).toLocaleString('fr-FR')}</p>
                {selectedMessage.recipients && selectedMessage.recipients.length > 0 && (
                  <p><strong>À:</strong> {selectedMessage.recipients.map((r: any) => `${r.nom} ${r.prenom}`).join(', ')}</p>
                )}
              </div>
              <div className="message-body">
                {selectedMessage.body.split('\n').map((line: string, i: number) => (
                  <p key={i}>{line || '\u00A0'}</p>
                ))}
              </div>
              {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                <div className="message-attachments">
                  <h3>Pièces jointes</h3>
                  {selectedMessage.attachments.map((att: any) => (
                    <a key={att.id} href={`/uploads/${att.file_path}`} className="attachment-link" target="_blank" rel="noopener noreferrer">
                      📎 {att.file_name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="no-message-selected">
              {messages.length === 0 ? 'Aucun message' : 'Sélectionnez un message pour le lire'}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showCompose} onClose={() => setShowCompose(false)} title="Nouveau message">
        <form onSubmit={handleSendMessage} className="form-modal">
          <div className="form-group">
            <label>Destinataires *</label>
            <div className="recipients-list">
              {allUsers.map((u) => (
                <label key={u.id} className="recipient-checkbox">
                  <input
                    type="checkbox"
                    checked={composeForm.recipients.includes(u.id)}
                    onChange={() => toggleRecipient(u.id)}
                  />
                  <span>{u.nom} {u.prenom} ({u.grade})</span>
                </label>
              ))}
            </div>
            {composeForm.recipients.length === 0 && !composeForm.is_draft && (
              <small className="error-message">Sélectionnez au moins un destinataire</small>
            )}
          </div>
          <div className="form-group">
            <label>Sujet *</label>
            <input
              type="text"
              value={composeForm.subject}
              onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Message *</label>
            <textarea
              value={composeForm.body}
              onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
              rows={10}
              required
            />
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setComposeForm({ ...composeForm, is_draft: true });
                handleSendMessage({ preventDefault: () => {} } as React.FormEvent);
              }}
            >
              Enregistrer brouillon
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowCompose(false)}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={composeForm.recipients.length === 0 && !composeForm.is_draft}>
              Envoyer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Messagerie;
