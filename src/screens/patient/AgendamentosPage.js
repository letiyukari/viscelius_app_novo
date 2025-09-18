// src/screens/patient/AgendamentosPage.js
import React, { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase";
import { collectionGroup, getDocs, getDoc, doc } from "firebase/firestore";
import Icons from "../../components/common/Icons";
import {
  listOpenSlotsByTherapist,
  requestAppointment,
  subscribePatientAppointments,
  cancelAppointment,
} from "../../services/agenda";

/* -------------------- helpers -------------------- */
const fmtDT = (iso) => new Date(iso).toLocaleString();
const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
const rangeDays = (n = 30) => {
  const out = [];
  const base = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    out.push(d);
  }
  return out;
};

/* -------------------- ui styles -------------------- */
const token = {
  bg: "#F9FAFB",
  panel: "#FFFFFF",
  border: "#E5E7EB",
  text: "#111827",
  sub: "#6B7280",
  brand: "#7C3AED",
  brandSoft: "#F5F3FF",
  success: "#065F46",
  warn: "#92400E",
  info: "#1D4ED8",
  danger: "#EF4444",
};

const styles = {
  page: {
    padding: "28px 36px",
    background: token.bg,
    minHeight: "100vh",
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial",
  },
  h1: { margin: 0, fontSize: 28, fontWeight: 800, color: token.text },
  sub: { margin: "8px 0 24px", color: token.sub },

  layout: { display: "grid", gridTemplateColumns: "340px 1fr", gap: 24 },

  // left
  tList: { display: "flex", flexDirection: "column", gap: 12 },
  tCard: {
    border: `1px solid ${token.border}`,
    borderRadius: 16,
    background: token.panel,
    padding: 14,
    display: "flex",
    gap: 12,
    alignItems: "center",
    cursor: "pointer",
    transition: "border-color .2s, box-shadow .2s",
  },
  tCardSel: { borderColor: token.brand, boxShadow: "0 0 0 4px " + token.brandSoft },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "#E5E7EB",
    objectFit: "cover",
    flex: "0 0 48px",
  },
  tName: { margin: 0, fontWeight: 700, color: token.text },
  tSpec: { margin: 0, color: token.sub, fontSize: 13 },

  // right
  panel: {
    border: `1px solid ${token.border}`,
    borderRadius: 16,
    background: token.panel,
    overflow: "hidden",
  },

  // header w/ week nav
  weekHeader: {
    padding: "12px 12px 8px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    borderBottom: `1px solid ${token.border}`,
    flexWrap: "wrap",
  },
  navBtn: {
    border: `1px solid ${token.border}`,
    background: token.panel,
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
  },
  pills: { display: "flex", gap: 8, flexWrap: "wrap" },
  pill: (active) => ({
    border: "none",
    borderRadius: 999,
    padding: "8px 12px",
    cursor: "pointer",
    background: active ? token.brandSoft : "#fff",
    color: active ? token.brand : token.sub,
    fontWeight: 700,
    boxShadow: active ? "inset 0 0 0 1px " + token.brand : `inset 0 0 0 1px ${token.border}`,
  }),

  metaRow: {
    display: "flex",
    gap: 16,
    color: token.sub,
    padding: "12px 16px",
    borderBottom: `1px solid ${token.border}`,
    alignItems: "center",
  },

  slots: { display: "grid", gap: 12, padding: 16 },
  slotCard: {
    border: `1px solid ${token.border}`,
    borderRadius: 14,
    padding: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  left: { display: "flex", flexDirection: "column", gap: 4 },
  time: { fontWeight: 800 },
  line: { fontSize: 13, color: token.text },

  badge: (type) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 800,
    padding: "4px 8px",
    borderRadius: 999,
    color:
      type === "OPEN" ? token.success : type === "HELD" ? token.warn : type === "BOOKED" ? token.info : token.text,
    background:
      type === "OPEN"
        ? "#ECFDF5"
        : type === "HELD"
        ? "#FFF7ED"
        : type === "BOOKED"
        ? "#EFF6FF"
        : token.brandSoft,
    border:
      type === "OPEN"
        ? "1px solid #A7F3D0"
        : type === "HELD"
        ? "1px solid #FED7AA"
        : type === "BOOKED"
        ? "1px solid #BFDBFE"
        : "1px solid " + token.brand,
  }),

  primary: (disabled) => ({
    background: disabled ? "#C7D2FE" : token.brand,
    color: "#fff",
    border: "none",
    padding: "10px 14px",
    borderRadius: 12,
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 800,
    minWidth: 120,
  }),
  danger: {
    background: token.danger,
    color: "#fff",
    border: "none",
    padding: "10px 14px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 800,
    minWidth: 120,
  },

  mySection: { padding: 16, borderTop: `1px solid ${token.border}` },
  myTitle: { fontSize: 16, fontWeight: 800, margin: "0 0 10px" },
  myList: { display: "grid", gap: 10 },
  myItem: {
    border: `1px solid ${token.border}`,
    borderRadius: 14,
    background: token.panel,
    padding: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
};

