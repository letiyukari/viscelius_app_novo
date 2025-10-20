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
  card: {
    marginTop: '1.5rem',
    borderRadius: 20,
    padding: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1.5rem',
    flexWrap: 'wrap',
    transition: 'background 0.3s ease, color 0.3s ease',
  },
  infoBlock: { flex: '1 1 240px' },
  title: {
    margin: 0,
    fontWeight: 700,
    fontSize: '1rem',
    letterSpacing: '0.02em',
  },
  date: {
    margin: '0.5rem 0 0 0',
    fontSize: '2.1rem',
    fontWeight: 800,
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
  subtitle: { margin: '0.35rem 0 0 0' },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    marginTop: '0.75rem',
    padding: '0.35rem 0.75rem',
    borderRadius: 999,
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  statusMessage: {
    margin: '0.75rem 0 0 0',
    fontWeight: 600,
    lineHeight: 1.4,
    maxWidth: 420,
  },
  buttonRow: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  primaryButton: {
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.25)',
    color: '#fff',
    padding: '10px 18px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'background 0.3s ease, color 0.3s ease, border-color 0.3s ease',
  },
  secondaryButton: {
    background: '#fff',
    color: '#6D28D9',
    border: '1px solid #fff',
    padding: '10px 18px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'background 0.3s ease, color 0.3s ease, border-color 0.3s ease',
  },
  emptyState: {
    marginTop: '0.85rem',
    opacity: 0.9,
  },
  navControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    marginTop: '1rem',
    flexWrap: 'wrap',
  },
  navIndicator: {
    fontSize: '0.85rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
  },
  navButton: {
    background: 'rgba(255,255,255,0.18)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: '#FFFFFF',
    padding: '8px 16px',
    borderRadius: 999,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem',
    transition: 'opacity 0.2s ease, transform 0.2s ease',
  },
};

const defaultTheme = {
  background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
  textColor: '#FFFFFF',
  titleColor: 'rgba(255,255,255,0.85)',
  subtitleColor: 'rgba(255,255,255,0.9)',
  messageColor: '#FFFFFF',
  badgeBackground: 'rgba(255,255,255,0.18)',
  badgeColor: '#FFFFFF',
  primaryButton: {
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.25)',
    color: '#FFFFFF',
  },
  secondaryButton: {
    background: '#FFFFFF',
    border: '1px solid #FFFFFF',
    color: '#6D28D9',
  },
  navButton: {
    background: 'rgba(255,255,255,0.18)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: '#FFFFFF',
  },
  navIndicatorColor: 'rgba(255,255,255,0.9)',
};

