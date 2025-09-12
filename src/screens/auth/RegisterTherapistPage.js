// src/screens/auth/RegisterTherapistPage.js
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icons from '../../components/common/Icons';
import { registerTherapist } from '../../services/authService';

const RegisterTherapistPage = () => {
  const navigate = useNavigate();
  const { role } = useParams(); // esperado: 'therapist'

  const [name, setName] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!name.trim() || !professionalId.trim() || !specialties.trim() || !email.trim() || !password.trim()) {
      setMessage({ type: 'error', text: 'Por favor, preencha todos os campos obrigatórios.' });
      return;
    }

    try {
      await registerTherapist({
        name,
        email,
        password,
        professionalId,
        specialties,
        phone,
        role: role || 'therapist',
      });
      setMessage({ type: 'success', text: 'Conta criada com sucesso! Redirecionando…' });
      setTimeout(() => navigate(`/login/${role || 'therapist'}`), 1000);
    } catch (err) {
      console.error('Erro no cadastro (terapeuta):', err);
      setMessage({ type: 'error', text: 'Ocorreu um erro. Tente novamente.' });
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
      boxSizing: 'border-box',
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
      border: '1px solid rgba(255, 255, 255, 0.2)',
    },
    topRow: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      justifyContent: 'flex-start',
      marginBottom: 12,
      textAlign: 'left',
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
      fontWeight: 600,
      width: 'fit-content',
    },
    title: { marginBottom: '0.5rem', color: '#1F2937', fontSize: '32px', fontWeight: '700' },
    subtitle: { marginBottom: '2rem', color: '#6B7280', fontSize: '16px', fontWeight: '400' },
    form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
    inputGroup: { textAlign: 'left' },
    label: {
      display: 'block',
      marginBottom: '8px',
      color: '#374151',
      fontSize: '14px',
      fontWeight: '600',
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      fontSize: '16px',
      border: '1px solid #D1D5DB',
      borderRadius: '12px',
      boxSizing: 'border-box',
      background: '#fff',
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
      width: '100%',
    },
    message: {
      padding: '12px',
      marginTop: '1.2rem',
      borderRadius: '10px',
      textAlign: 'center',
      fontWeight: '500',
      fontSize: '14px',
      color: '#111827',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        {/* Botões de voltar no topo */}
        <div style={styles.topRow}>
          <button style={styles.backBtn} onClick={() => navigate(`/login/${role || 'therapist'}`)}>
            ← Voltar para Login
          </button>
          <button style={styles.backBtn} onClick={() => navigate('/select-role')}>
            ← Seleção de Perfil
          </button>
        </div>

        <Icons.AppIcon style={{ marginBottom: '1rem', color: '#6D28D9' }} />
        <h1 style={styles.title}>Viscelius</h1>
        <p style={styles.subtitle}>Crie sua conta como Profissional</p>

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <div style={styles.inputGroup}>
            <label htmlFor="name" style={styles.label}>
              Nome Completo
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              placeholder="Seu nome completo"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="professionalId" style={styles.label}>
              Registro Profissional (CRP, CRM etc.)
            </label>
            <input
              type="text"
              id="professionalId"
              value={professionalId}
              onChange={(e) => setProfessionalId(e.target.value)}
              style={styles.input}
              placeholder="Número de registro"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="specialties" style={styles.label}>
              Especialidades
            </label>
            <input
              type="text"
              id="specialties"
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              style={styles.input}
              placeholder="Ex: Psicologia clínica, Terapia infantil"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="phone" style={styles.label}>
              Telefone (opcional)
            </label>
            <input
              type="text"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={styles.input}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>
              Email
            </label>
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
            <label htmlFor="password" style={styles.label}>
              Senha
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Pelo menos 6 caracteres"
              required
            />
          </div>

          <button type="submit" style={styles.button}>
            Registrar
          </button>
        </form>

        {message.text && (
          <div
            style={{
              ...styles.message,
              color: message.type === 'error' ? '#DC2626' : '#065F46',
            }}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterTherapistPage;
