// src/screens/therapist/AgendaConfigPage.js
// Pagina do TERAPEUTA para publicar/gerenciar disponibilidade (slots)
// Inclui aprovacao/recusa de solicitacoes (HELD) e exclusao de slots OPEN.

import React, { useEffect, useMemo, useState } from "react";
import {
  publishSlots,
  subscribeSlots,
  deleteSlot,
  approveAppointment,
  declineAppointment,
  subscribeTherapistAppointments,
} from "../../services/agenda";
import { useAuth } from "../../context/AuthContext";
import { getMultipleUserProfiles } from "../../services/usersService";

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
function fmt(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

const styles = {
  page: { padding: "2rem 3.5rem", background: "#F9FAFB", minHeight: "100vh" },
  title: { fontWeight: 800, fontSize: 28, color: "#111827", margin: 0 },
  subtitle: { color: "#6B7280", marginTop: 8 },
  card: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 20 },
  grid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 },
  input: { width: "100%", height: 44, border: "1px solid #E5E7EB", borderRadius: 10, padding: "0 12px" },
  button: {
    background: "#7C3AED",
    color: "#fff",
    height: 44,
    border: 0,
    borderRadius: 12,
    fontWeight: 700,
    cursor: "pointer",
    padding: "0 16px",
  },
  list: { display: "grid", gap: 12, marginTop: 12 },
  item: {
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 14,
    background: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  tag: (color) => ({
    display: "inline-block",
    fontSize: 12,
    fontWeight: 800,
    color,
    textTransform: "uppercase",
    marginLeft: 8,
  }),
  danger: {
    background: "#EF4444",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
  },
  secondary: {
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
  },
  success: {
    background: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
  },
};

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

  const pending = useMemo(() => apps.filter((a) => a.status === "PENDING"), [apps]);
  const confirmed = useMemo(() => apps.filter((a) => a.status === "CONFIRMED"), [apps]);
  const canceled = useMemo(() =>
    apps
      .filter((a) => a.status === "CANCELED")
      .slice()
      .sort((a, b) => new Date(b.slotStartsAt).getTime() - new Date(a.slotStartsAt).getTime()),
    [apps]
  );


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
      alert(err?.message || "Nao foi possivel excluir o horario");
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
    let previous = null;
    setApps((prev) =>
      prev.map((appt) => {
        if (appt.id === apptId) {
          previous = appt;
          return { ...appt, status: nextStatus };
        }
        return appt;
      })
    );

    updateActionState(apptId, { loading: true, error: false, status: nextStatus });

    action()
      .then(() => {
        updateActionState(apptId, { loading: false, status: nextStatus });
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
    applyOptimisticStatus(apptId, "CONFIRMED", () => approveAppointment(apptId));

  const handleDecline = (apptId) =>
    applyOptimisticStatus(apptId, "DECLINED", () => declineAppointment(apptId));

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Configurar Agenda</h1>
      <p style={styles.subtitle}>
        Publique seus horarios disponiveis. Gerencie solicitacoes dos pacientes e confirme ou recuse.
      </p>

      {/* Formulario de publicacao */}
      <div style={styles.card}>
        <h3 style={{ marginTop: 0 }}>Adicionar disponibilidade</h3>
        <div style={styles.grid}>
          <div>
            <label style={{ display: "block", color: "#374151", fontWeight: 600, marginBottom: 6 }}>Data</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={styles.input} />
          </div>
          <div>
            <label style={{ display: "block", color: "#374151", fontWeight: 600, marginBottom: 6 }}>Inicio</label>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} style={styles.input} />
          </div>
          <div>
            <label style={{ display: "block", color: "#374151", fontWeight: 600, marginBottom: 6 }}>Fim</label>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} style={styles.input} />
          </div>
          <div>
            <label style={{ display: "block", color: "#374151", fontWeight: 600, marginBottom: 6 }}>Duracao (min)</label>
            <input disabled value={duration} style={styles.input} />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <button style={styles.button} onClick={handlePublish} disabled={loadingPublish}>
            {loadingPublish ? "Publicando..." : "Publicar disponibilidade"}
          </button>
        </div>
      </div>

      {/* Solicitacoes pendentes (PENDING) */}
      <div style={{ ...styles.card, marginTop: 18 }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Solicitações pendentes</h3>
        {pending.length === 0 ? (
          <div style={{ color: "#6B7280" }}>Nenhuma solicitação pendente.</div>
        ) : (
          <div style={styles.list}>
            {pending.map((appt) => (
              <div key={appt.id} style={styles.item}>
                <div>
                  <div style={{ fontWeight: 800, color: "#111827" }}>
                    {fmt(appt.slotStartsAt)} → {fmt(appt.slotEndsAt)}
                    <span style={styles.tag("#92400E")}>PENDING</span>
                  </div>
                  <div style={{ color: "#6B7280", fontSize: 14 }}>Paciente: {getDisplayName(appt.patientId)}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleDecline(appt.id)}
                    disabled={actionState[appt.id]?.loading}
                    style={styles.secondary}
                    aria-label={`Recusar solicitacao de ${getDisplayName(appt.patientId)}`}
                  >
                    {actionState[appt.id]?.loading ? "Processando..." : "Recusar"}
                  </button>
                  <button
                    onClick={() => handleApprove(appt.id)}
                    disabled={actionState[appt.id]?.loading}
                    style={styles.success}
                    aria-label={`Confirmar solicitacao de ${getDisplayName(appt.patientId)}`}
                  >
                    {actionState[appt.id]?.loading ? "Processando..." : "Confirmar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proximos confirmados */}
      <div style={{ ...styles.card, marginTop: 18 }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Próximas sessões confirmadas</h3>
        {confirmed.length === 0 ? (
          <div style={{ color: "#6B7280" }}>Nenhuma sessão confirmada.</div>
        ) : (
          <div style={styles.list}>
            {confirmed.map((appt) => (
              <div key={appt.id} style={styles.item}>
                <div>
                  <div style={{ fontWeight: 800, color: "#111827" }}>
                    {fmt(appt.slotStartsAt)} → {fmt(appt.slotEndsAt)}
                    <span style={styles.tag("#065F46")}>CONFIRMED</span>
                  </div>
                  <div style={{ color: "#6B7280", fontSize: 14 }}>Paciente: {getDisplayName(appt.patientId)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancelamentos recentes */}
      <div style={{ ...styles.card, marginTop: 18 }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Cancelamentos recentes</h3>
        {canceled.length === 0 ? (
          <div style={{ color: "#6B7280" }}>Nenhum cancelamento registrado.</div>
        ) : (
          <div style={styles.list}>
            {canceled.map((appt) => (
              <div key={appt.id} style={styles.item}>
                <div>
                  <div style={{ fontWeight: 800, color: "#111827" }}>
                    {fmt(appt.slotStartsAt)} - {fmt(appt.slotEndsAt)}
                    <span style={styles.tag("#374151")}>CANCELED</span>
                  </div>
                  <div style={{ color: "#6B7280", fontSize: 14 }}>
                    Paciente {getDisplayName(appt.patientId)} cancelou este agendamento.
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seus horarios publicados */}
      <div style={{ ...styles.card, marginTop: 18 }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Meus horários</h3>
        <div style={styles.list}>
          {slots.length === 0 ? (
            <div style={{ color: "#6B7280" }}>Nenhum horário publicado.</div>
          ) : (
            slots.map((slot) => (
              <div key={slot.id} style={styles.item}>
                <div>
                  <div style={{ fontWeight: 800, color: "#111827" }}>
                    {fmt(slot.startsAt)} → {fmt(slot.endsAt)}
                    <span
                      style={styles.tag(
                        slot.status === "OPEN" ? "#065F46" : slot.status === "HELD" ? "#92400E" : "#1D4ED8"
                      )}
                    >
                      {slot.status}
                    </span>
                  </div>
                  {slot.requestedBy && (
                    <div style={{ color: "#6B7280", fontSize: 14 }}>
                      solicitado por: <b>{getDisplayName(slot.requestedBy)}</b>
                    </div>
                  )}
                </div>
                {/* Ações por status */}
                {slot.status === "OPEN" ? (
                  <button
                    onClick={() => handleDelete(slot.id)}
                    disabled={working === slot.id}
                    style={styles.danger}
                    title="Excluir"
                  >
                    Excluir
                  </button>
                ) : slot.status === "HELD" ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    {(() => {
                      const appt = pending.find(
                        (candidate) =>
                          candidate.slotStartsAt === slot.startsAt && candidate.slotEndsAt === slot.endsAt
                      );
                      if (!appt) return null;
                      return (
                        <>
                          <button
                            onClick={() => handleDecline(appt.id)}
                            disabled={actionState[appt.id]?.loading}
                            style={styles.secondary}
                            aria-label={`Recusar solicitacao de ${getDisplayName(appt.patientId)}`}
                          >
                            {actionState[appt.id]?.loading ? "Processando..." : "Recusar"}
                          </button>
                          <button
                            onClick={() => handleApprove(appt.id)}
                            disabled={actionState[appt.id]?.loading}
                            style={styles.success}
                            aria-label={`Confirmar solicitacao de ${getDisplayName(appt.patientId)}`}
                          >
                            {actionState[appt.id]?.loading ? "Processando..." : "Confirmar"}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div /> // BOOKED -> sem ação
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