const STATUS_THEMES = {
  default: defaultTheme,
  confirmed: {
    ...defaultTheme,
    background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
  },
  pending: {
    background: 'linear-gradient(135deg, #FDE68A, #F59E0B)',
    textColor: '#422006',
    titleColor: 'rgba(66, 32, 6, 0.8)',
    subtitleColor: 'rgba(66, 32, 6, 0.9)',
    messageColor: '#422006',
    badgeBackground: 'rgba(255, 255, 255, 0.75)',
    badgeColor: '#422006',
    primaryButton: {
      background: 'rgba(255,255,255,0.65)',
      border: '1px solid rgba(255,255,255,0.85)',
      color: '#92400E',
    },
    secondaryButton: {
      background: '#FFFFFF',
      border: '1px solid rgba(146, 64, 14, 0.35)',
      color: '#92400E',
    },
    navButton: {
      background: 'rgba(255,255,255,0.75)',
      border: '1px solid rgba(146, 64, 14, 0.35)',
      color: '#92400E',
    },
    navIndicatorColor: '#7C2D12',
  },
  canceled: {
    background: 'linear-gradient(135deg, #FCA5A5, #EF4444)',
    textColor: '#FFFFFF',
    titleColor: 'rgba(255,255,255,0.9)',
    subtitleColor: 'rgba(255,255,255,0.92)',
    messageColor: '#FFFFFF',
    badgeBackground: 'rgba(255,255,255,0.2)',
    badgeColor: '#FFFFFF',
    primaryButton: {
      background: 'rgba(255,255,255,0.2)',
      border: '1px solid rgba(255,255,255,0.3)',
      color: '#FFFFFF',
    },
    secondaryButton: {
      background: '#FFFFFF',
      border: '1px solid #FFFFFF',
      color: '#B91C1C',
    },
    navButton: {
      background: 'rgba(255,255,255,0.2)',
      border: '1px solid rgba(255,255,255,0.32)',
      color: '#FFFFFF',
    },
    navIndicatorColor: 'rgba(255,255,255,0.92)',
  },
  declined: {
    background: 'linear-gradient(135deg, #F28B82, #DC2626)',
    textColor: '#FFFFFF',
    titleColor: 'rgba(255,255,255,0.9)',
    subtitleColor: 'rgba(255,255,255,0.92)',
    messageColor: '#FFFFFF',
    badgeBackground: 'rgba(255,255,255,0.22)',
    badgeColor: '#FFFFFF',
    primaryButton: {
      background: 'rgba(255,255,255,0.2)',
      border: '1px solid rgba(255,255,255,0.32)',
      color: '#FFFFFF',
    },
    secondaryButton: {
      background: '#FFFFFF',
      border: '1px solid #FFFFFF',
      color: '#B91C1C',
    },
    navButton: {
      background: 'rgba(255,255,255,0.2)',
      border: '1px solid rgba(255,255,255,0.32)',
      color: '#FFFFFF',
    },
    navIndicatorColor: 'rgba(255,255,255,0.92)',
  },
  completed: {
    background: 'linear-gradient(135deg, #34D399, #059669)',
    textColor: '#FFFFFF',
    titleColor: 'rgba(255,255,255,0.9)',
    subtitleColor: 'rgba(255,255,255,0.92)',
    messageColor: '#FFFFFF',
    badgeBackground: 'rgba(255,255,255,0.22)',
    badgeColor: '#FFFFFF',
    primaryButton: {
      background: 'rgba(255,255,255,0.2)',
      border: '1px solid rgba(255,255,255,0.32)',
      color: '#FFFFFF',
    },
    secondaryButton: {
      background: '#FFFFFF',
      border: '1px solid #FFFFFF',
      color: '#047857',
    },
    navButton: {
      background: 'rgba(255,255,255,0.2)',
      border: '1px solid rgba(255,255,255,0.32)',
      color: '#FFFFFF',
    },
    navIndicatorColor: 'rgba(255,255,255,0.92)',
  },
};

const STATUS_ALIASES = {
  cancelled: 'canceled',
  cancelada: 'canceled',
  cancelado: 'canceled',
  rejection: 'declined',
  rejected: 'declined',
  rejeitada: 'declined',
  rejeitado: 'declined',
};

function normalizeStatus(rawStatus) {
  const value =
    typeof rawStatus === 'string' ? rawStatus.toLowerCase() : '';
  if (!value) return '';
  return STATUS_ALIASES[value] || value;
}

function getStatusTheme(status) {
  return STATUS_THEMES[status] || STATUS_THEMES.default;
}

function createThemedStyles(theme) {
  return {
    card: {
      ...styles.card,
      background: theme.background,
      color: theme.textColor,
    },
    title: {
      ...styles.title,
      color: theme.titleColor,
    },
    date: {
      ...styles.date,
      color: theme.textColor,
    },
    subtitle: {
      ...styles.subtitle,
      color: theme.subtitleColor,
    },
    statusBadge: {
      ...styles.statusBadge,
      background: theme.badgeBackground,
      color: theme.badgeColor,
    },
    statusMessage: {
      ...styles.statusMessage,
      color: theme.messageColor,
    },
    primaryButton: {
      ...styles.primaryButton,
      ...(theme.primaryButton || {}),
    },
    secondaryButton: {
      ...styles.secondaryButton,
      ...(theme.secondaryButton || {}),
    },
    emptyState: {
      ...styles.emptyState,
      color: theme.subtitleColor,
    },
    navControls: {
      ...styles.navControls,
    },
    navIndicator: {
      ...styles.navIndicator,
      color: theme.navIndicatorColor || theme.subtitleColor,
    },
    navButton: {
      ...styles.navButton,
      ...(theme.navButton || theme.primaryButton || {}),
    },
  };
}

const ensureEndingPeriod = (value) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

