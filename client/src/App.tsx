import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pulsar from './pages/Pulsar';
import LRPGN from './pages/LRPGN';
import Messagerie from './pages/Messagerie';
import Annuaire from './pages/Annuaire';
import BDSP from './pages/BDSP';
import ComptesRendus from './pages/ComptesRendus';
import EventGrave from './pages/EventGrave';
import Admin from './pages/Admin';
import Layout from './components/Layout';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-container">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/pulsar" element={<Pulsar />} />
                    <Route path="/lrpgn" element={<LRPGN />} />
                    <Route path="/messagerie" element={<Messagerie />} />
                    <Route path="/annuaire" element={<Annuaire />} />
                    <Route path="/bdsp" element={<BDSP />} />
                    <Route path="/comptes-rendus" element={<ComptesRendus />} />
                    <Route path="/eventgrave" element={<EventGrave />} />
                    <Route path="/admin" element={<Admin />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
