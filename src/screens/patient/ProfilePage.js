import React, { useState } from 'react';

// --- PÁGINA DE PERFIL ---
const ProfilePage = ({ onLogout }) => {
    const [userData, setUserData] = useState({
        name: "Ana Oliveira",
        email: "ana.oliveira@email.com",
        phone: "+55 11 98765-4321",
        memberSince: "Março, 2025",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop",
        plan: "Plano Premium Mensal",
    });

    const [activeView, setActiveView] = useState('main');

    const MainProfileView = () => (
        <div style={styles.rightColumn}>
            <div style={styles.card}>
                <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>Informações da Conta</h3>
                    <button style={styles.editButton} onClick={() => setActiveView('editInfo')}>Editar</button>
                </div>
                <div>
                    <div style={styles.infoRow}><span style={styles.infoLabel}>Nome Completo</span><span style={styles.infoValue}>{userData.name}</span></div>
                    <div style={styles.infoRow}><span style={styles.infoLabel}>Email</span><span style={styles.infoValue}>{userData.email}</span></div>
                    <div style={styles.infoRow}><span style={styles.infoLabel}>Telefone</span><span style={styles.infoValue}>{userData.phone}</span></div>
                    <div style={styles.infoRow}><span style={styles.infoLabel}>Membro desde</span><span style={styles.infoValue}>{userData.memberSince}</span></div>
                </div>
            </div>
            <div style={styles.card}>
                <div style={styles.cardHeader}><h3 style={styles.cardTitle}>Segurança</h3></div>
                <div style={styles.actionRow}><p style={{margin: 0, color: '#374151'}}>Senha</p><button style={styles.actionButton} onClick={() => setActiveView('changePassword')}>Alterar Senha</button></div>
            </div>
            <div style={styles.card}>
                <div style={styles.cardHeader}><h3 style={styles.cardTitle}>Assinatura e Pagamentos</h3></div>
                <div style={styles.infoRow}><span style={styles.infoLabel}>Plano Atual</span><span style={styles.infoValue}>{userData.plan}</span></div>
                <div style={styles.actionRow}><p style={{margin: 0, color: '#374151'}}>Faturamento</p><button style={styles.actionButton} onClick={() => setActiveView('manageSubscription')}>Gerenciar Assinatura</button></div>
            </div>
            <div style={styles.card}>
                <div style={styles.cardHeader}><h3 style={styles.cardTitle}>Ações da Conta</h3></div>
                <div style={styles.actionRow}><p style={{margin: 0, color: '#374151'}}>Sair de todos os dispositivos</p><button style={styles.actionButton} onClick={onLogout}>Sair</button></div>
                <div style={styles.actionRow}><p style={{margin: 0, color: '#DC2626'}}>Excluir sua conta</p><button style={styles.dangerButton}>Excluir Conta</button></div>
            </div>
        </div>
    );

    const EditInfoView = () => (
        <div style={styles.rightColumn}>
            <div style={styles.card}>
                <div style={styles.cardHeader}><h3 style={styles.cardTitle}>Editar Informações</h3></div>
                <form style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                    <div style={styles.formGroup}><label style={styles.formLabel}>Nome Completo</label><input type="text" style={styles.formInput} defaultValue={userData.name} /></div>
                    <div style={styles.formGroup}><label style={styles.formLabel}>Email</label><input type="email" style={styles.formInput} defaultValue={userData.email} /></div>
                    <div style={styles.formGroup}><label style={styles.formLabel}>Telefone</label><input type="tel" style={styles.formInput} defaultValue={userData.phone} /></div>
                    <div style={styles.formActions}>
                        <button type="button" style={styles.cancelButton} onClick={() => setActiveView('main')}>Cancelar</button>
                        <button type="submit" style={styles.saveButton}>Salvar Alterações</button>
                    </div>
                </form>
            </div>
        </div>
    );

    const ChangePasswordView = () => (
        <div style={styles.rightColumn}>
            <div style={styles.card}>
                <div style={styles.cardHeader}><h3 style={styles.cardTitle}>Alterar Senha</h3></div>
                <form style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                    <div style={styles.formGroup}><label style={styles.formLabel}>Nova Senha</label><input type="password" style={styles.formInput} /></div>
                    <div style={styles.formGroup}><label style={styles.formLabel}>Confirmar Nova Senha</label><input type="password" style={styles.formInput} /></div>
                    <div style={styles.formActions}>
                        <button type="button" style={styles.cancelButton} onClick={() => setActiveView('main')}>Cancelar</button>
                        <button type="submit" style={styles.saveButton}>Salvar Senha</button>
                    </div>
                </form>
            </div>
        </div>
    );

    const ManageSubscriptionView = () => {
        const plans = [
            { name: "Plano Básico", price: "R$ 29,90/mês", features: ["Acesso a playlists", "Agendamento de 2 sessões/mês"], current: false },
            { name: "Plano Premium", price: "R$ 49,90/mês", features: ["Acesso ilimitado", "Agendamento de 4 sessões/mês", "Sons binaurais exclusivos"], current: true },
            { name: "Plano Família", price: "R$ 79,90/mês", features: ["Tudo do Premium", "Até 4 membros", "Playlists compartilhadas"], current: false },
        ];
        return (
            <div style={styles.rightColumn}>
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <h3 style={styles.cardTitle}>Gerenciar Assinatura</h3>
                        <button style={styles.cancelButton} onClick={() => setActiveView('main')}>Voltar</button>
                    </div>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem'}}>
                        {plans.map(plan => (
                            <div key={plan.name} style={{...styles.planCard, ...(plan.current && styles.planCardCurrent)}}>
                                <h4 style={styles.planName}>{plan.name}</h4>
                                <p style={styles.planPrice}>{plan.price}</p>
                                <ul style={styles.planFeatures}>
                                    {plan.features.map(feature => <li key={feature}>{feature}</li>)}
                                </ul>
                                <button style={{...styles.planButton, ...(plan.current && styles.planButtonCurrent)}}>
                                    {plan.current ? "Seu Plano Atual" : "Escolher Plano"}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const renderActiveView = () => {
        switch (activeView) {
            case 'editInfo': return <EditInfoView />;
            case 'changePassword': return <ChangePasswordView />;
            case 'manageSubscription': return <ManageSubscriptionView />;
            case 'main':
            default: return <MainProfileView />;
        }
    };

    const styles = {
        pageContainer: { padding: '2rem 3.5rem', backgroundColor: '#F9FAFB', fontFamily: '"Inter", sans-serif', overflowY: 'auto', height: '100vh' },
        header: { marginBottom: '2.5rem' },
        title: { color: '#1F2937', fontSize: '2.2rem', fontWeight: '700', margin: '0' },
        mainGrid: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem' },
        leftColumn: {},
        rightColumn: { display: 'flex', flexDirection: 'column', gap: '2rem' },
        profileCard: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '2rem', textAlign: 'center', position: 'relative' },
        avatarContainer: { position: 'relative', width: '120px', margin: '0 auto 1rem auto' },
        avatar: { width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
        avatarOverlay: { position: 'absolute', top: 0, left: 0, width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.4)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0, transition: 'opacity 0.3s' },
        name: { color: '#1F2937', fontSize: '1.5rem', fontWeight: 600, margin: 0 },
        email: { color: '#6B7280', margin: '0.25rem 0 0 0' },
        card: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '2rem' },
        cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem', marginBottom: '1.5rem' },
        cardTitle: { color: '#1F2937', fontSize: '1.2rem', fontWeight: 600, margin: 0 },
        editButton: { background: 'none', border: '1px solid #D1D5DB', color: '#374151', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 },
        infoRow: { display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0' },
        infoLabel: { color: '#6B7280' },
        infoValue: { color: '#1F2937', fontWeight: 500 },
        actionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderTop: '1px solid #F3F4F6' },
        actionButton: { background: 'none', border: 'none', color: '#4F46E5', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' },
        dangerButton: { background: 'none', border: 'none', color: '#DC2626', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' },
        formGroup: { display: 'flex', flexDirection: 'column' },
        formLabel: { color: '#374151', fontWeight: 500, marginBottom: '0.5rem' },
        formInput: { width: '100%', padding: '12px', fontSize: '1rem', border: '1px solid #D1D5DB', borderRadius: '8px', boxSizing: 'border-box' },
        formActions: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' },
        cancelButton: { backgroundColor: '#fff', border: '1px solid #D1D5DB', color: '#374151', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
        saveButton: { backgroundColor: '#8B5CF6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
        planCard: { border: '1px solid #E5E7EB', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' },
        planCardCurrent: { borderColor: '#8B5CF6', borderWidth: '2px', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.1)' },
        planName: { margin: 0, fontSize: '1.1rem', fontWeight: 600 },
        planPrice: { margin: '0.5rem 0 1rem 0', fontSize: '1.8rem', fontWeight: 700, color: '#1F2937' },
        planFeatures: { listStyle: 'none', padding: 0, margin: 0, color: '#6B7280' },
        planButton: { marginTop: '1.5rem', width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #8B5CF6', backgroundColor: 'transparent', color: '#8B5CF6', fontWeight: 600, cursor: 'pointer' },
        planButtonCurrent: { backgroundColor: '#8B5CF6', color: '#fff' }
    };

    return (
        <div style={styles.pageContainer}>
             <header style={styles.header}>
                <h1 style={styles.title}>Conta e Perfil</h1>
            </header>
            <div style={styles.mainGrid}>
                <div style={styles.leftColumn}>
                    <div style={styles.profileCard}>
                        <div style={styles.avatarContainer} onMouseEnter={(e) => e.currentTarget.children[1].style.opacity = 1} onMouseLeave={(e) => e.currentTarget.children[1].style.opacity = 0}>
                            <img src={userData.avatar} alt="User Avatar" style={styles.avatar}/>
                            <div style={styles.avatarOverlay}><span>Alterar</span></div>
                        </div>
                        <h2 style={styles.name}>{userData.name}</h2>
                        <p style={styles.email}>{userData.email}</p>
                    </div>
                </div>
                {renderActiveView()}
            </div>
        </div>
    );
};

export default ProfilePage;