import React from 'react';

// Vamos criar dois ícones simples para esta tela
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const TherapistIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 2a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8z"></path><path d="M12 14h0"></path><path d="M12 18h0"></path><path d="M10 6h4"></path><path d="M10 10h4"></path></svg>;

// Este é o componente da nossa nova tela.
// A única função dele é dizer para o App.js qual botão foi clicado.
const RoleSelectionScreen = ({ onSelectRole }) => {

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: '"Inter", sans-serif',
            background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`, // Um fundo gradiente suave
            color: 'white',
            textAlign: 'center',
            padding: '20px'
        },
        title: {
            fontSize: '48px',
            fontWeight: 'bold',
            marginBottom: '1rem',
            textShadow: '0 2px 8px rgba(0,0,0,0.2)'
        },
        subtitle: {
            fontSize: '20px',
            marginBottom: '3rem',
            opacity: 0.9
        },
        selectionContainer: {
            display: 'flex',
            gap: '2rem',
            justifyContent: 'center',
            flexWrap: 'wrap' // Permite que os botões quebrem a linha em telas menores
        },
        roleCard: {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            padding: '2rem 3rem',
            width: '280px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)'
        },
        roleTitle: {
            fontSize: '24px',
            fontWeight: '600',
            margin: '1rem 0 0.5rem 0'
        },
        roleDescription: {
            fontSize: '16px',
            opacity: 0.8,
            lineHeight: 1.5
        }
    };

    // Efeitos de mouse para interatividade
    const handleMouseOver = (e) => {
        e.currentTarget.style.transform = 'translateY(-10px)';
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
        e.currentTarget.style.boxShadow = '0 16px 40px 0 rgba(0, 0, 0, 0.2)';
    };
    const handleMouseOut = (e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.1)';
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Bem-vindo(a) ao Viscelius</h1>
            <p style={styles.subtitle}>Como você gostaria de usar a plataforma?</p>
            <div style={styles.selectionContainer}>
                <div 
                    style={styles.roleCard} 
                    onClick={() => onSelectRole('patient')}
                    onMouseOver={handleMouseOver}
                    onMouseOut={handleMouseOut}
                >
                    <UserIcon />
                    <h2 style={styles.roleTitle}>Sou Paciente</h2>
                    <p style={styles.roleDescription}>Para agendar sessões, acessar playlists e acompanhar meu progresso.</p>
                </div>
                <div 
                    style={styles.roleCard} 
                    onClick={() => onSelectRole('therapist')}
                    onMouseOver={handleMouseOver}
                    onMouseOut={handleMouseOut}
                >
                    <TherapistIcon />
                    <h2 style={styles.roleTitle}>Sou Profissional</h2>
                    <p style={styles.roleDescription}>Para gerenciar meus pacientes, agendamentos e o conteúdo da plataforma.</p>
                </div>
            </div>
        </div>
    );
};

export default RoleSelectionScreen;