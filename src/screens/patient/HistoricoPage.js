// src/screens/patient/HistoricoPage.js
import React, { useEffect, useMemo, useState } from "react";
import {
  AwardIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  UserCheckIcon,
  VideoIcon,
} from "../../common/Icons";
import { subscribePatientConsultations } from "../../services/consultations";
import { getMultipleUserProfiles, resolveTherapistLabel } from "../../services/usersService";

const sessionStatusMeta = {
  completed: { label: "Realizada", background: "#E8F5E9", color: "#2E7D32" },
  scheduled: { label: "Agendada", background: "#DBEAFE", color: "#1D4ED8" },
  in_progress: { label: "Em andamento", background: "#FEF3C7", color: "#B45309" },
  canceled: { label: "Cancelada", background: "#FEE2E2", color: "#B91C1C" },
};

const emptyStatusMeta = { label: "Sem status", background: "#E5E7EB", color: "#374151" };

function getStatusMeta(status) {
  const key = String(status || "").toLowerCase();
  return sessionStatusMeta[key] || emptyStatusMeta;
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function formatDateWithWeekday(value) {
  const date = toDate(value);
  if (!date) return "--/--/----";
  try {
    const formatter = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      weekday: "long",
    });
    return formatter.format(date);
  } catch (error) {
    console.error("formatDateWithWeekday", error);
    return date.toISOString().slice(0, 10);
  }
}