const toStringValue = (value) => {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    const candidate =
      value.displayName ||
      value.name ||
      value.fullName ||
      value.label ||
      value.title;
    return typeof candidate === 'string' ? candidate.trim() : '';
  }
  return '';
};

const firstNonEmpty = (...candidates) => {
  for (const candidate of candidates) {
    const normalized = toStringValue(candidate);
    if (normalized) {
      return normalized;
    }
  }
  return '';
};

const resolveCancellationActor = (session) => {
  if (!session) return '';
  const actor = firstNonEmpty(
    session.canceledBy,
    session.cancelledBy,
    session.cancellation?.actor,
    session.cancellation?.actorType,
    session.cancellation?.by,
    session.cancellation?.performedBy,
    session.cancellation?.who,
    session.lastStatusActor,
    session.lastStatusActorRole,
    session.updatedByRole
  );
  if (!actor) return '';
  const normalized = actor.toLowerCase();
  if (['patient', 'paciente', 'client', 'cliente', 'user', 'pacient'].includes(normalized)) {
    return 'Cancelada pelo paciente.';
  }
  if (
    ['therapist', 'profissional', 'musicoterapeuta', 'professional', 'provider'].includes(normalized)
  ) {
    return 'Cancelada pelo profissional.';
  }
  return ensureEndingPeriod(`Cancelada por ${actor}`);
};

const resolveCancellationDetail = (session) => {
  if (!session) return 'Cancelada.';
  const actorSentence = resolveCancellationActor(session);
  const reason = firstNonEmpty(
    session.cancellationReason,
    session.cancelReason,
    session.reason,
    session.statusReason,
    session.notes,
    session.observation,
    session.observations,
    session.cancellation?.reason,
    session.cancellation?.detail,
    session.cancellation?.message
  );
  const reasonSentence = reason ? ensureEndingPeriod(`Motivo: ${reason}`) : '';
  const pieces = [actorSentence || 'Cancelada.', reasonSentence];
  return pieces
    .map((part) => (part || '').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+([.!?])/g, '$1');
};

const resolveDeclineDetail = (session) => {
  const reason = firstNonEmpty(
    session?.declineReason,
    session?.statusReason,
    session?.notes,
    session?.observation,
    session?.observations,
    session?.cancellation?.reason,
    session?.cancellation?.detail
  );
  if (reason) {
    return ensureEndingPeriod(
      `Infelizmente o profissional nao podera atende-lo nessa data. Motivo: ${reason}`
    );
  }
  return 'Infelizmente o profissional nao podera atende-lo nessa data.';
};

const resolveStatusCopy = (status, session) => {
  switch (status) {
    case 'pending':
      return {
        badge: 'Solicitacao pendente',
        description: 'Solicitacao pendente. O musicoterapeuta precisa confirmar.',
      };
    case 'confirmed':
      return {
        badge: 'Sessao confirmada',
        description: 'Sua sessao foi confirmada pelo musicoterapeuta.',
      };
    case 'canceled':
      return {
        badge: 'Sessao cancelada',
        description: resolveCancellationDetail(session),
      };
    case 'declined':
      return {
        badge: 'Solicitacao rejeitada',
        description: resolveDeclineDetail(session),
      };
    case 'completed':
      return {
        badge: 'Sessao finalizada',
        description: 'Sua sessao ja foi realizada. Consulte o historico para mais detalhes.',
      };
    default:
      return {
        badge: session ? 'Sessao agendada' : '',
        description: session ? 'Aguardando atualizacoes sobre o seu agendamento.' : '',
      };
  }
};

const resolveTherapistCandidate = (session) => {
  if (!session) return '';
  return firstNonEmpty(
    session.therapistDisplayName,
    session.therapistName,
    session.therapist?.displayName,
    session.therapist?.name,
    session.therapistProfile?.displayName,
    session.therapistProfile?.name,
    session.therapistLabel?.name,
    session.professionalName,
    session.professional?.displayName,
    session.professional?.name
  );
};

const resolveModalityLabel = (session) => {
  if (!session) return '';
  const raw = toStringValue(session.mode || session.modality).toLowerCase();
  if (raw === 'online') return 'Online';
  if (raw === 'presencial') return 'Presencial';
  if (session.isOnline === true) return 'Online';
  if (session.isOnline === false) return 'Presencial';
  if (session.address || session.location) return 'Presencial';
  return 'Modalidade a definir';
};

