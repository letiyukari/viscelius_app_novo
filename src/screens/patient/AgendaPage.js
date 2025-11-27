// src/screens/patient/AgendaPage.js
import React, { useEffect, useMemo, useState } from "react";
import { collectionGroup, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import Icons from "../../components/common/Icons";
import TherapistList from "../../components/therapists/TherapistList";
import {
  requestAppointment,
  subscribePatientAppointments,
  cancelAppointment,
  subscribeSlots,
} from "../../services/agenda";
import {
  getMultipleUserProfiles,
  resolveTherapistLabel,
} from "../../services/usersService";
import "./AgendaPage.css";

const fmtDateWithWeekday = (iso) => { try { const date = new Date(iso); const datePart = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }); const weekday = date.toLocaleDateString("pt-BR", { weekday: "long" }); return `${datePart} (${weekday})`; } catch (error) { return iso; } };
const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }); } catch (error) { return iso; } };
const fmtTime = (iso) => { try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch (error) { return iso; } };
const fmtDuration = (startIso, endIso) => { const start = new Date(startIso); const end = new Date(endIso); if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "--"; const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000)); return `${minutes} min`; };
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const rangeDays = (n = 30) => { const out = []; const base = new Date(); for (let i = 0; i < n; i += 1) { const d = new Date(base); d.setDate(d.getDate() + i); out.push(d); } return out; };
const extractSpecialties = (profile = {}) => { if (Array.isArray(profile.specialties)) { return profile.specialties.map((value) => (value == null ? "" : String(value).trim())).filter(Boolean); } if (profile.specialty) return [String(profile.specialty).trim()].filter(Boolean); if (profile.specialtyText) return String(profile.specialtyText).split(",").map((value) => value.trim()).filter(Boolean); return []; };

// ALTERADO: "Disponível" em vez de "Aberto"
const slotStatusText = { OPEN: "Disponível", HELD: "Reservado", BOOKED: "Ocupado" };

const appointmentStatusLabels = { 
  pending: "Pendente", 
  confirmed: "Confirmado", 
  declined: "Recusado", 
  canceled: "Cancelado", 
  // ALTERADO: "Finalizado" (Masculino)
  completed: "Finalizado"
};

const normalizeStatus = (status) => String(status || "").toLowerCase();

const slotBadgeClass = (status) => { switch (status) { case "OPEN": return "tw-badge tw-badge-available"; case "HELD": return "tw-badge tw-badge-held"; case "BOOKED": return "tw-badge tw-badge-booked"; default: return "tw-badge tw-badge-muted"; } };

const appointmentBadgeClass = (status) => {
  switch (normalizeStatus(status)) {
    case "pending": return "tw-badge tw-badge-pending";
    case "confirmed": return "tw-badge tw-badge-confirmed";
    case "canceled": return "tw-badge tw-badge-canceled";
    // MANTIDO: Verde (mesma classe de confirmado) para finalizado
    case "completed": return "tw-badge tw-badge-confirmed"; 
    default: return "tw-badge tw-badge-muted";
  }
};

