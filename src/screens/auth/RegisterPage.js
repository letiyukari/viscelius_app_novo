import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Icons from '../../components/common/Icons';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { role } = useParams();
    
    const [name, setName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
 
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        if (!name.trim() || !birthDate.trim() || !email.trim() || !password.trim()) {
            setMessage({ type: 'error', text: 'Por favor, preencha todos os campos.' });
            return;
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await updateProfile(user, {
                displayName: name 
            });
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                displayName: name,
                birthDate: birthDate,
                role: role
            });
            setMessage({ type: 'success', text: 'Conta criada com sucesso! Redirecionando para o login...' });
            setTimeout(() => {
                navigate(`/login/${role}`);
            }, 2000);
        } catch (firebaseError) {
            let errorMessage = 'Ocorreu um erro. Tente novamente.';
            setMessage({ type: 'error', text: errorMessage });
            console.error('Erro no cadastro:', firebaseError);
        }
    };
 
    const styles = {
        container: { backgroundImage: `url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2070&auto=format&fit=crop')`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: '"Inter", sans-serif' },
        loginBox: { padding: '40px', backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px) saturate(150%)', borderRadius: '20px', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)', width: '100%', maxWidth: '420px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.2)' },
        title: { marginBottom: '0.5rem', color: '#1F2937', fontSize: '32px', fontWeight: '700' },
        subtitle: { marginBottom: '2rem', color: '#6B7280', fontSize: '16px', fontWeight: '400' },
        form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
        inputGroup: { textAlign: 'left' },
        label: { display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '600' },
        input: { width: '100%', padding: '14px 16px', fontSize: '16px', border: '1px solid #D1D5DB', borderRadius: '12px', boxSizing: 'border-box' },
        button: { padding: '15px 16px', border: 'none', borderRadius: '12px', backgroundColor: '#8B5CF6', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
        message: { padding: '12px', marginTop: '1.2rem', borderRadius: '10px', textAlign: 'center', fontWeight: '500', fontSize: '14px' },
        loginLink: { cursor: 'pointer', color: '#6D28D9', marginTop: '1.5rem', fontWeight: 500 }
    };
 
    return (
      <div style={styles.container}>
        <div style={styles.loginBox}>
          <Icons.AppIcon style={{ marginBottom: '1rem', color: '#6D28D9' }} />
          <h1 style={styles.title}>Viscelius</h1>
          <p style={styles.subtitle}>Crie sua conta como Paciente</p>
          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            <div style={styles.inputGroup}>
                <label htmlFor="name" style={styles.label}>Nome Completo</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} placeholder="Seu nome completo" required />
            </div>
            <div style={styles.inputGroup}>
                <label htmlFor="birthDate" style={styles.label}>Data de Nascimento</label>
                <input type="date" id="birthDate" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={styles.input} required />
            </div>
            <div style={styles.inputGroup}><label htmlFor="email" style={styles.label}>Email</label><input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} placeholder="seu.email@exemplo.com" required /></div>
            <div style={styles.inputGroup}><label htmlFor="password" style={styles.label}>Senha</label><input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} placeholder="Pelo menos 6 caracteres" required /></div>
            <button type="submit" style={styles.button}>Registrar</button>
          </form>
          {message.text && (<div style={{...styles.message}}>{message.text}</div>)}
          <p style={styles.loginLink} onClick={() => navigate(`/login/${role}`)}>Já tem uma conta? Faça Login</p>
        </div>
      </div>
    );
};

export default RegisterPage;