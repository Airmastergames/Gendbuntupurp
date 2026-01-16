import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: '/', label: 'Tableau de bord', icon: '📊', external: false },
    { path: '/pulsar', label: 'Pulsar', icon: '📅', external: false },
    { path: '/lrpgn', label: 'LRPGN', icon: '📋', external: false },
    { path: '/messagerie', label: 'Messagerie', icon: '✉️', external: false },
    { path: '/annuaire', label: 'Annuaire', icon: '👥', external: false },
    { path: '/bdsp', label: 'BDSP', icon: '🚨', external: false },
    { path: '/comptes-rendus', label: 'Comptes rendus', icon: '📄', external: false },
    { path: '/eventgrave', label: 'EventGrave', icon: '⚠️', external: false },
    { path: 'https://www.stopinfractions.fr/', label: 'NAT-INF', icon: '📌', external: true },
    ...(user?.role_id === 1 ? [{ path: '/admin', label: 'Administration', icon: '⚙️', external: false }] : []),
  ];

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h1 className="logo">GendBuntu</h1>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            if (item.external) {
              return (
                <a
                  key={item.path}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-item"
                >
                  <span className="nav-icon">{item.icon}</span>
                  {sidebarOpen && <span className="nav-label">{item.label}</span>}
                </a>
              );
            }
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {sidebarOpen && <span className="nav-label">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="user-info">
              <div className="user-name">{user?.prenom} {user?.nom}</div>
              <div className="user-grade">{user?.grade}</div>
            </div>
          )}
          <button className="logout-btn" onClick={logout}>
            {sidebarOpen ? 'Déconnexion' : '🚪'}
          </button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
