// src/screens/therapist/AgendaConfigPage.js
// Pagina do TERAPEUTA para publicar/gerenciar disponibilidade (slots)
// Inclui aprovacao/recusa de solicitacoes (HELD) e exclusao de slots OPEN.

import React, { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import {
  publishSlots,
  subscribeSlots,
  deleteSlot,
  approveAppointment,
  declineAppointment,
  subscribeTherapistAppointments,
  completeAppointment,
} from "../../services/agenda";
import { useAuth } from "../../context/AuthContext";
import { getMultipleUserProfiles } from "../../services/usersService";
import RecordConsultationModal from "../../components/therapist/RecordConsultationModal";
import { db } from "../../firebase";

// ===== helpers de data =====
function pad(v, n = 2) {
  return String(v).padStart(n, "0");
}
function toLocalInputDate(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function combineDateTime(dateStr, timeStr) {
  // date: yyyy-mm-dd, time: HH:mm -> ISO
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}
function fmtDateWithWeekday(dt) {
  try {
    const date = new Date(dt);
    const datePart = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const weekday = date.toLocaleDateString("pt-BR", { weekday: "long" });
    return `${datePart} (${weekday})`;
  } catch {
    return dt;
  }
}
function fmtTime(dt) {
  try {
    return new Date(dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return dt;
  }
}
function fmtRange(start, end) {
  try {
    const arrow = String.fromCharCode(0x2192);
    return `${fmtDateWithWeekday(start)} ${arrow} ${fmtTime(start)} - ${fmtTime(end)}`;
  } catch {
    return `${start} -> ${end}`;
  }
}


function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function addDays(base, days) {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + Number(days || 0));
  return copy;
}

function isSameDay(dateA, dateB) {
  const a = parseDate(dateA);
  const b = parseDate(dateB);
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWithinNextHours(target, hours) {
  const date = parseDate(target);
  if (!date) return false;
  const now = new Date();
  const limit = new Date(now.getTime() + hours * 60 * 60 * 1000);
  return date >= now && date <= limit;
}

function isWithinNextDays(target, days) {
  const date = parseDate(target);
  if (!date) return false;
  const now = startOfDay(new Date());
  const limit = endOfDay(addDays(now, days));
  return date >= now && date <= limit;
}

function compareAsc(a, b) {
  return parseDate(a)?.getTime() - parseDate(b)?.getTime();
}

function compareDesc(a, b) {
  return parseDate(b)?.getTime() - parseDate(a)?.getTime();
}

const styles = {
  page: {
    background: "#F9FAFB",
    minHeight: "100vh",
    padding: "2.5rem 3.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: "1rem",
  },
  title: { margin: 0, fontSize: "2rem", fontWeight: 800, color: "#111827" },
  subtitle: { margin: "0.25rem 0 0 0", color: "#6B7280", maxWidth: 520 },
  filtersBar: { display: "flex", gap: "0.75rem", alignItems: "center" },
  filterLabel: {
    fontSize: 14,
    color: "#6B7280",
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
  },
  select: {
    border: "1px solid #D1D5DB",
    borderRadius: 8,
    padding: "0.45rem 0.75rem",
    fontSize: 14,
    background: "#FFFFFF",
    color: "#374151",
  },
  summaryRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "1rem",
  },
  summaryCard: {
    background: "#FFFFFF",
    borderRadius: 16,
    border: "1px solid #E5E7EB",
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
  },
  summaryLabel: { color: "#6B7280", fontSize: 14, fontWeight: 500 },
  summaryValue: { color: "#111827", fontSize: "2rem", fontWeight: 800 },
  summaryHint: { color: "#6B7280", fontSize: 13, lineHeight: 1.4 },
  mainLayout: {
    display: "grid",
    gap: "1.5rem",
    gridTemplateColumns: "minmax(0, 1fr) 320px",
  },
  mainColumn: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  sidebar: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  sectionCard: {
    background: "#FFFFFF",
    borderRadius: 16,
    border: "1px solid #E5E7EB",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  sectionTitle: { margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#1F2937" },
  sectionActions: { display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" },
  chipGroup: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  chip: {
    border: "1px solid #D1D5DB",
    borderRadius: 999,
    padding: "0.35rem 0.9rem",
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
    background: "#FFFFFF",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  chipActive: { background: "#EEF2FF", borderColor: "#6366F1", color: "#3730A3" },
  pendingList: { display: "grid", gap: "0.75rem" },
  pendingItem: {
    border: "1px solid #E5E7EB",
    borderRadius: 14,
    padding: "1rem",
    display: "grid",
    gap: "0.75rem",
    background: "#F9FAFB",
  },
  pendingItemRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "1rem",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  pendingInfo: { display: "flex", flexDirection: "column", gap: "0.35rem" },
  pendingActions: { display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" },
  button: {
    borderRadius: 12,
    border: "none",
    padding: "0.55rem 1.1rem",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
  },
  buttonSecondary: { background: "#FEE2E2", color: "#B91C1C" },
  buttonSuccess: { background: "#22C55E", color: "#FFFFFF" },
  buttonOutline: {
    borderRadius: 12,
    border: "1px solid #D1D5DB",
    background: "#FFFFFF",
    color: "#374151",
    padding: "0.5rem 1rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  urgencyBadge: {
    background: "#F97316",
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 999,
    padding: "0.2rem 0.65rem",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  metaRow: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
    alignItems: "center",
    color: "#6B7280",
    fontSize: 13,
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.25rem 0.75rem",
    borderRadius: 999,
    fontWeight: 600,
    fontSize: 12,
    textTransform: "uppercase",
  },
  statusDot: { width: 8, height: 8, borderRadius: "50%" },
  calendarGrid: { display: "grid", gap: "1rem" },
  dayColumn: { border: "1px solid #E5E7EB", borderRadius: 16, background: "#FFFFFF" },
  dayHeader: {
    background: "#F3F4F6",
    borderRadius: "16px 16px 0 0",
    padding: "1rem 1.25rem",
    fontWeight: 700,
    color: "#111827",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayList: { display: "grid", gap: "0.75rem", padding: "1rem 1.25rem" },
  slotCard: {
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: "0.75rem 1rem",
    display: "flex",
    justifyContent: "space-between",
    gap: "0.75rem",
    alignItems: "flex-start",
    background: "#FFFFFF",
  },
  slotInfo: { display: "flex", flexDirection: "column", gap: "0.35rem" },
  slotActions: { display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" },
  slotTime: { fontWeight: 700, color: "#111827" },
  slotPatient: { color: "#6B7280", fontSize: 13 },
  emptyState: {
    border: "1px dashed #D1D5DB",
    borderRadius: 12,
    padding: "1.25rem",
    textAlign: "center",
    color: "#6B7280",
    fontStyle: "italic",
  },
  movementsList: { display: "grid", gap: "0.75rem" },
  movementItem: {
    border: "1px solid #E5E7EB",
    borderRadius: 14,
    padding: "1rem",
    background: "#FFFFFF",
    display: "flex",
    justifyContent: "space-between",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  movementInfo: { display: "flex", flexDirection: "column", gap: "0.35rem" },
  publishFormTitle: { margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#111827" },
  publishForm: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    background: "#F9FAFB",
    borderRadius: 12,
    padding: "1.1rem",
    border: "1px solid #E5E7EB",
  },
  formGrid: {
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: "1fr",
  },
  input: {
    width: "100%",
    height: 44,
    border: "1px solid #D1D5DB",
    borderRadius: 10,
    padding: "0 12px",
    fontSize: 14,
    boxSizing: "border-box",
  },
  publishButton: {
    background: "#7C3AED",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 12,
    height: 44,
    fontWeight: 700,
    cursor: "pointer",
  },
  feedbackBox: { borderRadius: 12, padding: "0.9rem 1.1rem", fontWeight: 500 },
  feedbackSuccess: { background: "#ECFDF5", color: "#047857", border: "1px solid #6EE7B7" },
  feedbackError: { background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FCA5A5" },
  feedbackClose: {
    background: "transparent",
    border: "none",
    color: "inherit",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
    lineHeight: 1,
  },
  link: { color: "#2563EB", textDecoration: "underline", fontWeight: 600 },
  divider: { height: 1, background: "#E5E7EB", margin: "0.5rem 0" },
};



const SLOT_STATUS_META = {
  OPEN: { label: "Aberto", color: "#1D4ED8", background: "#DBEAFE" },
  HELD: { label: "Solicitado", color: "#A16207", background: "#FEF3C7" },
  BOOKED: { label: "Reservado", color: "#047857", background: "#DCFCE7" },
};

const APPOINTMENT_STATUS_META = {
  pending: { label: "Pendente", color: "#D97706", background: "#FEF3C7" },
  confirmed: { label: "Confirmada", color: "#047857", background: "#DCFCE7" },
  canceled: { label: "Cancelada", color: "#B91C1C", background: "#FEE2E2" },
  completed: { label: "Concluída", color: "#4C1D95", background: "#EDE9FE" },
  declined: { label: "Recusada", color: "#6B7280", background: "#F3F4F6" },
};

const normalizeStatus = (value) => String(value || "").toLowerCase();
const statusEquals = (value, target) => normalizeStatus(value) === target;
const formatStatusTag = (value) => normalizeStatus(value).toUpperCase() || "";

export default function AgendaConfigPage() {
  const { user } = useAuth(); // ja usado no seu app
  const therapistId = user?.uid || user?.id;

  // formulario
  const [date, setDate] = useState(toLocalInputDate(new Date()));
  const [start, setStart] = useState("11:00");
  const [end, setEnd] = useState("12:50");
  const [duration] = useState(50); // informativo

  // dados
  const [slots, setSlots] = useState([]);
  const [loadingPublish, setLoadingPublish] = useState(false);
  const [working, setWorking] = useState(null); // id em operacao

  // solicitacoes/appts do terapeuta
  const [apps, setApps] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [actionState, setActionState] = useState({});
  const [recordingAppointment, setRecordingAppointment] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [rangeFilter, setRangeFilter] = useState("7");
  const [pendingFilter, setPendingFilter] = useState("all");
  const [movementsTab, setMovementsTab] = useState("confirmed");

  useEffect(() => {
    if (!therapistId) return;
    const unsub = subscribeSlots(therapistId, (data) => setSlots(data));
    return () => unsub && unsub();
  }, [therapistId]);

  useEffect(() => {
    const ids = new Set();
    apps.forEach((appt) => {
      if (appt?.patientId) ids.add(appt.patientId);
      if (appt?.therapistId) ids.add(appt.therapistId);
    });
    slots.forEach((slot) => {
      if (slot?.requestedBy) ids.add(slot.requestedBy);
    });
    if (therapistId) ids.add(therapistId);
    if (!ids.size) return undefined;

    let active = true;
    getMultipleUserProfiles(Array.from(ids))
      .then((map) => {
        if (active) setProfiles((prev) => ({ ...prev, ...map }));
      })
      .catch((error) => console.error(error));

    return () => {
      active = false;
    };
  }, [apps, slots, therapistId]);

  useEffect(() => {
    if (!therapistId) return;
    const unsub = subscribeTherapistAppointments(therapistId, (arr) => setApps(arr));
    return () => unsub && unsub();
  }, [therapistId]);

  const pending = useMemo(() => {
    return apps
      .filter((appt) => statusEquals(appt.status, "pending"))
      .slice()
      .sort((a, b) => compareAsc(a.slotStartsAt, b.slotStartsAt));
  }, [apps]);

  const confirmed = useMemo(() => {
    return apps
      .filter((appt) => statusEquals(appt.status, "confirmed"))
      .slice()
      .sort((a, b) => compareAsc(a.slotStartsAt, b.slotStartsAt));
  }, [apps]);

  const canceled = useMemo(() => {
    return apps
      .filter((appt) => statusEquals(appt.status, "canceled"))
      .slice()
      .sort((a, b) => compareDesc(a.slotStartsAt, b.slotStartsAt));
  }, [apps]);

  const completed = useMemo(() => {
    return apps
      .filter((appt) => statusEquals(appt.status, "completed"))
      .slice()
      .sort((a, b) => compareDesc(a.slotStartsAt, b.slotStartsAt));
  }, [apps]);

  const todayStart = useMemo(() => startOfDay(new Date()), []);

  const rangeLimit = useMemo(() => {
    if (rangeFilter === "all") return null;
    const days = Number(rangeFilter);
    if (Number.isNaN(days)) return null;
    return endOfDay(addDays(todayStart, days));
  }, [rangeFilter, todayStart]);

  const filteredSlots = useMemo(() => {
    return slots
      .filter((slot) => {
        const startDate = parseDate(slot.startsAt);
        if (!startDate) return false;
        if (startDate < todayStart) return false;
        if (rangeLimit && startDate > rangeLimit) return false;
        return true;
      })
      .slice()
      .sort((a, b) => compareAsc(a.startsAt, b.startsAt));
  }, [slots, rangeLimit, todayStart]);

  const groupedSlots = useMemo(() => {
    const map = new Map();
    filteredSlots.forEach((slot) => {
      const date = parseDate(slot.startsAt);
      if (!date) return;
      const key = date.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(slot);
    });
    return Array.from(map.entries())
      .sort((a, b) => compareAsc(a[0], b[0]))
      .map(([key, items]) => ({
        dateKey: key,
        label: fmtDateWithWeekday(items[0].startsAt),
        slots: items.slice().sort((a, b) => compareAsc(a.startsAt, b.startsAt)),
      }));
  }, [filteredSlots]);

  const pendingFiltered = useMemo(() => {
    return pending.filter((appt) => {
      if (pendingFilter === "24h") return isWithinNextHours(appt.slotStartsAt, 24);
      if (pendingFilter === "7d") return isWithinNextDays(appt.slotStartsAt, 7);
      return true;
    });
  }, [pending, pendingFilter]);

  const summaryMetrics = useMemo(() => {
    const openSlots = filteredSlots.filter((slot) => String(slot.status || "").toUpperCase() === "OPEN").length;
    const todayConfirmed = confirmed.filter((appt) => isSameDay(appt.slotStartsAt, todayStart)).length;
    const weekConfirmed = confirmed.filter((appt) => isWithinNextDays(appt.slotStartsAt, 7)).length;
    return {
      openSlots,
      pending: pendingFiltered.length,
      todayConfirmed,
      weekConfirmed,
    };
  }, [filteredSlots, pendingFiltered, confirmed, todayStart]);

  const movements = useMemo(() => ({
    confirmed: confirmed.slice(0, 6),
    canceled: canceled.slice(0, 6),
    completed: completed.slice(0, 6),
  }), [confirmed, canceled, completed]);

  const movementTabs = [
    { key: "confirmed", label: "Confirmadas" },
    { key: "canceled", label: "Canceladas" },
    { key: "completed", label: "Histórico" },
  ];
  const movementList = movements[movementsTab] || [];

const fallbackName = "Usuario";
  const getDisplayName = (uid) => {
    if (!uid) return fallbackName;
    const profile = profiles[uid];
    const name = (profile?.displayName || profile?.name || "").trim();
    return name || fallbackName;
  };

  async function handlePublish() {
    try {
      setLoadingPublish(true);
      const startsAt = combineDateTime(date, start);
      const endsAt = combineDateTime(date, end);
      await publishSlots(therapistId, [{ startsAt, endsAt }]);
    } catch (err) {
      console.error(err);
      alert("Erro ao publicar disponibilidade");
    } finally {
      setLoadingPublish(false);
    }
  }

  async function handleDelete(slotId) {
    try {
      setWorking(slotId);
      await deleteSlot(therapistId, slotId);
    } catch (err) {
      alert(err?.message || "Não foi possível excluir o horário");
    } finally {
      setWorking(null);
    }
  }

  function updateActionState(apptId, nextState) {
    setActionState((prev) => ({
      ...prev,
      [apptId]: { ...(prev[apptId] || {}), ...nextState },
    }));
  }

  function applyOptimisticStatus(apptId, nextStatus, action) {
    const normalizedStatus = normalizeStatus(nextStatus);
    let previous = null;
    setApps((prev) =>
      prev.map((appt) => {
        if (appt.id === apptId) {
          previous = appt;
          return { ...appt, status: normalizedStatus };
        }
        return appt;
      })
    );

    updateActionState(apptId, { loading: true, error: false, status: normalizedStatus });

    action()
      .then(() => {
        updateActionState(apptId, { loading: false, status: normalizedStatus });
      })
      .catch((error) => {
        setApps((prev) =>
          prev.map((appt) => (appt.id === apptId && previous ? previous : appt))
        );
        updateActionState(apptId, { loading: false, error: true });
        alert(error?.message || "Não foi possível concluir a ação. Tente novamente.");
      });
  }

  const handleApprove = (apptId) =>
    applyOptimisticStatus(apptId, "confirmed", () => approveAppointment(apptId));

  const handleDecline = (apptId) =>
    applyOptimisticStatus(apptId, "declined", () => declineAppointment(apptId));

  const handleRecordConsultation = async (appt) => {
    setFeedback(null);
    if (!appt?.id) {
      setRecordingAppointment(appt);
      return;
    }
    let next = appt;
    try {
      const snap = await getDoc(doc(db, "appointments", appt.id));
      if (snap.exists()) {
        const fresh = snap.data();
        next = {
          ...appt,
          ...fresh,
          meetingUrl: fresh.meetingUrl ?? appt.meetingUrl ?? null,
          meetingRoom: fresh.meetingRoom ?? appt.meetingRoom ?? null,
          meetingProvider: fresh.meetingProvider ?? appt.meetingProvider ?? null,
          meetingExpiresAt: fresh.meetingExpiresAt ?? appt.meetingExpiresAt ?? null,
        };
      }
    } catch (error) {
      console.error("handleRecordConsultation", error);
    }
    setRecordingAppointment(next);
  };

  const handleConsultationSave = async (payload) => {
    if (!recordingAppointment?.id) {
      throw new Error("Nenhum agendamento selecionado.");
    }
    try {
      await completeAppointment(recordingAppointment.id, {
        ...payload,
        updatedBy: therapistId,
      });
      setFeedback({ type: "success", message: "Sessão registrada no histórico do paciente." });
      setRecordingAppointment(null);
    } catch (error) {
      console.error("completeAppointment", error);
      setFeedback({
        type: "error",
        message: error?.message || "Não foi possível salvar a sessão.",
      });
      throw error;
    }
  };

  const handleGenerateLink = () => {
    alert("Função de gerar link da sessão ainda não está disponível.");
  };

  const handleSendReminder = () => {
    alert("Função de enviar lembrete ainda não está disponível.");
  };

  const renderStatusBadge = (meta) => (
    <span style={{ ...styles.statusBadge, background: meta.background, color: meta.color }}>
      <span style={{ ...styles.statusDot, background: meta.color }} />
      {meta.label}
    </span>
  );

﻿  return (
    <div style={styles.page}>
      <RecordConsultationModal
        open={Boolean(recordingAppointment)}
        appointment={recordingAppointment}
        patientName={recordingAppointment ? getDisplayName(recordingAppointment.patientId) : ""}
        onClose={() => setRecordingAppointment(null)}
        onSave={handleConsultationSave}
      />

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Configurar Agenda</h1>
          <p style={styles.subtitle}>
            Panorama completo da sua disponibilidade e das decisões aguardando aprovação.
          </p>
        </div>
        <div style={styles.filtersBar}>
          <label style={styles.filterLabel}>
            Mostrar
            <select
              value={rangeFilter}
              onChange={(event) => setRangeFilter(event.target.value)}
              style={styles.select}
            >
              <option value="7">Próximos 7 dias</option>
              <option value="14">Próximos 14 dias</option>
              <option value="30">Próximos 30 dias</option>
              <option value="all">Todos os horários</option>
            </select>
          </label>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            ...styles.feedbackBox,
            ...(feedback.type === "success" ? styles.feedbackSuccess : styles.feedbackError),
          }}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={styles.feedbackClose}
            aria-label="Fechar mensagem"
          >
            ×
          </button>
        </div>
      )}

      <div style={styles.summaryRow}>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Slots abertos</span>
          <span style={styles.summaryValue}>{summaryMetrics.openSlots}</span>
          <span style={styles.summaryHint}>
            Disponibilidades publicadas para o período selecionado.
          </span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Solicitações pendentes</span>
          <span style={styles.summaryValue}>{summaryMetrics.pending}</span>
          <span style={styles.summaryHint}>
            Priorize os atendimentos mais próximos para evitar perda de interesse.
          </span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Sessões confirmadas</span>
          <span style={styles.summaryValue}>{summaryMetrics.todayConfirmed}</span>
          <span style={styles.summaryHint}>
            Hoje • {summaryMetrics.todayConfirmed} | Próx. 7 dias • {summaryMetrics.weekConfirmed}
          </span>
        </div>
      </div>

      <div style={styles.mainLayout}>
        <div style={styles.mainColumn}>
          <section style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Solicitações a decidir</h2>
              <div style={styles.sectionActions}>
                <label style={styles.filterLabel}>
                  Filtrar
                  <select
                    value={pendingFilter}
                    onChange={(event) => setPendingFilter(event.target.value)}
                    style={styles.select}
                  >
                    <option value="all">Todas</option>
                    <option value="24h">Próximas 24h</option>
                    <option value="7d">Próximos 7 dias</option>
                  </select>
                </label>
              </div>
            </div>

            {pendingFiltered.length === 0 ? (
              <div style={styles.emptyState}>Nenhuma solicitação pendente neste período.</div>
            ) : (
              <div style={styles.pendingList}>
                {pendingFiltered.map((appt) => {
                  const action = actionState[appt.id] || {};
                  const urgent = isWithinNextHours(appt.slotStartsAt, 24);
                  return (
                    <div key={appt.id} style={styles.pendingItem}>
                      <div style={styles.pendingItemRow}>
                        <div style={styles.pendingInfo}>
                          <span style={{ fontWeight: 700, color: "#111827" }}>
                            {fmtRange(appt.slotStartsAt, appt.slotEndsAt)}
                          </span>
                          <div style={styles.metaRow}>
                            {renderStatusBadge(APPOINTMENT_STATUS_META.pending)}
                            <span>{getDisplayName(appt.patientId)}</span>
                            {urgent && <span style={styles.urgencyBadge}>URGENTE</span>}
                          </div>
                          <span style={styles.summaryHint}>
                            Próximo passo: confirme ou recuse para liberar a disponibilidade.
                          </span>
                        </div>
                        <div style={styles.pendingActions}>
                          <button
                            type="button"
                            onClick={() => handleDecline(appt.id)}
                            disabled={action.loading}
                            style={{ ...styles.button, ...styles.buttonSecondary }}
                          >
                            {action.loading ? "Processando..." : "Recusar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprove(appt.id)}
                            disabled={action.loading}
                            style={{ ...styles.button, ...styles.buttonSuccess }}
                          >
                            {action.loading ? "Processando..." : "Confirmar"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Agenda por disponibilidade</h2>
            </div>

            {groupedSlots.length === 0 ? (
              <div style={styles.emptyState}>Nenhum horário publicado para o intervalo selecionado.</div>
            ) : (
              <div style={styles.calendarGrid}>
                {groupedSlots.map((group) => (
                  <div key={group.dateKey} style={styles.dayColumn}>
                    <div style={styles.dayHeader}>
                      <span>{group.label}</span>
                      <span style={styles.summaryHint}>
                        {group.slots.length} horário{group.slots.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div style={styles.dayList}>
                      {group.slots.map((slot) => {
                        const statusKey = String(slot.status || "").toUpperCase();
                        const meta = SLOT_STATUS_META[statusKey] || {
                          label: statusKey,
                          color: "#374151",
                          background: "#E5E7EB",
                        };
                        const relatedPending = pending.find(
                          (appt) =>
                            appt.slotStartsAt === slot.startsAt && appt.slotEndsAt === slot.endsAt
                        );
                        const relatedConfirmed = confirmed.find(
                          (appt) =>
                            appt.slotStartsAt === slot.startsAt && appt.slotEndsAt === slot.endsAt
                        );
                        const patientName =
                          (slot.requestedBy && getDisplayName(slot.requestedBy)) ||
                          (relatedPending?.patientId && getDisplayName(relatedPending.patientId)) ||
                          (relatedConfirmed?.patientId && getDisplayName(relatedConfirmed.patientId)) ||
                          null;

                        return (
                          <div key={slot.id || slot.startsAt} style={styles.slotCard}>
                            <div style={styles.slotInfo}>
                              <span style={styles.slotTime}>
                                {fmtTime(slot.startsAt)} - {fmtTime(slot.endsAt)}
                              </span>
                              <div style={styles.metaRow}>
                                {renderStatusBadge(meta)}
                                {patientName && (
                                  <span style={styles.slotPatient}>Paciente: {patientName}</span>
                                )}
                              </div>
                            </div>
                            <div style={styles.slotActions}>
                              {statusKey === "OPEN" ? (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(slot.id)}
                                  disabled={working === slot.id}
                                  style={{ ...styles.button, ...styles.buttonSecondary }}
                                >
                                  {working === slot.id ? "Removendo..." : "Excluir"}
                                </button>
                              ) : statusKey === "HELD" && relatedPending ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleDecline(relatedPending.id)}
                                    disabled={actionState[relatedPending.id]?.loading}
                                    style={{ ...styles.button, ...styles.buttonSecondary }}
                                  >
                                    {actionState[relatedPending.id]?.loading ? "Processando..." : "Recusar"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApprove(relatedPending.id)}
                                    disabled={actionState[relatedPending.id]?.loading}
                                    style={{ ...styles.button, ...styles.buttonSuccess }}
                                  >
                                    {actionState[relatedPending.id]?.loading ? "Processando..." : "Confirmar"}
                                  </button>
                                </>
                              ) : statusKey === "BOOKED" && relatedConfirmed ? (
                                <button
                                  type="button"
                                  onClick={() => handleRecordConsultation(relatedConfirmed)}
                                  style={styles.buttonOutline}
                                >
                                  Registrar histórico
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Movimentações recentes</h2>
              <div style={styles.chipGroup}>
                {movementTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setMovementsTab(tab.key)}
                    style={{
                      ...styles.chip,
                      ...(movementsTab === tab.key ? styles.chipActive : null),
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {movementList.length === 0 ? (
              <div style={styles.emptyState}>Nenhum registro disponível.</div>
            ) : (
              <div style={styles.movementsList}>
                {movementList.map((appt) => {
                  const statusMeta = APPOINTMENT_STATUS_META[normalizeStatus(appt.status)] || APPOINTMENT_STATUS_META.pending;
                  return (
                    <div key={appt.id} style={styles.movementItem}>
                      <div style={styles.movementInfo}>
                        <span style={{ fontWeight: 700, color: "#111827" }}>
                          {fmtRange(appt.slotStartsAt, appt.slotEndsAt)}
                        </span>
                        <div style={styles.metaRow}>
                          {renderStatusBadge(statusMeta)}
                          <span>{getDisplayName(appt.patientId)}</span>
                        </div>
                        <span style={styles.summaryHint}>
                          Última atualização: {fmtDateWithWeekday(appt.slotStartsAt)}
                        </span>
                      </div>
                      {movementsTab === "confirmed" && (
                        <div style={styles.slotActions}>
                          <button
                            type="button"
                            onClick={() => handleRecordConsultation(appt)}
                            style={styles.buttonOutline}
                          >
                            Registrar sessão
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside style={styles.sidebar}>
          <div style={{ position: "sticky", top: "2.5rem" }}>
            <div style={styles.publishForm}>
              <h3 style={styles.publishFormTitle}>Adicionar horário disponível</h3>
              <div style={styles.formGrid}>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  style={styles.input}
                />
                <input
                  type="time"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                  style={styles.input}
                />
                <input
                  type="time"
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                  style={styles.input}
                />
              </div>
              <button
                type="button"
                onClick={handlePublish}
                disabled={loadingPublish}
                style={styles.publishButton}
              >
                {loadingPublish ? "Publicando..." : "Publicar horário"}
              </button>
              <span style={styles.summaryHint}>Duração sugerida: {duration} min</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );

}






