/* -------------------- component -------------------- */
export default function AgendamentosPage({ user }) {
  const patientId = user?.uid || user?.id || user?.userId || null;

  // terapeutas
  const [therapists, setTherapists] = useState([]);
  const [tLoading, setTLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  // datas (30 dias) com paginação por semana
  const days = useMemo(() => rangeDays(30), []);
  const pageSize = 7;
  const [weekIndex, setWeekIndex] = useState(0);
  const pagedDays = useMemo(
    () => days.slice(weekIndex * pageSize, weekIndex * pageSize + pageSize),
    [days, weekIndex]
  );
  const [activeDay, setActiveDay] = useState(ymd(days[0]));

  // slots e pedidos
  const [slots, setSlots] = useState([]);
  const [sLoading, setSLoading] = useState(false);
  const [requestingSlotId, setRequestingSlotId] = useState(null);
  const [error, setError] = useState("");

  // meus agendamentos
  const [myAppts, setMyAppts] = useState([]);
  const [cancelingId, setCancelingId] = useState(null);

  /* ---- terapeutas que possuem slots ---- */
  useEffect(() => {
    async function fetchTherapists() {
      try {
        setTLoading(true);
        const cg = await getDocs(collectionGroup(db, "slots"));
        const ids = new Set();
        cg.forEach((d) => {
          const data = d.data();
          if (["OPEN", "HELD"].includes(data.status)) {
            const parts = d.ref.path.split("/");
            const tid = parts[1];
            if (tid) ids.add(tid);
          }
        });

        const list = [];
        for (const tid of Array.from(ids)) {
          let name = "Terapeuta";
          let specialty = "Musicoterapia";
          let photoURL = "";
          try {
            const u = await getDoc(doc(db, "users", tid));
            if (u.exists()) {
              const ud = u.data();
              name = ud.name || name;
              specialty = ud.specialty || specialty;
              photoURL = ud.photoURL || "";
            }
          } catch {}
          list.push({ id: tid, name, specialty, photoURL });
        }
        list.sort((a, b) => a.name.localeCompare(b.name));
        setTherapists(list);
        if (list.length) setSelected(list[0]);
      } finally {
        setTLoading(false);
      }
    }
    fetchTherapists();
  }, []);

  /* ---- slots do terapeuta selecionado ---- */
  useEffect(() => {
    async function load() {
      if (!selected?.id) return;
      setSLoading(true);
      setError("");
      try {
        const list = await listOpenSlotsByTherapist(selected.id);
        list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
        setSlots(list);
      } catch (e) {
        console.error(e);
        setError("Não foi possível carregar os horários deste terapeuta.");
      } finally {
        setSLoading(false);
      }
    }
    load();
  }, [selected]);

  /* ---- assina meus agendamentos ---- */
  useEffect(() => {
    if (!patientId) return;
    const unsub = subscribePatientAppointments(patientId, (appts) => setMyAppts(appts));
    return () => unsub && unsub();
  }, [patientId]);

  // map de appointment por slotId (para saber se já solicitei)
  const apptBySlot = useMemo(() => {
    const map = {};
    for (const a of myAppts) {
      const parts = (a.slotPath || "").split("/");
      const slotId = parts[3];
      if (slotId) map[slotId] = a;
    }
    return map;
  }, [myAppts]);

  // slots por dia
  const slotsByDay = useMemo(() => {
    const m = {};
    for (const s of slots) {
      const key = ymd(new Date(s.startsAt));
      (m[key] ||= []).push(s);
    }
    Object.values(m).forEach((arr) => arr.sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
    return m;
  }, [slots]);

  /* -------------------- actions -------------------- */
  async function onRequest(slot) {
    if (!patientId || !selected?.id) return;
    try {
      setRequestingSlotId(slot.id);
      setError("");
      await requestAppointment({ patientId, therapistId: selected.id, slotId: slot.id });
    } catch (e) {
      console.error(e);
      setError(e?.message || "Não foi possível solicitar este horário.");
    } finally {
      setRequestingSlotId(null);
    }
  }

  async function onCancel(apptId) {
    try {
      setCancelingId(apptId);
      await cancelAppointment(apptId);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Não foi possível cancelar.");
    } finally {
      setCancelingId(null);
    }
  }

  /* -------------------- render -------------------- */
  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>Agendar Sessão</h1>
      <p style={styles.sub}>Encontre o melhor horário para sua próxima consulta.</p>

      <div style={styles.layout}>
        {/* LEFT – Terapeutas */}
        <div>
          <h3 style={{ margin: "0 0 10px", fontWeight: 800, color: token.text }}>Nossos Terapeutas</h3>
          {tLoading ? (
            <div style={{ color: token.sub }}>Carregando...</div>
          ) : therapists.length === 0 ? (
            <div style={{ color: token.sub }}>Nenhum terapeuta encontrado.</div>
          ) : (
            <div style={styles.tList}>
              {therapists.map((t) => {
                const sel = selected?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelected(t)}
                    style={{ ...styles.tCard, ...(sel ? styles.tCardSel : {}) }}
                  >
                    {t.photoURL ? <img src={t.photoURL} alt="" style={styles.avatar} /> : <div style={styles.avatar} />}
                    <div>
                      <p style={styles.tName}>{t.name}</p>
                      <p style={styles.tSpec}>{t.specialty}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT – Agenda */}
        <div style={styles.panel}>
          {/* header com paginação semanal */}
          <div style={styles.weekHeader}>
            <button
              style={styles.navBtn}
              disabled={weekIndex === 0}
              onClick={() => setWeekIndex((i) => Math.max(0, i - 1))}
            >
              ←
            </button>
            <div style={styles.pills}>
              {pagedDays.map((d) => {
                const key = ymd(d);
                const active = key === activeDay;
                const label = d.toLocaleDateString([], {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                });
                return (
                  <button key={key} style={styles.pill(active)} onClick={() => setActiveDay(key)}>
                    {label}
                  </button>
                );
              })}
            </div>
            <button
              style={styles.navBtn}
              disabled={(weekIndex + 1) * pageSize >= days.length}
              onClick={() =>
                setWeekIndex((i) => ((i + 1) * pageSize >= days.length ? i : i + 1))
              }
            >
              →
            </button>
          </div>

          <div style={styles.metaRow}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icons.ClockIcon /> Duração: 50 min
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icons.VideoIcon /> Modalidade: Online
            </span>
            {error && <span style={{ color: token.danger, fontWeight: 700 }}>{error}</span>}
          </div>

          {/* slots */}
          {sLoading ? (
            <div style={{ padding: 16, color: token.sub }}>Carregando horários...</div>
          ) : (slotsByDay[activeDay] || []).length === 0 ? (
            <div style={{ padding: 16, color: token.sub }}>Nenhum horário disponível para este dia.</div>
          ) : (
            <div style={styles.slots}>
              {(slotsByDay[activeDay] || []).map((s) => {
                const appt = apptBySlot[s.id];
                const myStatus = appt?.status; // PENDING/CONFIRMED...
                const requesting = requestingSlotId === s.id;
                const disabled = (s.status !== "OPEN" && !myStatus) || requesting;

                return (
                  <div key={s.id} style={styles.slotCard}>
                    <div style={styles.left}>
                      <div style={styles.time}>
                        {fmtTime(s.startsAt)} — {fmtTime(s.endsAt)}
                      </div>
                      <div style={styles.line}>
                        <span style={{ marginRight: 8, ...styles.badge(s.status) }}>{s.status}</span>
                        {myStatus && (
                          <span style={styles.badge("MEU")}>Sua solicitação: {myStatus}</span>
                        )}
                      </div>
                    </div>

                    {myStatus === "PENDING" ? (
                      <button style={styles.danger} onClick={() => onCancel(appt.id)} disabled={cancelingId === appt.id}>
                        {cancelingId === appt.id ? "Cancelando..." : "Cancelar"}
                      </button>
                    ) : (
                      <button style={styles.primary(disabled)} onClick={() => onRequest(s)} disabled={disabled}>
                        {requesting ? "Solicitando..." : myStatus ? "Solicitado" : "Solicitar"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Meus agendamentos */}
          <div style={styles.mySection}>
            <h4 style={styles.myTitle}>Meus Agendamentos</h4>
            {myAppts.length === 0 ? (
              <div style={{ color: token.sub }}>Você ainda não possui solicitações.</div>
            ) : (
              <div style={styles.myList}>
                {myAppts.map((a) => (
                  <div key={a.id} style={styles.myItem}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{fmtDT(a.slotStartsAt)} → {fmtDT(a.slotEndsAt)}</div>
                      <div style={{ fontSize: 13 }}>
                        Status: <span style={styles.badge(a.status)}>{a.status}</span>
                      </div>
                    </div>
                    <button
                      style={styles.danger}
                      onClick={() => onCancel(a.id)}
                      disabled={cancelingId === a.id}
                    >
                      {cancelingId === a.id ? "Cancelando..." : "Cancelar"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
