import React from 'react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { AppIcon, HomeIcon, CalendarIcon, MusicIcon, HistoryIcon, UserIcon, LogoutIcon } from '../../common/Icons';

const Navbar = ({ activePage, setActivePage, onLogout, userRole }) => {
    const patientNavItems = [
        { id: 'home', icon: <HomeIcon />, label: 'Início' },
        { id: 'agendamentos', icon: <CalendarIcon />, label: 'Agendamentos' },
        { id: 'playlists', icon: <MusicIcon />, label: 'Playlists' },
        { id: 'historico', icon: <HistoryIcon />, label: 'Histórico' },
        { id: 'perfil', icon: <UserIcon />, label: 'Perfil' }
    ];

    const therapistNavItems = [
        { id: 'dashboard', icon: <HomeIcon />, label: 'Painel' },
        { id: 'perfil', icon: <UserIcon />, label: 'Perfil' }
    ];

    const navItems = userRole === 'therapist' ? therapistNavItems : patientNavItems;

    const styles = {
        navbar: { display: 'flex', flexDirection: 'column', width: '250px', backgroundColor: '#FFFFFF', padding: '2rem 1rem', borderRight: '1px solid #E5E7EB', color: '#4B5563', flexShrink: 0 },
        logoContainer: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0 1rem', marginBottom: '3rem' },
        logoText: { fontSize: '24px', fontWeight: 'bold', color: '#4C1D95' },
        navLink: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', textDecoration: 'none', color: '#4B5563', fontWeight: '500', margin: '4px 0', transition: 'background-color 0.2s, color 0.2s', cursor: 'pointer' },
        navLinkActive: { backgroundColor: '#EDE9FE', color: '#6D28D9' },
        logoutButton: { marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', textDecoration: 'none', color: '#4B5563', fontWeight: '500', margin: '4px 0', transition: 'background-color 0.2s, color 0.2s', cursor: 'pointer' },
    };

    const handleFirebaseLogout = async () => {
        try {
            await signOut(auth);
            onLogout();
        } catch (error) {
            console.error('Erro ao deslogar:', error);
        }
    };

    return (
        <nav style={styles.navbar}>
            <div style={styles.logoContainer}>
                <AppIcon style={{ color: '#6D28D9', width: '32px', height: '32px' }} />
                <span style={styles.logoText}>Viscelius</span>
            </div>
            {navItems.map(item => (<a key={item.id} href="/#" onClick={(e) => { e.preventDefault(); setActivePage(item.id); }} style={{ ...styles.navLink, ...(activePage === item.id ? styles.navLinkActive : {}) }}> {item.icon} <span>{item.label}</span> </a>))}
            <a href="/#" onClick={(e) => { e.preventDefault(); handleFirebaseLogout(); }} style={styles.logoutButton}> <LogoutIcon/> <span>Sair</span> </a>
        </nav>
    );
};

export default Navbar;