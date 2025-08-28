// src/App.js
import React, { useState, useEffect, useRef } from 'react';
// IMPORTAÇÕES DO FIREBASE
import { auth, db } from './firebase'; // Importe 'auth' e 'db' do seu arquivo firebase.js
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { collection, addDoc, onSnapshot, query, where, doc, deleteDoc } from 'firebase/firestore'; // Importe funções do Firestore

// --- Ícones ---
import {
    AppIcon, HomeIcon, CalendarIcon, MusicIcon, HistoryIcon, UserIcon, LogoutIcon, BellIcon,
    PlayIcon, PauseIcon, WindIcon, ClockIcon, VideoIcon, AwardIcon, CheckCircleIcon,
    UserCheckIcon, PlusIcon, XIcon
} from './common/Icons';

// --- PÁGINAS E COMPONENTES ---
import LoginPage from './screens/auth/LoginPage';
import Navbar from './components/layout/Navbar';
import HomePage from './screens/patient/HomePage';
import AgendamentosPage from './screens/patient/AgendamentosPage'; // ADICIONADO: Importação da AgendamentosPage


// --- MODAL PARA GERENCIAR MÚSICAS DA PLAYLIST ---
const PlaylistDetailModal = ({ playlist, onClose }) => {
    const [songs, setSongs] = useState([]);
    const [newSongName, setNewSongName] = useState('');
    const [newSongArtist, setNewSongArtist] = useState('');
    const [newSongUrl, setNewSongUrl] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
  
    useEffect(() => {
        if (!playlist?.id) return;
  
        const songsCollectionRef = collection(db, 'playlists', playlist.id, 'songs');
        const q = query(songsCollectionRef);
  
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedSongs = [];
            querySnapshot.forEach((doc) => {
                fetchedSongs.push({ id: doc.id, ...doc.data() });
            });
            setSongs(fetchedSongs);
        }, (error) => {
            console.error("Erro ao carregar músicas:", error);
            setMessage({ type: 'error', text: 'Erro ao carregar músicas.' });
        });
  
        return () => unsubscribe();
    }, [playlist]);
  
    const handleAddSong = async () => {
        setMessage({ type: '', text: '' });
        if (!newSongName.trim() || !newSongArtist.trim() || !newSongUrl.trim()) {
            setMessage({ type: 'error', text: 'Por favor, preencha todos os campos da música.' });
            return;
        }
  
        try {
            await addDoc(collection(db, 'playlists', playlist.id, 'songs'), {
                name: newSongName,
                artist: newSongArtist,
                url: newSongUrl,
                createdAt: new Date(),
            });
            setMessage({ type: 'success', text: 'Música adicionada com sucesso!' });
            setNewSongName('');
            setNewSongArtist('');
            setNewSongUrl('');
        } catch (e) {
            setMessage({ type: 'error', text: 'Erro ao adicionar música. Tente novamente.' });
            console.error("Erro ao adicionar música: ", e);
        }
    };
  
    const handleDeleteSong = async (songId) => {
        setMessage({ type: '', text: '' });
        try {
            await deleteDoc(doc(db, 'playlists', playlist.id, 'songs', songId));
            setMessage({ type: 'success', text: 'Música removida.' });
        } catch (e) {
            setMessage({ type: 'error', text: 'Erro ao remover música.' });
            console.error("Erro ao remover música: ", e);
        }
    };
  
    const styles = {
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
        modal: { backgroundColor: '#1E1E1E', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', color: '#fff' },
        closeButton: { position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' },
        title: { fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#fff' },
        formGroup: { marginBottom: '1rem' },
        input: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#333', color: '#fff', fontSize: '1rem' },
        button: { backgroundColor: '#8B5CF6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', transition: 'background-color 0.2s' },
        message: { padding: '10px', borderRadius: '5px', marginTop: '10px', fontSize: '0.9rem' },
        successMessage: { backgroundColor: '#d4edda', color: '#155724' },
        errorMessage: { backgroundColor: '#f8d7da', color: '#721c24' },
        songList: { marginTop: '2rem' },
        songItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#282828', padding: '0.8rem', borderRadius: '8px', marginBottom: '0.5rem' },
        songDetails: {},
        songName: { margin: 0, fontWeight: 600 },
        songArtist: { margin: '4px 0 0 0', fontSize: '0.9rem', color: '#b3b3b3' },
        deleteButton: { background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1.2rem' },
    };
  
    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <button onClick={onClose} style={styles.closeButton}><XIcon /></button>
                <h2 style={styles.title}>Gerenciar Músicas de "{playlist.name}"</h2>
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1rem' }}>Adicionar Nova Música</h3>
                    <div style={styles.formGroup}><input type="text" placeholder="Nome da Música" value={newSongName} onChange={(e) => setNewSongName(e.target.value)} style={styles.input} /></div>
                    <div style={styles.formGroup}><input type="text" placeholder="Artista" value={newSongArtist} onChange={(e) => setNewSongArtist(e.target.value)} style={styles.input} /></div>
                    <div style={styles.formGroup}><input type="text" placeholder="URL do Áudio (Ex: /audio/minha-musica.mp3)" value={newSongUrl} onChange={(e) => setNewSongUrl(e.target.value)} style={styles.input} /></div>
                    <button onClick={handleAddSong} style={styles.button}>Adicionar Música</button>
                    {message.text && (<div style={{ ...styles.message, ...(message.type === 'success' ? styles.successMessage : styles.errorMessage) }}>{message.text}</div>)}
                </div>
                <div style={styles.songList}>
                    <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1rem' }}>Músicas na Playlist</h3>
                    {songs.length > 0 ? (songs.map(song => (
                        <div key={song.id} style={styles.songItem}>
                            <div style={styles.songDetails}>
                                <p style={styles.songName}>{song.name}</p>
                                <p style={styles.songArtist}>{song.artist}</p>
                            </div>
                            <button onClick={() => handleDeleteSong(song.id)} style={styles.deleteButton}><XIcon /></button>
                        </div>
                    ))) : (<p style={{ color: '#b3b3b3' }}>Nenhuma música nesta playlist ainda.</p>)}
                </div>
            </div>
        </div>
    );
};


// --- PÁGINA DE PLAYLISTS ---
const PlaylistsPage = () => {
    const audioRef = useRef(null);
    const [nowPlaying, setNowPlaying] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [firestorePlaylists, setFirestorePlaylists] = useState([]);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showPlaylistDetailModal, setShowPlaylistDetailModal] = useState(false);
    const [selectedPlaylistForDetail, setSelectedPlaylistForDetail] = useState(null);
    const yourPlaylistsStatic = [ { id: 'static-1', name: "Calma Interior", desc: "Músicas para acalmar a mente.", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2120&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" }, { id: 'static-2', name: "Manhã Positiva", desc: "Comece seu dia com energia.", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" }, { id: 'static-3', name: "Sons de Chuva", desc: "Relaxe com o som da chuva.", image: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?q=80&w=1935&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" }, ];
    const natureSounds = [ { id: 'static-4', name: "Ondas do Mar", desc: "Sinta a brisa do oceano.", image: "https://images.unsplash.com/photo-1507525428034-b723a9ce6890?q=80&w=2070&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" }, { id: 'static-5', name: "Floresta Amazônica", desc: "Conecte-se com a natureza.", image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2071&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" }, { id: 'static-6', name: "Pássaros da Manhã", desc: "Desperte com sons suaves.", image: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1925&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" }, ];
    const focusFrequencies = [ { id: 'static-7', name: "Foco Profundo", desc: "Ondas Alpha para concentração.", image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" }, { id: 'static-8', name: "Criatividade Ativa", desc: "Frequências para inspirar.", image: "https://images.unsplash.com/photo-1484589065579-248aad0d8b13?q=80&w=1959&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" }, { id: 'static-9', name: "Memória e Estudo", desc: "Melhore sua capacidade de aprender.", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1973&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" }, ];
    const guidedJourneys = [ { id: 'static-10', name: "Jornada da Gratidão", desc: "10 min de meditação guiada.", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1999&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" }, { id: 'static-11', name: "Encontrando a Paz", desc: "15 min para aliviar a ansiedade.", image: "https://images.unsplash.com/photo-1597282826928-85e59239d543?q=80&w=1974&auto=format&fit=crop", url: "/audio/relaxamento-profundo.mp3" }, ];
  
    const handleAddPlaylist = async () => { /* ... */ };
    useEffect(() => { /* ... */ }, []);
    const handlePlayPause = (track) => { /* ... */ };
    useEffect(() => { /* ... */ }, [nowPlaying]);
    const openPlaylistDetail = (playlist) => { /* ... */ };
    const closePlaylistDetail = () => { /* ... */ };
  
    const PlaylistCard = ({ item, onPlay, isPlayingNow, isDynamic = false, onManage }) => { /* ... */ };
    const PlaylistSection = ({ title, data, onPlay, nowPlaying, isPlaying, isDynamic = false, onManage }) => { /* ... */ };
    const PlayerBar = ({ track, onPlayPause, isPlaying }) => { /* ... */ };
  
    const styles = {
        pageContainer: { padding: '0 2rem', backgroundColor: '#121212', color: '#fff', fontFamily: '"Inter", sans-serif', overflowY: 'auto', height: '100vh', paddingBottom: '100px' },
        heroSection: { display: 'flex', alignItems: 'flex-end', gap: '1.5rem', padding: '4rem 2rem 2rem 2rem', marginBottom: '2rem', borderRadius: '12px', background: `linear-gradient(to top, #121212 10%, transparent 100%), url(https://images.unsplash.com/photo-1510915361894-db8b60106f34?q=80&w=2070&auto=format&fit=crop)`, backgroundSize: 'cover', backgroundPosition: 'center', height: '340px' },
        heroInfo: {},
        heroTitle: { fontSize: '4rem', fontWeight: '800', margin: '0 0 0.5rem 0', textShadow: '0 2px 10px rgba(0,0,0,0.5)' },
        heroDesc: { fontSize: '1rem', color: '#e0e0e0', margin: 0 },
        formContainer: { backgroundColor: '#282828', padding: '2rem', borderRadius: '12px', marginBottom: '2rem' },
        formGroup: { marginBottom: '1rem' },
        input: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#333', color: '#fff', fontSize: '1rem' },
        button: { backgroundColor: '#8B5CF6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', transition: 'background-color 0.2s' },
        message: { padding: '10px', borderRadius: '5px', marginTop: '10px', fontSize: '0.9rem' },
        successMessage: { backgroundColor: '#d4edda', color: '#155724' },
        errorMessage: { backgroundColor: '#f8d7da', color: '#721c24' },
    };
  
    return ( <div style={styles.pageContainer}> {/* ... JSX completo da PlaylistsPage aqui ... */} </div> );
};


// --- PÁGINA DE HISTÓRICO ---
const HistoricoPage = () => {
    const summaryData = { totalSessions: 12, timeInApp: "3 meses", mainTherapist: "Dr. Carlos Mendes", };
    const pastSessions = [ { id: 1, date: "18 de Julho, 2025", therapistName: "Dr. Carlos Mendes", therapistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1374&auto=format&fit=crop", status: "Realizada", notes: "Paciente demonstrou grande avanço na expressão emocional. A playlist 'Calma Interior' foi particularmente eficaz. Recomenda-se focar em exercícios de ritmo na próxima sessão." }, { id: 2, date: "11 de Julho, 2025", therapistName: "Dr. Carlos Mendes", therapistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1374&auto=format&fit=crop", status: "Realizada", notes: "Sessão focada em técnicas de respiração sincronizada com sons de baixa frequência. Paciente reportou uma diminuição significativa nos níveis de ansiedade após a sessão." }, { id: 3, date: "02 de Julho, 2025", therapistName: "Dra. Sofia Ribeiro", therapistAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop", status: "Realizada", notes: "Introdução a instrumentos de percussão para canalizar energia. Paciente mostrou-se receptivo e engajado. Próximo passo é a composição de pequenas melodias." }, { id: 4, date: "25 de Junho, 2025", therapistName: "Dr. Carlos Mendes", therapistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1374&auto=format&fit=crop", status: "Realizada", notes: "Primeira sessão de avaliação. Histórico e objetivos foram discutidos. Paciente busca gerenciar o estresse do dia-a-dia." }, ];
    const [expandedSessionId, setExpandedSessionId] = useState(null);
    const toggleNotes = (sessionId) => { setExpandedSessionId(expandedSessionId === sessionId ? null : sessionId); };
    const styles = { /* ... estilos ... */ };
    return ( <div> {/* ... JSX completo da HistoricoPage aqui ... */} </div> );
};


// --- PÁGINA DE PERFIL ---
const ProfilePage = ({ onLogout }) => {
    const [userData, setUserData] = useState({ name: "Ana Oliveira", email: "ana.oliveira@email.com", phone: "+55 11 98765-4321", memberSince: "Março, 2025", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop", plan: "Plano Premium Mensal", });
    const [activeView, setActiveView] = useState('main');
    const MainProfileView = () => ( <div> {/* ... */} </div> );
    const EditInfoView = () => ( <div> {/* ... */} </div> );
    const ChangePasswordView = () => ( <div> {/* ... */} </div> );
    const ManageSubscriptionView = () => { /* ... */ return ( <div> {/* ... */} </div> ); };
    const renderActiveView = () => { /* ... */ };
    const styles = { /* ... estilos ... */ };
    return ( <div> {/* ... JSX completo da ProfilePage aqui ... */} </div> );
};


// --- COMPONENTE PRINCIPAL APP ---
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setIsLoggedIn(true);
        setUser(currentUser);
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setCurrentPage('home');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
      setIsLoggedIn(false);
      setCurrentPage('home');
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage setActivePage={setCurrentPage} />;
      case 'agendamentos': return <AgendamentosPage user={user} />;
      case 'playlists': return <PlaylistsPage user={user} />;
      case 'historico': return <HistoricoPage />;
      case 'perfil': return <ProfilePage onLogout={handleLogout} />;
      default: return <HomePage setActivePage={setCurrentPage} />;
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar activePage={currentPage} setActivePage={setCurrentPage} onLogout={handleLogout} />
      <main style={{ flexGrow: 1, backgroundColor: '#F9FAFB', overflowY: 'auto' }}>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;