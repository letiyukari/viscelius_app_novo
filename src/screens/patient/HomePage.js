// src/screens/patient/HomePage.js (VERSÃO FINAL CORRIGIDA)
import React from 'react';

// Você talvez precise ajustar o caminho aqui dependendo de onde está seu arquivo de Ícones
import { BellIcon, PlayIcon, WindIcon } from '../../common/Icons';

/**
 * Componente HomePage
 * Tela inicial para o usuário do tipo "paciente".
 * @param {object} props - Propriedades do componente.
 * @param {object} props.user - Objeto do usuário autenticado, vindo do App.js.
 * @param {function} props.setActivePage - Função para alterar a página ativa.
 */
const HomePage = ({ user, setActivePage }) => {
    
    // Objeto de dados da página, agora preenchido com as informações do usuário real
    const patientData = {
        // Usa o nome de exibição do usuário (vindo do Google); se não existir, usa o e-mail.
        name: user ? (user.displayName || user.email) : "Carregando...",
        
        // Dados de exemplo que podem ser dinâmicos no futuro
        daysInApp: 42,
        sessionsCount: 8,
        nextSession: { date: "28 de Agosto, 2025", time: "14:30", therapist: "Dr. Carlos Mendes" },
        therapistInfo: { name: "Dr. Carlos Mendes", specialty: "Musicoterapeuta Clínico", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1374&auto=format&fit=crop" }
    };
    
    // O restante do seu código original (estilos, JSX) permanece o mesmo
    const styles = {
        pageContainer: { padding: '2rem 3.5rem', backgroundColor: '#F9FAFB', fontFamily: '"Inter", sans-serif' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
        headerText: {},
        welcomeTitle: { color: '#6B7280', fontSize: '1.1rem', fontWeight: '500', margin: '0' },
        patientName: { color: '#1F2937', fontSize: '2.2rem', fontWeight: '700', margin: '0' },
        notificationButton: { backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280' },
        heroCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#6D28D9', color: '#FFFFFF', padding: '2rem', borderRadius: '20px', marginBottom: '2.5rem' },
        heroInfo: {},
        heroTitle: { margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: '600', opacity: 0.9 },
        heroDateTime: { margin: '0', fontSize: '2.5rem', fontWeight: '700' },
        heroTherapist: { margin: '1rem 0 0 0', opacity: 0.8 },
        heroButton: { backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' },
        sectionTitle: { fontSize: '1.5rem', color: '#1F2937', fontWeight: '600', marginBottom: '1.5rem' },
        quickAccessGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' },
        accessCard: { display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', borderRadius: '16px', backgroundColor: '#fff', border: '1px solid #E5E7EB', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' },
        accessCardIcon: { color: '#8B5CF6' },
        accessCardText: {},
        accessCardTitle: { margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#1F2937' },
        accessCardSubtitle: { margin: '4px 0 0 0', color: '#6B7280' },
        bottomGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' },
        statsAndTherapistColumn: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
        card: { backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', border: '1px solid #E5E7EB' },
        statCard: { display: 'flex', justifyContent: 'space-around', alignItems: 'center', textAlign: 'center' },
        statLabel: { color: '#6B7280', fontSize: '0.9rem' },
        statValue: { color: '#1F2937', fontSize: '1.8rem', fontWeight: '600' },
        therapistCard: { display: 'flex', alignItems: 'center', gap: '1rem' },
        therapistAvatar: { width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' },
        therapistInfo: {},
        therapistName: { margin: 0, color: '#1F2937', fontWeight: 600 },
        therapistSpecialty: { margin: 0, color: '#6B7280', fontSize: '0.9rem' },
        infoSection: { gridColumn: '1 / -1', marginTop: '1.5rem' },
        infoTitle: { color: '#1F2937', borderBottom: '2px solid #D1C4E9', paddingBottom: '0.5rem', marginBottom: '1rem' },
        infoText: { color: '#4B5563', lineHeight: '1.6' }
    };

    const handleCardHover = (e, enter) => {
        if (enter) {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.08)';
        } else {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
        }
    };

    return (
        <div style={styles.pageContainer}>
            <header style={styles.header}>
                <div style={styles.headerText}>
                    <h2 style={styles.welcomeTitle}>Bem-vindo(a) de volta,</h2>
                    <h1 style={styles.patientName}>{patientData.name}</h1>
                </div>
                <button style={styles.notificationButton} title="Notificações"><BellIcon /></button>
            </header>
            <div style={styles.heroCard}>
                <div style={styles.heroInfo}>
                    <h3 style={styles.heroTitle}>Sua Próxima Sessão</h3>
                    <p style={styles.heroDateTime}>{patientData.nextSession.date} às {patientData.nextSession.time}</p>
                    <p style={styles.heroTherapist}>com {patientData.nextSession.therapist}</p>
                </div>
                <button style={styles.heroButton} onClick={() => setActivePage('agendamentos')}>Ver Detalhes</button>
            </div>
            <h2 style={styles.sectionTitle}>Acesso Rápido</h2>
            <div style={styles.quickAccessGrid}>
                <div style={styles.accessCard} onMouseEnter={(e) => handleCardHover(e, true)} onMouseLeave={(e) => handleCardHover(e, false)} onClick={() => setActivePage('playlists')}>
                    <div style={styles.accessCardIcon}><PlayIcon /></div>
                    <div style={styles.accessCardText}>
                        <h3 style={styles.accessCardTitle}>Ouvir suas Playlists</h3>
                        <p style={styles.accessCardSubtitle}>Sons e músicas para o seu dia.</p>
                    </div>
                </div>
                <div style={styles.accessCard} onMouseEnter={(e) => handleCardHover(e, true)} onMouseLeave={(e) => handleCardHover(e, false)}>
                    <div style={styles.accessCardIcon}><WindIcon/></div>
                    <div style={styles.accessCardText}>
                        <h3 style={styles.accessCardTitle}>Exercício de Respiração</h3>
                        <p style={styles.accessCardSubtitle}>Encontre seu foco e calma.</p>
                    </div>
                </div>
            </div>
               <div style={styles.bottomGrid}>
                <div style={{...styles.card, ...styles.infoSection}}>
                    <h2 style={styles.infoTitle}>O que é Musicoterapia?</h2>
                    <p style={styles.infoText}>
                        A musicoterapia é o uso profissional da música e seus elementos como uma intervenção em ambientes médicos, educacionais e cotidianos com indivíduos, grupos, famílias ou comunidades que procuram otimizar sua qualidade de vida e melhorar sua saúde e bem-estar físico, social, comunicativo, emocional, intelectual e espiritual.
                    </p>
                </div>
                <div style={styles.statsAndTherapistColumn}>
                    <div style={styles.card}>
                        <div style={styles.statCard}>
                            <div>
                                <p style={styles.statValue}>{patientData.daysInApp}</p>
                                <p style={styles.statLabel}>Dias na Plataforma</p>
                            </div>
                            <div>
                                <p style={styles.statValue}>{patientData.sessionsCount}</p>
                                <p style={styles.statLabel}>Sessões Realizadas</p>
                            </div>
                        </div>
                    </div>
                    <div style={{...styles.card, ...styles.therapistCard}}>
                        <img src={patientData.therapistInfo.avatar} alt={patientData.therapistInfo.name} style={styles.therapistAvatar} />
                        <div style={styles.therapistInfo}>
                            <p style={styles.therapistName}>{patientData.therapistInfo.name}</p>
                            <p style={styles.therapistSpecialty}>{patientData.therapistInfo.specialty}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;