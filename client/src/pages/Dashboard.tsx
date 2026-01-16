import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      toast.error('Erreur chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Tableau de bord</h1>
        {stats?.user && (
          <div className="user-info">
            <p className="welcome-message">
              Bienvenue, <strong>{stats.user.prenom} {stats.user.nom}</strong> - {stats.user.grade}
            </p>
            <div className="user-details">
              <p><strong>RIO:</strong> {stats.user.rio}</p>
              <p><strong>Rôle:</strong> {stats.user.role_name || 'N/A'}</p>
              {stats.user.unit_name && (
                <p><strong>Unité:</strong> {stats.user.unit_name} ({stats.user.unit_code})</p>
              )}
              {stats.user.last_login && (
                <p><strong>Dernière connexion:</strong> {new Date(stats.user.last_login).toLocaleString('fr-FR')}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.users || 0}</div>
            <div className="stat-label">Utilisateurs actifs</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.active_interventions || 0}</div>
            <div className="stat-label">Interventions en cours</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.incidents_graves || 0}</div>
            <div className="stat-label">Incidents graves</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✉️</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.unread_messages || 0}</div>
            <div className="stat-label">Messages non lus</div>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section-card">
          <h2>Accès rapide</h2>
          <div className="quick-links">
            <a href="/pulsar" className="quick-link">📅 Pulsar - Planning</a>
            <a href="/bdsp" className="quick-link">🚨 BDSP - Interventions</a>
            <a href="/messagerie" className="quick-link">✉️ Messagerie {stats?.unread_messages > 0 && `(${stats.unread_messages})`}</a>
            <a href="/annuaire" className="quick-link">👥 Annuaire</a>
            <a href="/lrpgn" className="quick-link">📋 LRPGN - Outils OPJ</a>
            <a href="/comptes-rendus" className="quick-link">📄 Comptes rendus</a>
            <a href="/eventgrave" className="quick-link">⚠️ EventGrave</a>
          </div>
        </div>

        {stats?.active_interventions > 0 && (
          <div className="section-card alert-card">
            <h2>⚠️ Alertes</h2>
            <p>{stats.active_interventions} intervention(s) en cours nécessitent votre attention.</p>
            <a href="/bdsp" className="btn-primary">Voir les interventions</a>
          </div>
        )}

        {stats?.unread_messages > 0 && (
          <div className="section-card alert-card">
            <h2>✉️ Messages</h2>
            <p>Vous avez {stats.unread_messages} message(s) non lu(s).</p>
            <a href="/messagerie" className="btn-primary">Voir les messages</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
