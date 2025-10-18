// src/components/patient/NextSessionCard.js
import React, { useEffect, useMemo, useState } from 'react';
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

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

const styles = {
  card: {
    marginTop: '1.5rem',
    background: '#6D28D9',
    color: '#fff',
    borderRadius: 20,
    padding: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  infoBlock: { flex: '1 1 240px' },
  title: { margin: 0, fontWeight: 700, opacity: 0.9, fontSize: '1rem' },
  date: {
    margin: '0.5rem 0 0 0',
    fontSize: '2.1rem',
    fontWeight: 800,
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
  subtitle: { margin: '0.35rem 0 0 0', opacity: 0.9 },
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
  },
  secondaryButton: {
    background: '#fff',
    color: '#6D28D9',
    border: '1px solid #fff',
    padding: '10px 18px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
  },
  emptyState: {
    marginTop: '0.85rem',
    opacity: 0.9,
  },
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
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe;

    if (!patientId) {
      setSession(null);
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
        limit(1),
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

          setSession(snapshot.docs[0]?.data() ?? null);
          setLoading(false);
        },
        (err) => {
          if (!isMounted) {
            return;
          }

          console.error('[NextSessionCard] Listener error', err);
          setError(err);
          setSession(null);
          setLoading(false);
        },
      );
    } catch (listenerError) {
      console.error('[NextSessionCard] Failed to create listener', listenerError);
      if (isMounted) {
        setError(listenerError);
        setSession(null);
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

  const formattedDate = useMemo(() => {
    const startSource = session?.startTime ?? session?.slotStartsAt;
    if (!startSource) return '';
    const startDate =
      typeof startSource?.toDate === 'function'
        ? startSource.toDate()
        : new Date(startSource);
    return dateFormatter.format(startDate);
  }, [session?.startTime]);

  const therapistName = session?.therapistName || 'Profissional';
  const modality = session?.mode || session?.modality || 'A definir';
  const showSessionActions = !loading && !error && !!session;
  const showScheduleAction = !loading && !error && !session;

  const manualRefresh = () => {
    console.info('[NextSessionCard] Manual refresh triggered', { patientId });
    setRefreshToken((prev) => prev + 1);
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
      onSessionChange(session);
    }
  }, [session, onSessionChange]);

  return (
    <div style={styles.card}>
      <div style={styles.infoBlock}>
        <p style={styles.title}>Sua Proxima Sessao</p>

        {loading && <p style={styles.subtitle}>Carregando informacoes...</p>}

        {error && <p style={styles.subtitle}>{renderErrorMessage()}</p>}

        {!loading && !error && session && (
          <>
            <h2 style={styles.date}>{formattedDate}</h2>
            <p style={styles.subtitle}>
              com {therapistName} - {modality}
            </p>
          </>
        )}

        {!loading && !error && !session && (
          <p style={styles.emptyState}>Nenhuma sessao futura</p>
        )}
      </div>

      <div style={styles.buttonRow}>
        {showSessionActions && (
          <>
            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => {
                if (typeof onViewDetails === 'function') {
                  onViewDetails(session);
                }
              }}
            >
              Ver detalhes
            </button>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={onOpenAgenda}
            >
              Abrir agenda
            </button>
          </>
        )}

        {showScheduleAction && (
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={onSchedule}
          >
            Agendar agora
          </button>
        )}

        {!loading && error && (
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={onOpenAgenda}
          >
            Abrir agenda
          </button>
        )}

        {enableManualRefresh && (
          <button
            type="button"
            style={styles.primaryButton}
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
