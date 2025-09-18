import React from 'react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import Icons from '../../components/common/Icons';

const Navbar = ({ onLogout, userRole, navigate }) => {
  const patientNavItems = [
    { id: 'inicio', path: '/inicio', icon: <Icons.HomeIcon />, label: 'Início' },
    { id: 'agendamentos', path: '/agendamentos', icon: <Icons.CalendarIcon />, label: 'Agendamentos' },
    { id: 'playlists', path: '/playlists', icon: <Icons.MusicIcon />, label: 'Playlists' },
    { id: 'historico', path: '/historico', icon: <Icons.HistoryIcon />, label: 'Histórico' },
    { id: 'perfil', path: '/perfil', icon: <Icons.UserIcon />, label: 'Perfil' }
  ];

  const therapistNavItems = [
    { id: 'dashboard', path: '/dashboard', icon: <Icons.HomeIcon />, label: 'Painel' },
    { id: 'agenda', path: '/agenda', icon: <Icons.CalendarIcon />, label: 'Agenda' }, // <<< NOVO
    { id: 'playlists', path: '/playlists', icon: <Icons.MusicIcon />, label: 'Playlists' },
    { id: 'perfil', path: '/perfil', icon: <Icons.UserIcon />, label: 'Perfil' }
  ];

  const navItems = userRole === 'therapist' ? therapistNavItems : patientNavItems;
  const activePageId = navItems.find(item => window.location.pathname.startsWith(item.path))?.id;

  const styles = {
    navbar: { display: 'flex', flexDirection: 'column', width: '250px', backgroundColor: '#FFFFFF', padding: '2rem 1rem', borderRight: '1px solid #E5E7EB', color: '#4B5563', flexShrink: 0 },
    logoContainer: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0 1rem', marginBottom: '3rem' },
    logoText: { fontSize: '24px', fontWeight: 'bold', color: '#4C1D95' },
    navLink: { display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 16px', borderRadius: '10px', textDecoration: 'none', color: '#4B5563', fontWeight: '500', margin: '4px 0', transition: 'background-color 0.2s, color 0.2s', cursor: 'pointer' },
    navLinkActive: { backgroundColor: '#EDE9FE', color: '#6D28D9' },
    navLinkHover: { backgroundColor: '#F9FAFB' },
    logoutButton: { marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 16px', borderRadius: '10px', textDecoration: 'none', color: '#4B5563', fontWeight: '500', margin: '4px 0', transition: 'background-color 0.2s, color 0.2s', cursor: 'pointer' },
  };

  const handleFirebaseLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (error) { console.error('Erro ao deslogar:', error); }
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.logoContainer}>
        <Icons.AppIcon style={{ color: '#6D28D9', width: '32px', height: '32px' }} />
        <span style={styles.logoText}>Viscelius</span>
      </div>

      {navItems.map(item => {
        const isActive = activePageId === item.id;
        return (
          <a
            key={item.id}
            href={item.path}
            onClick={(e) => {
              e.preventDefault();
              navigate(item.path);
            }}
            style={{ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) }}
            onMouseOver={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = styles.navLinkHover.backgroundColor; }}
            onMouseOut={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {item.icon} <span>{item.label}</span>
          </a>
        );
      })}

      <a
        href="/#"
        onClick={(e) => { e.preventDefault(); handleFirebaseLogout(); }}
        style={styles.logoutButton}
        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = styles.navLinkHover.backgroundColor; }}
        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        <Icons.LogoutIcon/> <span>Sair</span>
      </a>
    </nav>
  );
};
export default Navbar;