export default function AgendaPage({ user }) {
  const patientId = user?.uid || user?.id || user?.userId || null;

  const days = useMemo(() => rangeDays(30), []);
  const pageSize = 7;
  const [weekIndex, setWeekIndex] = useState(0);
  const pagedDays = useMemo(() => days.slice(weekIndex * pageSize, weekIndex * pageSize + pageSize), [days, weekIndex]);
  const [activeDay, setActiveDay] = useState(() => ymd(days[0]));

  const [allTherapists, setAllTherapists] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [therapistsLoading, setTherapistsLoading] = useState(true);
  const [therapistError, setTherapistError] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [specialtyOptions, setSpecialtyOptions] = useState([]);

  const [slots, setSlots] = useState([]);
  const [slotsError, setSlotsError] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [requestingSlotId, setRequestingSlotId] = useState(null);

  const [appointments, setAppointments] = useState([]);
  const [cancelingId, setCancelingId] = useState(null);
  const [profiles, setProfiles] = useState({});

  useEffect(() => { if (!patientId) return; getMultipleUserProfiles([patientId]).then((map) => setProfiles((prev) => ({ ...prev, ...map }))).catch(console.error); }, [patientId]);
  useEffect(() => { if (!patientId) { setAppointments([]); return; } const unsub = subscribePatientAppointments(patientId, (data) => setAppointments(data || [])); return () => unsub && unsub(); }, [patientId]);

  useEffect(() => {
    let mounted = true;
    async function loadTherapists() {
      try {
        setTherapistsLoading(true); setTherapistError("");
        const cg = await getDocs(collectionGroup(db, "slots"));
        const ids = new Set();
        cg.forEach((docSnap) => {
          const data = docSnap.data();
          if (["OPEN", "HELD", "BOOKED"].includes(data?.status)) {
            const parts = docSnap.ref.path.split("/");
            if (parts[1]) ids.add(parts[1]);
          }
        });
        appointments.forEach((appt) => { if (appt?.therapistId) ids.add(appt.therapistId); });
        const idList = Array.from(ids);
        if (idList.length === 0) { if (mounted) { setAllTherapists([]); setTherapists([]); setSpecialtyOptions([]); setSelectedId(null); } return; }
        const map = await getMultipleUserProfiles(idList, { forceRefresh: true });
        if (!mounted) return;
        const optionSet = new Set();
        const list = idList.map((uid) => {
            const profile = map[uid] || {};
            const { name, specialtyText } = resolveTherapistLabel({ uid, profile });
            extractSpecialties(profile).forEach((value) => optionSet.add(value));
            return { id: uid, ...profile, name, specialtyText, specialtyList: extractSpecialties(profile), photoURL: profile.photoURL || "" };
          }).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
        setProfiles((prev) => ({ ...prev, ...map }));
        setAllTherapists(list);
        setSpecialtyOptions(Array.from(optionSet).sort((a, b) => a.localeCompare(b, "pt-BR")));
      } catch (error) { console.error(error); if (mounted) setTherapistError("Não foi possível carregar musicoterapeutas."); } finally { if (mounted) setTherapistsLoading(false); }
    }
    loadTherapists(); return () => { mounted = false; };
  }, [appointments]);

  useEffect(() => { const filtered = specialtyFilter === "all" ? allTherapists : allTherapists.filter((t) => t.specialtyList.includes(specialtyFilter)); setTherapists(filtered); }, [allTherapists, specialtyFilter]);
  useEffect(() => { setSelectedId((prev) => (prev && allTherapists.some((t) => t.id === prev) ? prev : therapists[0]?.id || null)); }, [therapists, allTherapists]);
  useEffect(() => { if (!selectedId || profiles[selectedId]) return; getMultipleUserProfiles([selectedId], { forceRefresh: true }).then((map) => setProfiles((prev) => ({ ...prev, ...map }))).catch(console.error); }, [selectedId, profiles]);
  const selectedTherapist = useMemo(() => therapists.find((t) => t.id === selectedId) || null, [therapists, selectedId]);
  useEffect(() => { if (!selectedId) { setSlots([]); setSlotsLoading(false); return; } setSlotsLoading(true); setSlotsError(""); const unsub = subscribeSlots(selectedId, (data) => { setSlots(data || []); setSlotsLoading(false); }, (err) => { console.error(err); setSlotsError("Erro ao carregar horários."); setSlotsLoading(false); }); return () => unsub && unsub(); }, [selectedId]);

  const appointmentsBySlot = useMemo(() => {
    const map = {};
    appointments.forEach((appt) => {
        if (appt.slotPath) {
            const parts = appt.slotPath.split("/");
            const slotId = parts[parts.length - 1];
            if (slotId) map[slotId] = appt;
        }
    });
    return map;
  }, [appointments]);

  const slotsByDay = useMemo(() => {
    const grouped = {};
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = ymd(now);

    slots.forEach((slot) => {
      if (!slot?.startsAt) return;
      const slotDate = new Date(slot.startsAt);
      const slotDayStr = ymd(slotDate);
      
      if (new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate()) < todayStart) {
          return;
      }

      if (slotDayStr === todayStr) {
          if (slot.status === "OPEN" && slotDate < now) {
              return; 
          }
      }

      const key = slotDayStr;
      (grouped[key] = grouped[key] || []).push(slot);
    });
    
    Object.values(grouped).forEach((list) => {
      list.sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));
    });
    return grouped;
  }, [slots]);

  const handleSelectTherapist = (id) => { setSelectedId(id); setWeekIndex(0); setActiveDay(ymd(days[0])); };

  async function onRequest(slot) {
    if (!patientId || !selectedId) return;
    try {
      setRequestingSlotId(slot.id); setSlotsError("");
      await requestAppointment({ patientId, therapistId: selectedId, slotId: slot.id });
    } catch (error) { console.error(error); setSlotsError(error?.message || "Erro ao solicitar."); } finally { setRequestingSlotId(null); }
  }

  async function onCancel(apptId) {
    if (!apptId) return;
    if (!window.confirm("Tem certeza que deseja cancelar?")) return;
    try {
      setCancelingId(apptId); setSlotsError("");
      await cancelAppointment(apptId);
    } catch (error) { console.error(error); alert(error?.message || "Erro ao cancelar."); } finally { setCancelingId(null); }
  }

  const selectedLabel = selectedTherapist ? resolveTherapistLabel({ uid: selectedTherapist.id, profile: selectedTherapist }) : null;
  const currentSlots = slotsByDay[activeDay] || [];
  
  const validAppointments = appointments.filter(appt => { const st = normalizeStatus(appt.status); return st !== 'canceled' && st !== 'declined'; });

  return (
    <div className="tw-min-h-screen tw-bg-slate-50 tw-font-inter tw-p-8">
      <div className="tw-max-w-6xl tw-mx-auto tw-space-y-6">
        <header className="tw-space-y-2">
          <span className="tw-pill">Agenda do paciente</span>
          <h1 className="tw-text-2xl tw-font-bold tw-text-slate-900">Agendar Sessão</h1>
        </header>

        <div className="tw-flex tw-gap-6 tw-items-start">
          <aside className="tw-w-72 tw-space-y-4">
            <div className="tw-card">
              <div className="tw-card-header"><span className="tw-text-xs tw-font-semibold tw-text-slate-500 tw-uppercase">Musicoterapeutas</span></div>
              <div className="tw-card-body tw-space-y-3">
                <div className="tw-filter-wrap">
                  <label className="tw-text-xs tw-font-semibold tw-text-slate-500">Filtrar especialidade</label>
                  <select className="tw-select" value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)}>
                    <option value="all">Todas</option>
                    {specialtyOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                  </select>
                </div>
                <TherapistList therapists={therapists} selectedId={selectedId} onSelect={handleSelectTherapist} loading={therapistsLoading} error={therapistError} />
              </div>
            </div>
          </aside>

          <section className="tw-flex-1 tw-space-y-4">
            <div className="tw-card">
              <div className="tw-card-header">
                <div>
                  <h2 className="tw-text-lg tw-font-semibold tw-text-slate-900">Agenda disponível</h2>
                  <p className="tw-text-sm tw-text-slate-600">Verifique a disponibilidade abaixo.</p>
                </div>
                {selectedLabel && (<div className="tw-text-right"><p className="tw-font-semibold">{selectedLabel.name}</p><p className="tw-text-xs text-slate-500">{selectedLabel.specialtyText}</p></div>)}
              </div>
              
              <div className="tw-card-body tw-space-y-3">
                <div className="tw-inline-flex tw-items-center tw-gap-2">
                  <button className="tw-btn tw-btn-secondary" disabled={weekIndex === 0} onClick={() => setWeekIndex(i => Math.max(0, i - 1))}>←</button>
                  <div className="tw-flex tw-gap-2">
                    {pagedDays.map(day => {
                      const key = ymd(day);
                      return (<button key={key} className={key === activeDay ? "tw-btn tw-btn-primary" : "tw-btn tw-btn-ghost"} onClick={() => setActiveDay(key)}>{day.toLocaleDateString([], { weekday: 'short', day: '2-digit' })}</button>)
                    })}
                  </div>
                  <button className="tw-btn tw-btn-secondary" disabled={(weekIndex + 1) * pageSize >= days.length} onClick={() => setWeekIndex(i => i + 1)}>→</button>
                </div>

                {slotsLoading ? <div className="tw-empty-state">Carregando...</div> : 
                 currentSlots.length === 0 ? <div className="tw-empty-state">Nenhum horário disponível para esta data.</div> : (
                  <table className="tw-table tw-table-fixed">
                    <thead><tr><th>Início</th><th>Fim</th><th>Status</th><th className="tw-text-right">Ação</th></tr></thead>
                    <tbody>
                      {currentSlots.map(slot => {
                        const appt = appointmentsBySlot[slot.id];
                        const myStatus = normalizeStatus(appt?.status);
                        const isMyActiveAppt = myStatus === 'pending' || myStatus === 'confirmed' || myStatus === 'completed';
                        const requesting = requestingSlotId === slot.id;
                        const canceling = appt && cancelingId === appt.id;
                        
                        const now = new Date();
                        const slotStart = new Date(slot.startsAt);
                        const isPast = slotStart < now;
                        
                        const isBlocked = (slot.status !== "OPEN" && !isMyActiveAppt) || (isPast && !isMyActiveAppt);

                        return (
                          <tr key={slot.id} style={{ opacity: isBlocked || isPast ? 0.6 : 1, backgroundColor: isBlocked ? '#f9fafb' : 'transparent' }}>
                            <td>{fmtTime(slot.startsAt)}</td>
                            <td>{fmtTime(slot.endsAt)}</td>
                            <td>
                              <div className="tw-tag-group">
                                <span className={slotBadgeClass(slot.status)}>{slotStatusText[slot.status] || slot.status}</span>
                                {isMyActiveAppt && <span className={appointmentBadgeClass(myStatus)}>Meu</span>}
                              </div>
                            </td>
                            <td className="tw-text-right">
                              {isMyActiveAppt ? (
                                myStatus === 'completed' ? (
                                    // ALTERADO: Texto verde para "Finalizado"
                                    <span className="tw-text-xs tw-font-semibold tw-text-green-600">{appointmentStatusLabels[myStatus]}</span>
                                ) : (
                                    <button className="tw-btn tw-btn-danger" onClick={() => onCancel(appt.id)} disabled={canceling}>{canceling ? "Cancelando..." : "Cancelar"}</button>
                                )
                              ) : isBlocked ? (
                                <span className="tw-text-xs tw-font-semibold tw-text-slate-400">{isPast ? "Expirado" : "Ocupado"}</span>
                              ) : (
                                <button className="tw-btn tw-btn-primary" onClick={() => onRequest(slot)} disabled={slot.status !== "OPEN" || requesting || isPast}>{requesting ? "..." : "Solicitar"}</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="tw-card">
              <div className="tw-card-header"><h2 className="tw-text-lg tw-font-semibold tw-text-slate-900">Meus agendamentos</h2></div>
              <div className="tw-card-body tw-space-y-3">
                {validAppointments.length === 0 ? <div className="tw-empty-state">Sem agendamentos ativos.</div> : 
                  validAppointments.slice().sort((a, b) => new Date(a.slotStartsAt) - new Date(b.slotStartsAt)).map(appt => {
                    const tLabel = resolveTherapistLabel({ uid: appt.therapistId, profile: profiles[appt.therapistId] });
                    const st = normalizeStatus(appt.status);
                    const hasLink = !!appt.meetingUrl;
                    const hasNotes = !!appt.summaryNotes;

                    return (
                      <div key={appt.id} className="tw-flex tw-flex-col tw-gap-3 tw-p-4 tw-border tw-border-slate-200 tw-rounded-xl tw-bg-white">
                        <div className="tw-flex tw-justify-between tw-items-center">
                            <div className="tw-flex tw-flex-col">
                              <span className="tw-text-sm tw-font-semibold">{fmtDateWithWeekday(appt.slotStartsAt)} • {fmtTime(appt.slotStartsAt)}</span>
                              <span className="tw-text-xs text-slate-500">Musicoterapeuta: {tLabel.name}</span>
                              <span className={appointmentBadgeClass(st)}>{appointmentStatusLabels[st]}</span>
                            </div>
                            {(st === "pending" || st === "confirmed") && (
                              <button className="tw-btn tw-btn-danger" onClick={() => onCancel(appt.id)} disabled={cancelingId === appt.id}>Cancelar</button>
                            )}
                        </div>
                        
                        {(hasLink || hasNotes) && (
                            <div className="tw-mt-2 tw-pt-3 tw-border-t tw-border-slate-100 tw-text-sm">
                                {hasLink && (
                                    <div className="tw-mb-2">
                                        <span className="tw-font-semibold tw-text-slate-700">Link da sala: </span>
                                        <a href={appt.meetingUrl} target="_blank" rel="noopener noreferrer" className="tw-text-blue-600 tw-underline">{appt.meetingUrl}</a>
                                    </div>
                                )}
                                {hasNotes && (
                                    <div>
                                        <span className="tw-font-semibold tw-text-slate-700">Observações: </span>
                                        <span className="tw-text-slate-600">{appt.summaryNotes}</span>
                                    </div>
                                )}
                            </div>
                        )}
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}