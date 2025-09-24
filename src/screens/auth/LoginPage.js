// src/screens/auth/LoginPage.js
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icons from '../../components/common/Icons';
import { loginWithEmail, loginWithGoogle } from '../../services/authService';

const LoginPage = () => {
  const navigate = useNavigate();
  const { role } = useParams(); // 'patient' | 'therapist'

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (!email.trim() || !password.trim()) {
      setMessage({ type: 'error', text: 'Por favor, preencha todos os campos.' });
      return;
    }
    try {
      await loginWithEmail({ email, password, desiredRole: role });
      // redireciona via onAuthStateChanged no App.js
    } catch (error) {
      console.error('Erro no login por email:', error);
      setMessage({ type: 'error', text: 'Email ou senha inválidos.' });
    }
  };

  const handleGoogleSignIn = async () => {
    setMessage({ type: '', text: '' });
    try {
      await loginWithGoogle({ desiredRole: role });
      // redireciona via onAuthStateChanged no App.js
    } catch (error) {
      console.error('Erro no login com Google:', error);
      setMessage({ type: 'error', text: 'Erro ao fazer login com Google.' });
    }
  };

  const styles = {
    container: {
      backgroundImage:
        "url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2070&auto=format&fit=crop')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      fontFamily: '"Inter", sans-serif',
      padding: 16,
      boxSizing: 'border-box'
    },
    loginBox: {
      padding: '40px',
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(12px) saturate(150%)',
      borderRadius: '20px',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
      width: '100%',
      maxWidth: '460px',
      textAlign: 'center',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    topRow: {
      display: 'flex',
      gap: 8,
      justifyContent: 'flex-start',
      marginBottom: 12
    },
    backBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: '#F3F4F6',
      border: '1px solid #E5E7EB',
      color: '#374151',
      padding: '6px 12px',
      borderRadius: 8,
      cursor: 'pointer',
      fontWeight: 600
    },
    title: { marginBottom: '0.5rem', color: '#1F2937', fontSize: '32px', fontWeight: '700' },
    subtitle: { marginBottom: '2rem', color: '#6B7280', fontSize: '16px', fontWeight: '400' },
    form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
    inputGroup: { textAlign: 'left' },
    label: { display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '600' },
    input: {
      width: '100%',
      padding: '14px 16px',
      fontSize: '16px',
      border: '1px solid #D1D5DB',
      borderRadius: '12px',
      boxSizing: 'border-box',
      background: '#fff'
    },
    button: {
      padding: '15px 16px',
      border: 'none',
      borderRadius: '12px',
      backgroundColor: '#8B5CF6',
      color: 'white',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      width: '100%'
    },
    dividerRow: { display: 'flex', alignItems: 'center', gap: '1rem', margin: '16px 0', color: '#9CA3AF' },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
    googleBtn: {
      width: '100%', // mesma largura do botão "Entrar"
      padding: '14px 16px',
      borderRadius: '12px',
      backgroundColor: '#FFFFFF',
      color: '#374151',
      border: '1px solid #D1D5DB',
      boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      boxSizing: 'border-box',
      cursor: 'pointer'
    },
    message: {
      padding: '12px',
      marginTop: '1.2rem',
      borderRadius: '10px',
      textAlign: 'center',
      fontWeight: '500',
      fontSize: '14px'
    },
    loginLink: { cursor: 'pointer', color: '#6D28D9', marginTop: '1.5rem', fontWeight: 500 }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        {/* Botão voltar dentro da box, no topo (como antes) */}
        <div style={styles.topRow}>
          <button style={styles.backBtn} onClick={() => navigate('/select-role')}>
            ← Voltar para Seleção
          </button>
        </div>

        <Icons.AppIcon style={{ marginBottom: '1rem', color: '#6D28D9' }} />
        <h1 style={styles.title}>Viscelius</h1>
        <p style={styles.subtitle}>
          Acesse sua plataforma como {role === 'patient' ? 'Paciente' : 'Profissional'}
        </p>

        <form onSubmit={handleLogin} style={styles.form} noValidate>
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="seu.email@exemplo.com"
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" style={styles.button}>Entrar</button>
        </form>

        <div style={styles.dividerRow}>
          <div style={styles.dividerLine}></div>
          <span>ou</span>
          <div style={styles.dividerLine}></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          style={styles.googleBtn}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
        >
          <Icons.GoogleIcon />
          <span>Entrar com Google</span>
        </button>

        {message.text && (
          <div style={{ ...styles.message, color: message.type === 'error' ? '#DC2626' : '#065F46' }}>
            {message.text}
          </div>
        )}

        <p
          style={styles.loginLink}
          onClick={() =>
            role === 'patient' ? navigate('/register/patient') : navigate('/register-therapist/therapist')
          }
        >
          Não tem uma conta? Crie uma
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