function formatTimeRange(start, end) {
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (!startDate || !endDate) return "--:--";
  try {
    const formatter = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${formatter.format(startDate)} • ${formatter.format(endDate)}`;
  } catch (error) {
    console.error("formatTimeRange", error);
    return `${startDate.toISOString().slice(11, 16)} • ${endDate.toISOString().slice(11, 16)}`;
  }
}

function calculateDurationMinutes(start, end) {
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (!startDate || !endDate) return 0;
  const minutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
  return Math.max(minutes, 0);
}

function normalizeResourceList(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item, index) => {
      if (!item) return null;
      if (typeof item === "string") {
        return { label: item, url: null, key: `${item}-${index}` };
      }
      if (typeof item === "object") {
        const label = item.label || item.title || item.name || item.id || "";
        const url = item.url || item.link || item.href || null;
        if (!label && !url) return null;
        return { label: label || url, url, key: `${label}-${index}` };
      }
      return null;
    })
    .filter(Boolean);
}

function normalizeTasks(tasks = []) {
  return (Array.isArray(tasks) ? tasks : [])
    .map((task, index) => {
      if (!task) return null;
      if (typeof task === "string") return { label: task, key: `${task}-${index}` };
      if (typeof task === "object") {
        const label = task.label || task.title || task.name || "";
        if (!label) return null;
        const dueAt =
          task.dueAt || task.dueDate || task.reminderAt
            ? toDate(task.dueAt || task.dueDate || task.reminderAt)
            : null;
        return {
          label,
          dueAt,
          completed: Boolean(task.completed),
          key: `${label}-${index}`,
        };
      }
      return null;
    })
    .filter(Boolean);
}

function formatTextWithLinks(text) {
  if (!text) return null;
  const value = String(text);
  const regex = /(https?:\/\/[^\s]+)/gi;
  const parts = [];
  let lastIndex = 0;
  let match = regex.exec(value);
  while (match) {
    if (match.index > lastIndex) {
      parts.push(value.slice(lastIndex, match.index));
    }
    const url = match[0];
    parts.push(
      <a key={`${url}-${match.index}`} href={url} target="_blank" rel="noopener noreferrer" style={styles.inlineLink}>
        {url}
      </a>
    );
    lastIndex = match.index + url.length;
    match = regex.exec(value);
  }
  if (lastIndex < value.length) {
    parts.push(value.slice(lastIndex));
  }
  return parts.length > 0 ? parts : value;
}

const HistoricoPage = ({ user }) => {
  const patientId = user?.uid || null;
  const [consultations, setConsultations] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientId) return () => {};
    setLoading(true);
    setError(null);
    const unsubscribe = subscribePatientConsultations(
      patientId,
      (items) => {
        setConsultations(items || []);
        setLoading(false);
      },
      (err) => {
        console.error("subscribePatientConsultations", err);
        setError("Não foi possível carregar o histórico. Tente novamente mais tarde.");
        setLoading(false);
      }
    );
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [patientId]);

  useEffect(() => {
    const therapistIds = Array.from(
      new Set(
        consultations
          .map((item) => item?.therapistId)
          .filter((value) => typeof value === "string" && value.length > 0)
      )
    );
    if (therapistIds.length === 0) {
      setProfiles({});
      return;
    }
    let alive = true;
    getMultipleUserProfiles(therapistIds)
      .then((result) => {
        if (alive) setProfiles(result || {});
      })
      .catch((err) => console.error("getMultipleUserProfiles", err));
    return () => {
      alive = false;
    };
  }, [consultations]);

  const { upcomingSessions, completedSessions } = useMemo(() => {
    const upcoming = [];
    const completed = [];
    consultations.forEach((consultation) => {
      const status = String(consultation?.sessionStatus || consultation?.status || "").toLowerCase();
      if (status === "scheduled" || status === "in_progress") {
        upcoming.push(consultation);
      } else if (status === "completed") {
        completed.push(consultation);
      }
    });
    const sortDescByStart = (a, b) => {
      const aDate = toDate(a?.startsAt)?.getTime() || 0;
      const bDate = toDate(b?.startsAt)?.getTime() || 0;
      return bDate - aDate;
    };
    upcoming.sort(sortDescByStart);
    completed.sort(sortDescByStart);
    return { upcomingSessions: upcoming, completedSessions: completed };
  }, [consultations]);

  const summary = useMemo(() => {
    const totalSessions = completedSessions.length;
    const lastSession = completedSessions[0] || null;
    const lastSessionText = lastSession ? formatDateWithWeekday(lastSession.startsAt) : "Sem registro";

    const therapistCount = new Map();
    completedSessions.forEach((session) => {
      if (session?.therapistId) {
        therapistCount.set(session.therapistId, (therapistCount.get(session.therapistId) || 0) + 1);
      }
    });

    let topTherapistId = null;
    let topCount = 0;
    therapistCount.forEach((count, therapistId) => {
      if (count > topCount) {
        topCount = count;
        topTherapistId = therapistId;
      }
    });

    const therapistProfile = topTherapistId ? profiles[topTherapistId] : null;
    const therapistLabel = therapistProfile
      ? resolveTherapistLabel({ uid: topTherapistId, profile: therapistProfile })
      : null;

    return {
      totalSessions,
      lastSessionText,
      mainTherapist: therapistLabel?.name || "Ainda indefinido",
    };
  }, [completedSessions, profiles]);

  const toggleExpanded = (sessionId) => {
    setExpandedId((current) => (current === sessionId ? null : sessionId));
  };

  const renderTherapistAvatar = (session) => {
    const therapistId = session?.therapistId;
    if (!therapistId) return null;
    const profile = profiles[therapistId] || null;
    const photoUrl = profile?.photoURL || profile?.photoUrl || null;
    const label = resolveTherapistLabel({ uid: therapistId, profile });
    if (photoUrl) {
      return <img src={photoUrl} alt={label.name} style={styles.therapistAvatar} />;
    }
    const initials = label.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
    return (
      <div style={styles.therapistAvatarFallback}>
        <span>{initials || "PT"}</span>
      </div>
    );
  };

  const renderResources = (title, resources) => {
    const items = normalizeResourceList(resources);
    if (items.length === 0) return null;
    return (
      <div style={styles.resourceBlock}>
        <h4 style={styles.resourceTitle}>{title}</h4>
        <ul style={styles.resourceList}>
          {items.map((item) => (
            <li key={item.key} style={styles.resourceListItem}>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer" style={styles.resourceLink}>
                  {item.label}
                </a>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderTasks = (tasks) => {
    const normalized = normalizeTasks(tasks);
    if (normalized.length === 0) return null;
    return (
      <div style={styles.resourceBlock}>
        <h4 style={styles.resourceTitle}>Tarefas sugeridas</h4>
        <ul style={styles.resourceList}>
          {normalized.map((task) => (
            <li key={task.key} style={styles.resourceListItem}>
              <span>{task.label}</span>
              {task.dueAt && (
                <span style={styles.taskMeta}>
                  {new Intl.DateTimeFormat("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }).format(task.dueAt)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderNotesSection = (session) => {
    const meetingUrl = session?.meeting?.joinUrl || session?.meetingUrl || null;
    const hasNotes = Boolean(session?.summaryNotes && session.summaryNotes.trim().length > 0);
    const hasPlaylists = session?.resources?.playlists && session.resources.playlists.length > 0;
    const hasExercises = session?.resources?.exercises && session.resources.exercises.length > 0;
    const hasFiles = session?.resources?.files && session.resources.files.length > 0;
    const hasTasks = session?.followUp?.tasks && session.followUp.tasks.length > 0;
    const hasReminder = session?.followUp?.reminderAt;

    if (!hasNotes && !hasPlaylists && !hasExercises && !hasFiles && !hasTasks && !hasReminder && !meetingUrl) {
      return (
        <div style={styles.notesSection}>
          <p style={styles.emptyNotes}>Nenhum detalhe adicional registrado nesta sessão.</p>
        </div>
      );
    }

    return (
      <div style={styles.notesSection}>
        <h3 style={styles.notesTitle}>Resumo da sessão</h3>
        {meetingUrl ? (
          <div style={styles.meetingLinkBox}>
            <VideoIcon />
            <a href={meetingUrl} target="_blank" rel="noopener noreferrer" style={styles.inlineLink}>
              Acessar sala Jitsi
            </a>
          </div>
        ) : null}
        {hasNotes ? <p style={styles.notesText}>{formatTextWithLinks(session.summaryNotes)}</p> : null}
        {renderResources("Playlists indicadas", session?.resources?.playlists)}
        {renderResources("Exercícios e técnicas", session?.resources?.exercises)}
        {renderResources("Materiais de apoio", session?.resources?.files)}
        {renderTasks(session?.followUp?.tasks)}
        {hasReminder && (
          <div style={styles.reminderBox}>
            <ClockIcon />
            <span>Próxima revisão sugerida: {formatDateWithWeekday(session.followUp.reminderAt)}</span>
          </div>
        )}
      </div>
    );
  };

  const renderSessionCard = (session) => {
    const statusMeta = getStatusMeta(session?.sessionStatus || session?.status);
    const therapistId = session?.therapistId;
    const profile = therapistId ? profiles[therapistId] : null;
    const label = resolveTherapistLabel({ uid: therapistId, profile });
    const sessionId = session?.id;
    const isExpanded = expandedId === sessionId;
    const duration = calculateDurationMinutes(session?.startsAt, session?.endsAt);
    const meetingUrl = session?.meeting?.joinUrl || session?.meetingUrl || null;
    const showJoinButton =
      meetingUrl &&
      ["scheduled", "in_progress"].includes(String(session?.sessionStatus || "").toLowerCase());

    return (
      <div key={sessionId || session.startsAt} style={styles.sessionItem}>
        <div
          style={{
            ...styles.sessionCard,
            borderRadius: isExpanded ? "12px 12px 0 0" : "12px",
          }}
        >
          <div style={styles.sessionTherapistInfo}>
            {renderTherapistAvatar(session)}
            <div style={styles.sessionDetails}>
              <p style={styles.sessionDate}>{formatDateWithWeekday(session?.startsAt)}</p>
              <p style={styles.sessionTherapistName}>com {label.name}</p>
              <div style={styles.sessionMetaRow}>
                <span style={styles.metaTag}>
                  <CalendarIcon /> {formatTimeRange(session?.startsAt, session?.endsAt)}
                </span>
                {duration > 0 && (
                  <span style={styles.metaTag}>
                    <ClockIcon /> {duration} min
                  </span>
                )}
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: statusMeta.background,
                    color: statusMeta.color,
                  }}
                >
                  {statusMeta.label}
                </span>
              </div>
            </div>
          </div>
          <div style={styles.sessionActions}>
            {showJoinButton && (
              <a href={meetingUrl} target="_blank" rel="noopener noreferrer" style={styles.joinButton}>
                <VideoIcon /> Entrar na sessão
              </a>
            )}
            <button style={styles.detailsButton} onClick={() => toggleExpanded(sessionId)}>
              {isExpanded ? "Esconder detalhes" : "Ver detalhes"}
            </button>
          </div>
        </div>
        {isExpanded ? renderNotesSection(session) : null}
      </div>
    );
  };

  return (
    <div style={styles.pageContainer}>
      <header style={styles.header}>
        <h1 style={styles.title}>Seu histórico</h1>
        <p style={styles.subtitle}>
          Acompanhe consultas realizadas, materiais compartilhados e próximos passos combinados com seu terapeuta.
        </p>
      </header>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={{ ...styles.summaryIcon, color: "#8B5CF6" }}>
            <CheckCircleIcon />
          </div>
          <div>
            <p style={styles.summaryLabel}>Total de consultas</p>
            <p style={styles.summaryValue}>{summary.totalSessions}</p>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={{ ...styles.summaryIcon, color: "#2563EB" }}>
            <AwardIcon />
          </div>
          <div>
            <p style={styles.summaryLabel}>Última sessão</p>
            <p style={styles.summaryValue}>{summary.lastSessionText}</p>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={{ ...styles.summaryIcon, color: "#10B981" }}>
            <UserCheckIcon />
          </div>
          <div>
            <p style={styles.summaryLabel}>Terapeuta mais frequente</p>
            <p style={styles.summaryValue}>{summary.mainTherapist}</p>
          </div>
        </div>
      </div>

      {error ? <div style={styles.errorBox}>{error}</div> : null}

      {loading ? (
        <div style={styles.loadingBox}>Carregando histórico...</div>
      ) : (
        <>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Próximas consultas</h2>
            {upcomingSessions.length === 0 ? (
              <div style={styles.emptyState}>Nenhuma consulta agendada no momento.</div>
            ) : (
              upcomingSessions.map(renderSessionCard)
            )}
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Consultas realizadas</h2>
            {completedSessions.length === 0 ? (
              <div style={styles.emptyState}>Ainda não existem consultas registradas no histórico.</div>
            ) : (
              completedSessions.map(renderSessionCard)
            )}
          </section>
        </>
      )}
    </div>
  );
};

const styles = {
  pageContainer: {
    padding: "2rem 3.5rem",
    backgroundColor: "#F9FAFB",
    fontFamily: '"Inter", sans-serif',
    minHeight: "100vh",
  },
  header: { marginBottom: "2.5rem" },
  title: { color: "#1F2937", fontSize: "2.2rem", fontWeight: 700, margin: 0 },
  subtitle: { color: "#6B7280", fontSize: "1.05rem", fontWeight: 500, marginTop: "0.75rem" },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "1.5rem",
    marginBottom: "3rem",
  },
  summaryCard: {
    display: "flex",
    alignItems: "center",
    gap: "1.25rem",
    padding: "1.5rem",
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    border: "1px solid #E5E7EB",
  },
  summaryIcon: { display: "flex", alignItems: "center", justifyContent: "center" },
  summaryLabel: { color: "#6B7280", fontSize: "0.9rem", margin: 0 },
  summaryValue: { color: "#1F2937", fontSize: "1.35rem", fontWeight: 600, margin: "4px 0 0 0" },
  section: { marginBottom: "2.5rem" },
  sectionTitle: {
    fontSize: "1.4rem",
    color: "#1F2937",
    fontWeight: 600,
    marginBottom: "1.5rem",
    borderBottom: "1px solid #E5E7EB",
    paddingBottom: "0.75rem",
  },
  sessionItem: { marginBottom: "1rem" },
  sessionCard: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1.5rem",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.5rem",
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
  },
  sessionTherapistInfo: { display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 },
  therapistAvatar: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },
  therapistAvatarFallback: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    backgroundColor: "#E5E7EB",
    color: "#1F2937",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    flexShrink: 0,
  },
  sessionDetails: { display: "flex", flexDirection: "column", gap: "0.35rem", minWidth: 0 },
  sessionDate: { color: "#1F2937", fontWeight: 600, fontSize: "1.05rem", margin: 0 },
  sessionTherapistName: { color: "#6B7280", margin: 0, fontSize: "0.95rem" },
  sessionMetaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    marginTop: "0.35rem",
  },
  metaTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    backgroundColor: "#F3F4F6",
    color: "#374151",
    padding: "0.25rem 0.65rem",
    borderRadius: "999px",
    fontSize: "0.8rem",
    fontWeight: 500,
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.25rem 0.85rem",
    borderRadius: "999px",
    fontSize: "0.8rem",
    fontWeight: 600,
  },
  sessionActions: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginLeft: "auto",
  },
  joinButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    borderRadius: "8px",
    padding: "0.5rem 1rem",
    fontWeight: 600,
    textDecoration: "none",
    transition: "background-color 0.2s ease",
  },
  detailsButton: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #D1D5DB",
    color: "#374151",
    padding: "0.5rem 1.1rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 500,
  },
  notesSection: {
    backgroundColor: "#F9FAFB",
    padding: "1.5rem",
    border: "1px solid #E5E7EB",
    borderTop: "none",
    borderRadius: "0 0 12px 12px",
  },
  notesTitle: { margin: "0 0 0.75rem 0", color: "#374151", fontWeight: 600, fontSize: "1rem" },
  notesText: { margin: "0 0 1rem 0", color: "#4B5563", lineHeight: 1.6 },
  emptyNotes: { margin: 0, color: "#6B7280", fontStyle: "italic" },
  resourceBlock: { marginTop: "1rem" },
  resourceTitle: { margin: "0 0 0.5rem 0", color: "#374151", fontWeight: 600, fontSize: "0.95rem" },
  resourceList: { margin: 0, paddingLeft: "1.1rem", display: "grid", gap: "0.35rem" },
  resourceListItem: { color: "#4B5563", fontSize: "0.9rem" },
  resourceLink: { color: "#2563EB", textDecoration: "underline", fontWeight: 500 },
  inlineLink: { color: "#2563EB", textDecoration: "underline", fontWeight: 500 },
  taskMeta: { display: "inline-block", marginLeft: "0.5rem", color: "#6B7280", fontSize: "0.8rem" },
  reminderBox: {
    marginTop: "1.25rem",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    borderRadius: "8px",
    backgroundColor: "#EEF2FF",
    color: "#3730A3",
    fontWeight: 500,
  },
  meetingLinkBox: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    borderRadius: "8px",
    backgroundColor: "#F1F5F9",
    color: "#1D4ED8",
    fontWeight: 500,
    marginBottom: "0.75rem",
  },
  loadingBox: {
    padding: "2rem",
    textAlign: "center",
    color: "#4B5563",
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    color: "#B91C1C",
    borderRadius: "8px",
    padding: "1rem 1.25rem",
    marginBottom: "1.5rem",
    border: "1px solid #FCA5A5",
  },
  emptyState: {
    padding: "1.5rem",
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    border: "1px dashed #D1D5DB",
    color: "#6B7280",
    textAlign: "center",
    fontStyle: "italic",
  },
};

export default HistoricoPage;

