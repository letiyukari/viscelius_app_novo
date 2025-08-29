import React, { useState } from 'react';
import { auth, db } from '../../firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { AppIcon } from '../../common/Icons';

// Componente do ícone do Google
const GoogleIcon = () => <svg height="20" width="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path><path d="M1 1h22v22H1z" fill="none"></path></svg>;

const LoginPage = ({ onLoginSuccess, selectedRole, onNavigateToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
 
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        if (!email.trim() || !password.trim()) {
            setMessage({ type: 'error', text: 'Por favor, preencha todos os campos.' });
            return;
        }
        try {
            await signInWithEmailAndPassword(auth, email, password);
            onLoginSuccess();
        } catch (error) {
            setMessage({ type: 'error', text: 'Email ou senha inválidos.' });
            console.error(error);
        }
    };

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        setMessage({ type: '', text: '' });
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const additionalUserInfo = getAdditionalUserInfo(result);
            if (additionalUserInfo?.isNewUser) {
                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    role: selectedRole,
                    displayName: user.displayName,
                    photoURL: user.photoURL
                });
            }
            onLoginSuccess();
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao fazer login com Google.' });
            console.error(error)
        }
    };
 
    const styles = {
        container: { backgroundImage: `url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2070&auto=format&fit=crop')`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: '"Inter", sans-serif' },
        loginBox: { padding: '40px', backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px) saturate(150%)', WebkitBackdropFilter: 'blur(12px) saturate(150%)', borderRadius: '20px', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)', width: '100%', maxWidth: '420px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.2)' },
        title: { marginBottom: '0.5rem', color: '#1F2937', fontSize: '32px', fontWeight: '700' },
        subtitle: { marginBottom: '2rem', color: '#6B7280', fontSize: '16px', fontWeight: '400' },
        form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
        inputGroup: { textAlign: 'left', position: 'relative' },
        label: { display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '600' },
        input: { width: '100%', padding: '14px 16px', fontSize: '16px', border: '1px solid #D1D5DB', borderRadius: '12px', boxSizing: 'border-box' },
        button: { padding: '15px 16px', border: 'none', borderRadius: '12px', backgroundColor: '#8B5CF6', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
        message: { padding: '12px', marginTop: '1.2rem', borderRadius: '10px', textAlign: 'center', fontWeight: '500', fontSize: '14px' },
        loginLink: { cursor: 'pointer', color: '#6D28D9', marginTop: '1.5rem', fontWeight: 500 }
    };
 
    return (
      <div style={styles.container}>
        <div style={styles.loginBox}>
          <AppIcon style={{ marginBottom: '1rem', color: '#6D28D9' }} />
          <h1 style={styles.title}>Viscelius</h1>
          <p style={styles.subtitle}>Acesse sua plataforma como {selectedRole === 'patient' ? 'Paciente' : 'Profissional'}</p>
          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            <div style={styles.inputGroup}><label htmlFor="email" style={styles.label}>Email</label><input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} placeholder="seu.email@exemplo.com" required /></div>
            <div style={styles.inputGroup}><label htmlFor="password" style={styles.label}>Senha</label><input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} placeholder="••••••••" required /></div>
            <button type="submit" style={styles.button}>Entrar</button>
          </form>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#D1D5DB' }}></div>
            <span style={{color: '#6B7280'}}>ou</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#D1D5DB' }}></div>
          </div>
          <button onClick={handleGoogleSignIn} style={{...styles.button, width: '100%', boxSizing: 'border-box', backgroundColor: 'white', color: '#374151', border: '1px solid #D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <GoogleIcon />
            <span>Entrar com Google</span>
          </button>
          {message.text && <p style={{color: message.type === 'error' ? 'red' : 'green'}}>{message.text}</p>}
          <p style={styles.loginLink} onClick={onNavigateToRegister}>Não tem uma conta? Crie uma</p>
        </div>
      </div>
    );
};

export default LoginPage;