/**
 * Exibe a proxima sessao agendada do paciente em tempo real.
 */
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
      setSessions([]);
      setCurrentIndex(0);
      setError(null);
      setLoading(false);
      return undefined;
    }

    const now = Timestamp.now();
    console.info('[NextSessionCard] Subscribing to next session', {
      patientId,
      nowIso: now.toDate().toISOString(),
      refreshToken,
      statusFilter,
    });

    setLoading(true);
    setError(null);

    try {
      const constraints = [where('patientId', '==', patientId)];
      if (statusFilter) {
        constraints.push(where('status', '==', statusFilter));
      }
      constraints.push(
        where('startTime', '>', now),
        orderBy('startTime', 'asc'),
        limit(MAX_SESSIONS),
      );

      const nextSessionQuery = query(
        collection(db, 'appointments'),
        ...constraints,
      );

      unsubscribe = onSnapshot(
        nextSessionQuery,
        (snapshot) => {
          if (!isMounted) {
            return;
          }

          console.info('[NextSessionCard] Snapshot received', {
            patientId,
            size: snapshot.size,
            fromCache: snapshot.metadata.fromCache,
          });

          const nextSessions = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          const previousId = currentSessionIdRef.current;
          const foundIndex =
            previousId && nextSessions.length > 0
              ? nextSessions.findIndex((item) => item.id === previousId)
              : -1;
          setSessions(nextSessions);
          setCurrentIndex(() => {
            if (foundIndex >= 0) {
              return foundIndex;
            }
            return 0;
          });
          setLoading(false);
        },
        (err) => {
          if (!isMounted) {
            return;
          }

          console.error('[NextSessionCard] Listener error', err);
          setError(err);
          setSessions([]);
          setCurrentIndex(0);
          setLoading(false);
        },
      );
    } catch (listenerError) {
      console.error('[NextSessionCard] Failed to create listener', listenerError);
      if (isMounted) {
        setError(listenerError);
        setSessions([]);
        setCurrentIndex(0);
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [patientId, refreshToken, statusFilter]);

  useEffect(() => {
    if (!currentSession) {
      setTherapistDisplayName('');
      return undefined;
    }

    const localName = resolveTherapistCandidate(currentSession);
    if (localName) {
      setTherapistDisplayName(localName);
      return undefined;
    }

    if (!currentSession.therapistId) {
      setTherapistDisplayName('Profissional');
      return undefined;
    }

    let active = true;

    getUserProfile(currentSession.therapistId)
      .then((profile) => {
        if (!active) return;
        const profileName = firstNonEmpty(
          profile?.displayName,
          profile?.name,
          profile?.fullName,
        );
        setTherapistDisplayName(profileName || 'Profissional');
      })
      .catch((fetchError) => {
        console.error('[NextSessionCard] Falha ao carregar terapeuta da sessao', fetchError);
        if (active) {
          setTherapistDisplayName('Profissional');
        }
      });

    return () => {
      active = false;
    };
  }, [currentSession]);

  const formattedDate = useMemo(() => {
    const startSource = currentSession?.startTime ?? currentSession?.slotStartsAt;
    if (!startSource) return '';
    const startDate =
      typeof startSource?.toDate === 'function'
        ? startSource.toDate()
        : new Date(startSource);
    return dateFormatter.format(startDate);
  }, [currentSession?.startTime, currentSession?.slotStartsAt]);

  const normalizedStatus = useMemo(() => {
    if (!currentSession) return 'default';
    const normalized = normalizeStatus(currentSession.status);
    return normalized || 'pending';
  }, [currentSession]);

  const theme = useMemo(() => getStatusTheme(normalizedStatus), [normalizedStatus]);
  const themedStyles = useMemo(() => createThemedStyles(theme), [theme]);
  const statusCopy = useMemo(
    () => resolveStatusCopy(normalizedStatus, currentSession),
    [normalizedStatus, currentSession],
  );

  const modalityLabel = useMemo(() => resolveModalityLabel(currentSession), [currentSession]);
  const therapistLine = useMemo(() => {
    if (!currentSession) return '';
    const baseName = therapistDisplayName || 'Profissional';
    if (!modalityLabel) return baseName;
    return `${baseName} - ${modalityLabel}`;
  }, [currentSession, therapistDisplayName, modalityLabel]);

  const hasSession = !loading && !error && !!currentSession;
  const hasPrevious = hasSession && currentIndex > 0;
  const hasNext = hasSession && currentIndex < totalSessions - 1;
  const showSessionActions = hasSession;
  const showScheduleAction = !loading && !error && !currentSession;
  const showStatusBadge = hasSession && Boolean(statusCopy.badge);

  const manualRefresh = () => {
    console.info('[NextSessionCard] Manual refresh triggered', { patientId });
    setRefreshToken((prev) => prev + 1);
    setCurrentIndex(0);
  };

  const renderErrorMessage = () => {
    if (!error) return null;
    if (error.code === 'permission-denied') {
      return 'Permissoes insuficientes para ler seus agendamentos.';
    }
    if (error.code === 'failed-precondition') {
      return `E necessario criar um indice para essa consulta. Detalhes: ${error.message}`;
    }
    return `Nao foi possivel carregar sua sessao. Detalhes: ${error.message}`;
  };

  useEffect(() => {
    if (typeof onSessionChange === 'function') {
      onSessionChange(currentSession);
    }
  }, [currentSession, onSessionChange]);

  useEffect(() => {
    currentSessionIdRef.current = currentSession?.id ?? null;
  }, [currentSession?.id]);

  return (
    <div style={themedStyles.card}>
      <div style={styles.infoBlock}>
        <p style={themedStyles.title}>Informações da sessão</p>

        {showStatusBadge && (
          <span style={themedStyles.statusBadge}>{statusCopy.badge}</span>
        )}

        {loading && <p style={themedStyles.subtitle}>Carregando informacoes...</p>}

        {error && <p style={themedStyles.subtitle}>{renderErrorMessage()}</p>}

        {hasSession && (
          <>
            <h2 style={themedStyles.date}>{formattedDate}</h2>
            <p style={themedStyles.subtitle}>
              com {therapistLine || 'Profissional'}
            </p>
            {statusCopy.description && (
              <p style={themedStyles.statusMessage}>{statusCopy.description}</p>
            )}
          </>
        )}

        {hasSession && totalSessions > 1 && (
          <div style={themedStyles.navControls}>
            {hasPrevious && (
              <button
                type="button"
                style={themedStyles.navButton}
                onClick={() => {
                  setCurrentIndex((prev) => (prev <= 0 ? 0 : prev - 1));
                }}
              >
                Sessao anterior
              </button>
            )}
            <span style={themedStyles.navIndicator}>
              Sessao {currentIndex + 1} de {totalSessions}
            </span>
            {hasNext && (
              <button
                type="button"
                style={themedStyles.navButton}
                onClick={() => {
                  setCurrentIndex((prev) => {
                    if (totalSessions === 0) return 0;
                    const limit = totalSessions - 1;
                    return prev >= limit ? limit : prev + 1;
                  });
                }}
              >
                Proxima sessao
              </button>
            )}
          </div>
        )}

        {!hasSession && !loading && !error && (
          <p style={themedStyles.emptyState}>Nenhuma sessao futura</p>
        )}
      </div>

      <div style={styles.buttonRow}>
        {showSessionActions && (
          <>
            <button
              type="button"
              style={themedStyles.primaryButton}
              onClick={() => {
                if (typeof onViewDetails === 'function') {
                  onViewDetails(currentSession);
                }
              }}
            >
              Ver detalhes
            </button>
            <button
              type="button"
              style={themedStyles.secondaryButton}
              onClick={onOpenAgenda}
            >
              Abrir agenda
            </button>
          </>
        )}

        {showScheduleAction && (
          <button
            type="button"
            style={themedStyles.secondaryButton}
            onClick={onSchedule}
          >
            Agendar agora
          </button>
        )}

        {!loading && error && (
          <button
            type="button"
            style={themedStyles.secondaryButton}
            onClick={onOpenAgenda}
          >
            Abrir agenda
          </button>
        )}

        {enableManualRefresh && (
          <button
            type="button"
            style={themedStyles.primaryButton}
            onClick={manualRefresh}
          >
            Recarregar
          </button>
        )}
      </div>
    </div>
  );
};

export default NextSessionCard;
