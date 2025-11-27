// src/components/patient/NextSessionCard.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { getUserProfile } from '../../services/usersService';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

const MAX_SESSIONS = 10;

const styles = {
  card: { marginTop: '1.5rem', borderRadius: 20, padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap', transition: 'background 0.3s ease, color 0.3s ease' },
  infoBlock: { flex: '1 1 240px' },
  title: { margin: 0, fontWeight: 700, fontSize: '1rem', letterSpacing: '0.02em' },
  date: { margin: '0.5rem 0 0 0', fontSize: '2.1rem', fontWeight: 800, letterSpacing: 0.2, textTransform: 'capitalize' },
  subtitle: { margin: '0.35rem 0 0 0' },
  statusBadge: { display: 'inline-flex', alignItems: 'center', marginTop: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' },
  statusMessage: { margin: '0.75rem 0 0 0', fontWeight: 600, lineHeight: 1.4, maxWidth: 420 },
  buttonRow: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  primaryButton: { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s ease' },
  secondaryButton: { background: '#fff', color: '#6D28D9', border: '1px solid #fff', padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s ease' },
  emptyState: { marginTop: '0.85rem', opacity: 0.9 },
  navControls: { display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '1rem', flexWrap: 'wrap' },
  navIndicator: { fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.04em' },
  navButton: { background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', color: '#FFFFFF', padding: '8px 16px', borderRadius: 999, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'opacity 0.2s ease, transform 0.2s ease' },
};

const defaultTheme = {
  background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
  textColor: '#FFFFFF',
  titleColor: 'rgba(255,255,255,0.85)',
  subtitleColor: 'rgba(255,255,255,0.9)',
  messageColor: '#FFFFFF',
  badgeBackground: 'rgba(255,255,255,0.18)',
  badgeColor: '#FFFFFF',
  primaryButton: { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#FFFFFF' },
  secondaryButton: { background: '#FFFFFF', border: '1px solid #FFFFFF', color: '#6D28D9' },
  navButton: { background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', color: '#FFFFFF' },
  navIndicatorColor: 'rgba(255,255,255,0.9)',
};

const STATUS_THEMES = {
    default: defaultTheme,
    confirmed: { ...defaultTheme, background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' },
    pending: {
      background: 'linear-gradient(135deg, #FDE68A, #F59E0B)',
      textColor: '#422006', titleColor: 'rgba(66, 32, 6, 0.8)', subtitleColor: 'rgba(66, 32, 6, 0.9)', messageColor: '#422006', badgeBackground: 'rgba(255, 255, 255, 0.75)', badgeColor: '#422006',
      primaryButton: { background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.85)', color: '#92400E' },
      secondaryButton: { background: '#FFFFFF', border: '1px solid rgba(146, 64, 14, 0.35)', color: '#92400E' },
      navButton: { background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(146, 64, 14, 0.35)', color: '#92400E' },
      navIndicatorColor: '#7C2D12',
    },
    canceled: defaultTheme,
    declined: defaultTheme,
    completed: { ...defaultTheme, background: 'linear-gradient(135deg, #34D399, #059669)', secondaryButton: { background: '#FFFFFF', border: '1px solid #FFFFFF', color: '#047857' } },
};

const STATUS_ALIASES = { cancelled: 'canceled', cancelada: 'canceled', cancelado: 'canceled', rejection: 'declined', rejected: 'declined', rejeitada: 'declined', rejeitado: 'declined' };

function normalizeStatus(rawStatus) {
  const value = typeof rawStatus === 'string' ? rawStatus.toLowerCase() : '';
  if (!value) return '';
  return STATUS_ALIASES[value] || value;
}

function getStatusTheme(status) { return STATUS_THEMES[status] || STATUS_THEMES.default; }
function createThemedStyles(theme) {
  return {
    card: { ...styles.card, background: theme.background, color: theme.textColor },
    title: { ...styles.title, color: theme.titleColor },
    date: { ...styles.date, color: theme.textColor },
    subtitle: { ...styles.subtitle, color: theme.subtitleColor },
    statusBadge: { ...styles.statusBadge, background: theme.badgeBackground, color: theme.badgeColor },
    statusMessage: { ...styles.statusMessage, color: theme.messageColor },
    primaryButton: { ...styles.primaryButton, ...(theme.primaryButton || {}) },
    secondaryButton: { ...styles.secondaryButton, ...(theme.secondaryButton || {}) },
    emptyState: { ...styles.emptyState, color: theme.subtitleColor },
    navControls: { ...styles.navControls },
    navIndicator: { ...styles.navIndicator, color: theme.navIndicatorColor || theme.subtitleColor },
    navButton: { ...styles.navButton, ...(theme.navButton || theme.primaryButton || {}) },
  };
}

const resolveStatusCopy = (status, session) => {
  switch (status) {
    case 'pending': return { badge: 'Solicitacao pendente', description: 'Aguardando confirmacao do musicoterapeuta.' };
    case 'confirmed': return { badge: 'Sessao confirmada', description: 'Sua sessao foi confirmada.' };
    case 'completed': return { badge: 'Sessao finalizada', description: 'Sessao realizada.' };
    default: return { badge: session ? 'Sessao agendada' : '', description: session ? 'Aguardando atualizacoes.' : '' };
  }
};

const resolveTherapistCandidate = (session) => {
  if (!session) return '';
  return session.therapistDisplayName || session.therapistName || session.therapist?.displayName || 'Profissional';
};

const resolveModalityLabel = (session) => {
  if (!session) return '';
  if (session.isOnline === true) return 'Online';
  return 'Presencial';
};

const NextSessionCard = ({
  patientId,
  onViewDetails,
  onOpenAgenda,
  onSchedule,
  enableManualRefresh = false,
  statusFilter,
  onSessionChange,
}) => {
  const [sessions, setSessions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [therapistDisplayName, setTherapistDisplayName] = useState('');
  const currentSessionIdRef = useRef(null);
  const currentSession = sessions[currentIndex] || null;
  const totalSessions = sessions.length;

  useEffect(() => {
    let isMounted = true;
    let unsubscribe;

    if (!patientId) {
      setSessions([]); setCurrentIndex(0); setError(null); setLoading(false); return;
    }

    const now = Timestamp.now();
    setLoading(true); setError(null);

    try {
      const constraints = [
          where('patientId', '==', patientId),
          where('startTime', '>', now),
          orderBy('startTime', 'asc'),
          limit(20),
      ];

      const nextSessionQuery = query(collection(db, 'appointments'), ...constraints);

      unsubscribe = onSnapshot(nextSessionQuery, (snapshot) => {
          if (!isMounted) return;

          // FILTRO DE SESSÕES CANCELADAS/RECUSADAS
          const nextSessions = snapshot.docs
            .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
            .filter(s => {
                const st = normalizeStatus(s.status);
                return st !== 'canceled' && st !== 'declined';
            });

          setSessions(nextSessions);
          setCurrentIndex(0);
          setLoading(false);
        },
        (err) => {
          if (!isMounted) return;
          console.error('[NextSessionCard] Error', err);
          setError(err); setSessions([]); setLoading(false);
        }
      );
    } catch (listenerError) {
      if (isMounted) { setError(listenerError); setSessions([]); setLoading(false); }
    }

    return () => { isMounted = false; if (unsubscribe) unsubscribe(); };
  }, [patientId, refreshToken]);

  useEffect(() => {
    if (!currentSession) { setTherapistDisplayName(''); return; }
    const localName = resolveTherapistCandidate(currentSession);
    if (localName) { setTherapistDisplayName(localName); return; }
    if (!currentSession.therapistId) { setTherapistDisplayName('Profissional'); return; }

    let active = true;
    getUserProfile(currentSession.therapistId).then((profile) => {
        if (!active) return;
        setTherapistDisplayName(profile?.displayName || 'Profissional');
    }).catch(() => { if(active) setTherapistDisplayName('Profissional'); });
    return () => { active = false; };
  }, [currentSession]);

  const formattedDate = useMemo(() => {
    const startSource = currentSession?.startTime ?? currentSession?.slotStartsAt;
    if (!startSource) return '';
    const startDate = typeof startSource?.toDate === 'function' ? startSource.toDate() : new Date(startSource);
    return dateFormatter.format(startDate);
  }, [currentSession]);

  const normalizedStatus = useMemo(() => {
    if (!currentSession) return 'default';
    return normalizeStatus(currentSession.status) || 'pending';
  }, [currentSession]);

  const theme = useMemo(() => getStatusTheme(normalizedStatus), [normalizedStatus]);
  const themedStyles = useMemo(() => createThemedStyles(theme), [theme]);
  const statusCopy = useMemo(() => resolveStatusCopy(normalizedStatus, currentSession), [normalizedStatus, currentSession]);
  const modalityLabel = useMemo(() => resolveModalityLabel(currentSession), [currentSession]);
  
  const therapistLine = useMemo(() => {
    if (!currentSession) return '';
    const baseName = therapistDisplayName || 'Profissional';
    return `${baseName} - ${modalityLabel}`;
  }, [currentSession, therapistDisplayName, modalityLabel]);

  const hasSession = !loading && !error && !!currentSession;
  const hasPrevious = hasSession && currentIndex > 0;
  const hasNext = hasSession && currentIndex < totalSessions - 1;

  useEffect(() => { if (typeof onSessionChange === 'function') onSessionChange(currentSession); }, [currentSession, onSessionChange]);
  useEffect(() => { currentSessionIdRef.current = currentSession?.id ?? null; }, [currentSession?.id]);

  const renderErrorMessage = () => {
      if(error?.code === 'failed-precondition') return "Erro de índice no Firestore.";
      return "Não foi possível carregar.";
  };

  const manualRefresh = () => {
    setRefreshToken(p => p + 1);
    setCurrentIndex(0);
  };

  return (
    <div style={themedStyles.card}>
      <div style={styles.infoBlock}>
        <p style={themedStyles.title}>Informações da sessão</p>
        {hasSession && statusCopy.badge && <span style={themedStyles.statusBadge}>{statusCopy.badge}</span>}
        
        {loading && <p style={themedStyles.subtitle}>Carregando...</p>}
        {error && <p style={themedStyles.subtitle}>{renderErrorMessage()}</p>}

        {hasSession && (
          <>
            <h2 style={themedStyles.date}>{formattedDate}</h2>
            <p style={themedStyles.subtitle}>com {therapistLine}</p>
            {statusCopy.description && <p style={themedStyles.statusMessage}>{statusCopy.description}</p>}
          </>
        )}

        {hasSession && totalSessions > 1 && (
          <div style={themedStyles.navControls}>
            {hasPrevious && (
              <button type="button" style={themedStyles.navButton} onClick={() => setCurrentIndex(p => p - 1)}>Anterior</button>
            )}
            <span style={themedStyles.navIndicator}>{currentIndex + 1} de {totalSessions}</span>
            {hasNext && (
              <button type="button" style={themedStyles.navButton} onClick={() => setCurrentIndex(p => p + 1)}>Próxima</button>
            )}
          </div>
        )}

        {!hasSession && !loading && !error && <p style={themedStyles.emptyState}>Nenhuma sessão agendada</p>}
      </div>

      <div style={styles.buttonRow}>
        {hasSession && (
          <>
            <button type="button" style={themedStyles.primaryButton} onClick={() => onViewDetails && onViewDetails(currentSession)}>Ver detalhes</button>
            <button type="button" style={themedStyles.secondaryButton} onClick={onOpenAgenda}>Abrir agenda</button>
          </>
        )}
        {!hasSession && !loading && (
            <button type="button" style={themedStyles.secondaryButton} onClick={onSchedule}>Agendar agora</button>
        )}
      </div>
    </div>
  );
};

export default NextSessionCard;