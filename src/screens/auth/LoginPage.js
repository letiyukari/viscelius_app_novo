import React, { useState } from 'react';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Icons from '../../components/common/Icons';

const LoginPage = ({ onLoginSuccess, selectedRole }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isRegistering, setIsRegistering] = useState(false);
  
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
    
        if (!email.trim() || !password.trim()) {
            setMessage({ type: 'error', text: 'Por favor, preencha todos os campos.' });
            return;
        }
    
        try {
            if (isRegistering) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    displayName: email.split('@')[0], // Pega o nome do usuário antes do @
                    role: selectedRole 
                });

                setMessage({ type: 'success', text: 'Conta criada com sucesso! Por favor, faça login.' });
                setIsRegistering(false);
                setEmail('');
                setPassword('');
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                onLoginSuccess();
            }
        } catch (firebaseError) {
            let errorMessage = 'Ocorreu um erro. Tente novamente.';
            switch (firebaseError.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Endereço de e-mail inválido.';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    errorMessage = 'E-mail ou senha incorretos.';
                    break;
                case 'auth/email-already-in-use':
                    errorMessage = 'Este e-mail já está em uso. Tente fazer login ou use outro e-mail.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
                    break;
                default:
                    errorMessage = `Erro: ${firebaseError.message}`;
                    break;
            }
            setMessage({ type: 'error', text: errorMessage });
            console.error('Erro de autenticação Firebase:', firebaseError);
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
              displayName: user.displayName, // Salva o nome do Google
              photoURL: user.photoURL // Salva a foto do Google
            });
          }
    
          onLoginSuccess();
        } catch (error) {
          setMessage({ type: 'error', text: 'Erro ao fazer login com Google.' });
          console.error('Erro de autenticação com Google:', error);
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
        input: { width: '100%', padding: '14px 16px', fontSize: '16px', border: '1px solid #D1D5DB', borderRadius: '12px', boxSizing: 'border-box', transition: 'border-color 0.3s, box-shadow 0.3s', backgroundColor: 'rgba(255, 255, 255, 0.7)', color: '#111827' },
        button: { padding: '15px 16px', border: 'none', borderRadius: '12px', backgroundColor: '#8B5CF6', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.3s, transform 0.2s, box-shadow 0.3s', marginTop: '1rem', boxShadow: '0 4px 20px 0 rgba(139, 92, 246, 0.35)'},
        message: { padding: '12px', marginTop: '1.2rem', borderRadius: '10px', textAlign: 'center', fontWeight: '500', fontSize: '14px' },
        successMessage: { backgroundColor: 'rgba(221, 247, 226, 0.9)', color: '#166534' },
        errorMessage: { backgroundColor: 'rgba(254, 226, 226, 0.9)', color: '#991B1B' },
        footer: { position: 'absolute', bottom: '20px', fontSize: '14px', color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.5)' },
        loginLink: { cursor: 'pointer', color: '#6D28D9', marginTop: '1.5rem', fontWeight: 500 }
    };
  
    const handleMouseOver = (e) => { e.currentTarget.style.backgroundColor = '#7C3AED'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 22px 0 rgba(124, 58, 237, 0.4)';};
    const handleMouseOut = (e) => { e.currentTarget.style.backgroundColor = '#8B5CF6'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px 0 rgba(139, 92, 246, 0.35)';};
    const handleFocus = (e) => { e.currentTarget.style.borderColor = '#8B5CF6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.2)'; };
    const handleBlur = (e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; };
  
    return (
      <div style={styles.container}>
        <div style={styles.loginBox}>
          <Icons.AppIcon style={{ marginBottom: '1rem', color: '#6D28D9' }} />
          <h1 style={styles.title}>Viscelius</h1>
          <p style={styles.subtitle}>{isRegistering ? 'Crie sua conta' : `Acesse sua plataforma como ${selectedRole === 'patient' ? 'Paciente' : 'Profissional'}`}</p>
          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            <div style={styles.inputGroup}><label htmlFor="email" style={styles.label}>Email</label><input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={handleFocus} onBlur={handleBlur} style={styles.input} placeholder="seu.email@exemplo.com" required /></div>
            <div style={styles.inputGroup}><label htmlFor="password" style={styles.label}>Senha</label><input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={handleFocus} onBlur={handleBlur} style={styles.input} placeholder="••••••••" required /></div>
            <button type="submit" style={styles.button} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>{isRegistering ? 'Registrar' : 'Entrar'}</button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#D1D5DB' }}></div>
            <span style={{ color: '#6B7280' }}>ou</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#D1D5DB' }}></div>
          </div>

          <button 
            onClick={handleGoogleSignIn} 
            style={{ ...styles.button, backgroundColor: '#FFFFFF', color: '#374151', border: '1px solid #D1D5DB', boxShadow: '0 4px 12px 0 rgba(0, 0,0, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', boxSizing: 'border-box' }} 
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F9FAFB'; }} 
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
          >
            <Icons.GoogleIcon />
            <span>Entrar com Google</span>
          </button>

          {message.text && (<div style={{...styles.message, ...(message.type === 'success' ? styles.successMessage : styles.errorMessage)}}>{message.text}</div>)}
          <p style={styles.loginLink} onClick={() => setIsRegistering(!isRegistering)}>{isRegistering ? 'Já tem uma conta? Faça Login' : 'Não tem uma conta? Crie uma'}</p>
        </div>
        <footer style={styles.footer}><p>© 2025 Viscelius. Todos os direitos reservados.</p></footer>
      </div>
    );
};

export default LoginPage;