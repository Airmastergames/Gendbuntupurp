import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Rediriger si déjà connecté
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Format email invalide';
    }
    
    if (!password) {
      newErrors.password = 'Mot de passe requis';
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await login(email.trim(), password);
      toast.success('Connexion réussie');
      navigate('/');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Erreur de connexion';
      toast.error(errorMessage);
      
      // Erreurs spécifiques
      if (errorMessage.includes('Email') || errorMessage.includes('email')) {
        setErrors({ email: errorMessage });
      } else if (errorMessage.includes('mot de passe') || errorMessage.includes('password')) {
        setErrors({ password: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>GendBuntu</h1>
          <p>Système de gestion Gendarmerie Nationale</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              className={errors.email ? 'error' : ''}
              required
              autoFocus
              disabled={loading}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              className={errors.password ? 'error' : ''}
              required
              disabled={loading}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <div className="login-footer">
          <p>Accès réservé au personnel autorisé</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
