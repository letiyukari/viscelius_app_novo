// src/screens/therapist/AgendaConfigPage.js
// Página do TERAPEUTA para publicar/gerenciar disponibilidade (slots)
// Inclui aprovação/recusa de solicitações (HELD) e exclusão de slots OPEN.

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
  const { user } = useAuth(); // já usado no seu app
  const therapistId = user?.uid || user?.id;

  // formulário
  const [date, setDate] = useState(toLocalInputDate(new Date()));
  const [start, setStart] = useState("11:00");
  const [end, setEnd] = useState("12:50");
  const [duration] = useState(50); // informativo

  // dados
  const [slots, setSlots] = useState([]);
  const [loadingPublish, setLoadingPublish] = useState(false);
  const [working, setWorking] = useState(null); // id em operação

  // solicitações/appts do terapeuta
  const [apps, setApps] = useState([]);

  useEffect(() => {
    if (!therapistId) return;
    const unsub = subscribeSlots(therapistId, (data) => setSlots(data));
    return () => unsub && unsub();
  }, [therapistId]);

  useEffect(() => {
    if (!therapistId) return;
    const unsub = subscribeTherapistAppointments(therapistId, (arr) => setApps(arr));
    return () => unsub && unsub();
  }, [therapistId]);

  const pending = useMemo(() => apps.filter((a) => a.status === "PENDING"), [apps]);
  const confirmed = useMemo(() => apps.filter((a) => a.status === "CONFIRMED"), [apps]);

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

  async function handleApprove(apptId) {
    try {
      setWorking(apptId);
      await approveAppointment(apptId);
    } catch (err) {
      alert(err?.message || "Não foi possível confirmar o agendamento");
    } finally {
      setWorking(null);
    }
  }

  async function handleDecline(apptId) {
    try {
      setWorking(apptId);
      await declineAppointment(apptId);
    } catch (err) {
      alert(err?.message || "Não foi possível recusar a solicitação");
    } finally {
      setWorking(null);
    }
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Configurar Agenda</h1>
      <p style={styles.subtitle}>
        Publique seus horários disponíveis. Gerencie solicitações dos pacientes e confirme ou recuse.
      </p>

      {/* Formulário de publicação */}
      <div style={{ ...styles.card, marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Novo horário disponível</h3>
        <div style={styles.grid}>
          <div>
            <label style={{ display: "block", color: "#374151", fontWeight: 600, marginBottom: 6 }}>Data</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={styles.input} />
          </div>
          <div>
            <label style={{ display: "block", color: "#374151", fontWeight: 600, marginBottom: 6 }}>Início</label>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} style={styles.input} />
          </div>
          <div>
            <label style={{ display: "block", color: "#374151", fontWeight: 600, marginBottom: 6 }}>Fim</label>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} style={styles.input} />
          </div>
          <div>
            <label style={{ display: "block", color: "#374151", fontWeight: 600, marginBottom: 6 }}>Duração (min)</label>
            <input disabled value={duration} style={styles.input} />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <button onClick={handlePublish} disabled={loadingPublish} style={styles.button}>
            {loadingPublish ? "Publicando..." : "Publicar disponibilidade"}
          </button>
        </div>
      </div>

      {/* Solicitações pendentes (PENDING) */}
      <div style={{ ...styles.card, marginTop: 18 }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Solicitações pendentes</h3>
        {pending.length === 0 ? (
          <div style={{ color: "#6B7280" }}>Nenhuma solicitação pendente.</div>
        ) : (
          <div style={styles.list}>
            {pending.map((a) => (
              <div key={a.id} style={styles.item}>
                <div>
                  <div style={{ fontWeight: 800, color: "#111827" }}>
                    {fmt(a.slotStartsAt)} → {fmt(a.slotEndsAt)}
                    <span style={styles.tag("#92400E")}>PENDING</span>
                  </div>
                  <div style={{ color: "#6B7280", fontSize: 14 }}>Paciente: {a.patientId}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleDecline(a.id)}
                    disabled={working === a.id}
                    style={styles.secondary}
                    title="Recusar"
                  >
                    Recusar
                  </button>
                  <button
                    onClick={() => handleApprove(a.id)}
                    disabled={working === a.id}
                    style={styles.success}
                    title="Confirmar"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Próximos confirmados */}
      <div style={{ ...styles.card, marginTop: 18 }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Próximas sessões confirmadas</h3>
        {confirmed.length === 0 ? (
          <div style={{ color: "#6B7280" }}>Nenhuma sessão confirmada.</div>
        ) : (
          <div style={styles.list}>
            {confirmed.map((a) => (
              <div key={a.id} style={styles.item}>
                <div>
                  <div style={{ fontWeight: 800, color: "#111827" }}>
                    {fmt(a.slotStartsAt)} → {fmt(a.slotEndsAt)}
                    <span style={styles.tag("#065F46")}>CONFIRMED</span>
                  </div>
                  <div style={{ color: "#6B7280", fontSize: 14 }}>Paciente: {a.patientId}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seus horários publicados */}
      <div style={{ ...styles.card, marginTop: 18 }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Meus horários</h3>
        <div style={styles.list}>
          {slots.length === 0 ? (
            <div style={{ color: "#6B7280" }}>Nenhum horário publicado.</div>
          ) : (
            slots.map((s) => (
              <div key={s.id} style={styles.item}>
                <div>
                  <div style={{ fontWeight: 800, color: "#111827" }}>
                    {fmt(s.startsAt)} → {fmt(s.endsAt)}
                    <span
                      style={styles.tag(
                        s.status === "OPEN" ? "#065F46" : s.status === "HELD" ? "#92400E" : "#1D4ED8"
                      )}
                    >
                      {s.status}
                    </span>
                  </div>
                  {s.requestedBy && (
                    <div style={{ color: "#6B7280", fontSize: 14 }}>
                      solicitado por: <b>{s.requestedBy}</b>
                    </div>
                  )}
                </div>
                {/* Ações por status */}
                {s.status === "OPEN" ? (
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={working === s.id}
                    style={styles.danger}
                    title="Excluir"
                  >
                    Excluir
                  </button>
                ) : s.status === "HELD" ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    {/** localiza o appointment pendente correspondente */}
                    {(() => {
                      const appt = pending.find(
                        (a) => a.slotStartsAt === s.startsAt && a.slotEndsAt === s.endsAt
                      );
                      if (!appt) return null;
                      return (
                        <>
                          <button
                            onClick={() => handleDecline(appt.id)}
                            disabled={working === appt.id}
                            style={styles.secondary}
                          >
                            Recusar
                          </button>
                          <button
                            onClick={() => handleApprove(appt.id)}
                            disabled={working === appt.id}
                            style={styles.success}
                          >
                            Confirmar
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
