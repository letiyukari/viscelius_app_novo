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

const fallbackName = "Usuário";
const slotStatusText = {
  OPEN: "Disponível",
  HELD: "Reservado",
  BOOKED: "Confirmado",
};
const appointmentStatusLabels = {
  pending: "Pendente",
  confirmed: "Confirmado",
  declined: "Recusado",
  canceled: "Cancelado",
};

const normalizeStatus = (status) => String(status || "").toLowerCase();

const slotBadgeClass = (status) => {
  switch (status) {
    case "OPEN":
      return "tw-badge tw-badge-available";
    case "HELD":
      return "tw-badge tw-badge-held";
    case "BOOKED":
      return "tw-badge tw-badge-booked";
    default:
      return "tw-badge tw-badge-muted";
  }
};

const appointmentBadgeClass = (status) => {
  switch (normalizeStatus(status)) {
    case "pending":
      return "tw-badge tw-badge-pending";
    case "confirmed":
      return "tw-badge tw-badge-confirmed";
    case "canceled":
      return "tw-badge tw-badge-canceled";
    case "declined":
      return "tw-badge tw-badge-muted";
    default:
      return "tw-badge tw-badge-muted";
  }
};

const fmtDateWithWeekday = (iso) => {
  try {
    const date = new Date(iso);
    const datePart = date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const weekday = date.toLocaleDateString("pt-BR", { weekday: "long" });
    return `${datePart} (${weekday})`;
  } catch (error) {
    console.error(error);
    return iso;
  }
};

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    console.error(error);
    return iso;
  }
};

const fmtTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (error) {
    console.error(error);
    return iso;
  }
};

const fmtDuration = (startIso, endIso) => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "--";
  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  return `${minutes} min`;
};

const toMillis = (value) => {
  if (!value) return Number.NaN;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? Number.NaN : date.getTime();
};

const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const rangeDays = (n = 30) => {
  const out = [];
  const base = new Date();
  for (let i = 0; i < n; i += 1) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    out.push(d);
  }
  return out;
};

const extractSpecialties = (profile = {}) => {
  if (Array.isArray(profile.specialties)) {
    return profile.specialties
      .map((value) => (value == null ? "" : String(value).trim()))
      .filter(Boolean);
  }
  if (profile.specialty) {
    const single = String(profile.specialty).trim();
    return single ? [single] : [];
  }
  if (profile.specialtyText) {
    return String(profile.specialtyText)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }
  return [];
};

export default function AgendaPage({ user }) {
  const patientId = user?.uid || user?.id || user?.userId || null;

  const days = useMemo(() => rangeDays(30), []);
  const pageSize = 7;
  const [weekIndex, setWeekIndex] = useState(0);
  const pagedDays = useMemo(
    () => days.slice(weekIndex * pageSize, weekIndex * pageSize + pageSize),
    [days, weekIndex]
  );
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
  const sortedAppointments = useMemo(
    () =>
      appointments
        .slice()
        .sort((a, b) => toMillis(a.slotStartsAt) - toMillis(b.slotStartsAt)),
    [appointments]
  );

  const upcomingAppointments = useMemo(() => {
    const now = Date.now() - 5 * 60 * 1000;
    return sortedAppointments.filter((appt) => {
      const status = normalizeStatus(appt.status);
      if (status !== "pending" && status !== "confirmed") return false;
      const endMs = toMillis(appt.slotEndsAt || appt.endTime);
      if (Number.isNaN(endMs)) return true;
      return endMs >= now;
    });
  }, [sortedAppointments]);

  const otherUpcomingAppointments = useMemo(() => {
    const now = Date.now() - 5 * 60 * 1000;
    return sortedAppointments.filter((appt) => {
      const status = normalizeStatus(appt.status);
      if (status === "pending" || status === "confirmed") return false;
      const endMs = toMillis(appt.slotEndsAt || appt.endTime);
      if (Number.isNaN(endMs)) return false;
      return endMs >= now;
    });
  }, [sortedAppointments]);

  const pastAppointments = useMemo(() => {
    const now = Date.now() - 5 * 60 * 1000;
    return sortedAppointments
      .filter((appt) => {
        const endMs = toMillis(appt.slotEndsAt || appt.endTime);
        if (Number.isNaN(endMs)) return false;
        return endMs < now;
      })
      .sort((a, b) => toMillis(b.slotStartsAt) - toMillis(a.slotStartsAt))
      .slice(0, 12);
  }, [sortedAppointments]);

  useEffect(() => {
    if (!patientId) return;
    let active = true;
    getMultipleUserProfiles([patientId])
      .then((map) => {
        if (active) setProfiles((prev) => ({ ...prev, ...map }));
      })
      .catch((error) => console.error(error));
    return () => {
      active = false;
    };
  }, [patientId]);

  useEffect(() => {
    if (!patientId) {
      setAppointments([]);
      return undefined;
    }
    let unsub = null;
    const timer = setTimeout(() => {
      unsub = subscribePatientAppointments(patientId, (data) => setAppointments(data || []));
    }, 160);
    return () => {
      clearTimeout(timer);
      if (typeof unsub === "function") unsub();
    };
  }, [patientId]);

  useEffect(() => {
    let mounted = true;
    async function loadTherapists() {
      try {
        setTherapistsLoading(true);
        setTherapistError("");

        const cg = await getDocs(collectionGroup(db, "slots"));
        const ids = new Set();
        cg.forEach((docSnap) => {
          const data = docSnap.data();
          const status = data?.status;
          if (status === "OPEN" || status === "HELD") {
            const parts = docSnap.ref.path.split("/");
            const tid = parts[1];
            if (tid) ids.add(tid);
          }
        });
        appointments.forEach((appt) => {
          if (appt?.therapistId) ids.add(appt.therapistId);
        });

        const idList = Array.from(ids);
        if (idList.length === 0) {
          if (!mounted) return;
          setAllTherapists([]);
          setTherapists([]);
          setSpecialtyOptions([]);
          setSelectedId(null);
          return;
        }

        const map = await getMultipleUserProfiles(idList, { forceRefresh: true });
        if (!mounted) return;

        const optionSet = new Set();
        const list = idList
          .map((uid) => {
            const profile = map[uid] || {};
            const { name, specialtyText } = resolveTherapistLabel({ uid, profile });
            extractSpecialties(profile).forEach((value) => optionSet.add(value));
            return {
              id: uid,
              ...profile,
              name,
              specialtyText,
              specialtyList: extractSpecialties(profile),
              photoURL: profile.photoURL || "",
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

        setProfiles((prev) => ({ ...prev, ...map }));
        setAllTherapists(list);
        setSpecialtyOptions(Array.from(optionSet).sort((a, b) => a.localeCompare(b, "pt-BR")));
      } catch (error) {
        console.error(error);
        if (mounted) setTherapistError("Não foi possível carregar musicoterapeutas.");
      } finally {
        if (mounted) setTherapistsLoading(false);
      }
    }

    loadTherapists();
    return () => {
      mounted = false;
    };
  }, [appointments]);

  useEffect(() => {
    const filtered =
      specialtyFilter === "all"
        ? allTherapists
        : allTherapists.filter((therapist) => therapist.specialtyList.includes(specialtyFilter));
    setTherapists(filtered);
  }, [allTherapists, specialtyFilter]);

  useEffect(() => {
    setSelectedId((prev) => {
      if (prev && allTherapists.some((therapist) => therapist.id === prev)) {
        return prev;
      }
      return therapists[0]?.id || null;
    });
  }, [therapists, allTherapists]);

  useEffect(() => {
    if (!selectedId || profiles[selectedId]) return undefined;
    let active = true;
    getMultipleUserProfiles([selectedId], { forceRefresh: true })
      .then((map) => {
        if (!active) return;
        setProfiles((prev) => ({ ...prev, ...map }));
      })
      .catch((error) => console.error(error));
    return () => {
      active = false;
    };
  }, [selectedId, profiles]);

  const selectedTherapist = useMemo(
    () => therapists.find((therapist) => therapist.id === selectedId) || null,
    [therapists, selectedId]
  );

  useEffect(() => {
    if (!selectedId) {
      setSlots([]);
      setSlotsLoading(false);
      return undefined;
    }
    let active = true;
    setSlotsLoading(true);
    setSlotsError("");

    let unsub = null;
    const timer = setTimeout(() => {
      unsub = subscribeSlots(
        selectedId,
        (data) => {
          if (!active) return;
          setSlots(data || []);
          setSlotsLoading(false);
        },
        (error) => {
          console.error(error);
          if (!active) return;
          setSlotsError("Não foi possível carregar os horários deste musicoterapeuta.");
          setSlotsLoading(false);
        }
      );
    }, 160);

    return () => {
      active = false;
      clearTimeout(timer);
      if (typeof unsub === "function") unsub();
    };
  }, [selectedId]);

  const appointmentsBySlot = useMemo(() => {
    const map = {};
    appointments.forEach((appt) => {
      const parts = (appt.slotPath || "").split("/");
      const slotId = parts[3];
      if (slotId) {
        map[slotId] = appt;
      }
    });
    return map;
  }, [appointments]);

  const slotsByDay = useMemo(() => {
    const now = Date.now();
    const grouped = {};
    slots.forEach((slot) => {
      if (!slot?.startsAt || !slot?.endsAt) return;
      const end = new Date(slot.endsAt).getTime();
      if (end && end < now) return;
      if (slot.status === "BOOKED" && !appointmentsBySlot[slot.id]) return;
      const key = ymd(new Date(slot.startsAt));
      (grouped[key] = grouped[key] || []).push(slot);
    });
    Object.values(grouped).forEach((list) => {
      list.sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));
    });
    return grouped;
  }, [slots, appointmentsBySlot]);

  const patientProfile = profiles[patientId];
  const patientName =
    (patientProfile?.displayName || patientProfile?.name || fallbackName).trim() || fallbackName;
  const patientCondition = (patientProfile?.condition || "").trim();
  const patientLabel = patientCondition ? `${patientName} (${patientCondition})` : patientName;

  const handleSelectTherapist = (id) => {
    setSelectedId(id);
    setWeekIndex(0);
    setActiveDay(ymd(days[0]));
  };

  async function onRequest(slot) {
    if (!patientId || !selectedId) return;
    try {
      setRequestingSlotId(slot.id);
      setSlotsError("");
      await requestAppointment({ patientId, therapistId: selectedId, slotId: slot.id });
    } catch (error) {
      console.error(error);
      setSlotsError(error?.message || "Não foi possível solicitar este horário.");
    } finally {
      setRequestingSlotId(null);
    }
  }

  async function onCancel(apptId) {
    if (!apptId) return;
    const confirmCancel =
      typeof window !== "undefined" && typeof window.confirm === "function"
        ? window.confirm("Tem certeza que deseja cancelar o agendamento?")
        : true;
    if (!confirmCancel) return;

    const previous = appointments.find((appt) => appt.id === apptId) || null;
    const previousStatus = normalizeStatus(previous?.status);

    try {
      setCancelingId(apptId);
      setSlotsError("");
      if (previous && previousStatus !== "canceled") {
        setAppointments((prev) =>
          prev.map((appt) => (appt.id === apptId ? { ...appt, status: "canceled" } : appt))
        );
      }
      await cancelAppointment(apptId);
    } catch (error) {
      console.error(error);
      if (previous) {
        setAppointments((prev) => prev.map((appt) => (appt.id === apptId ? previous : appt)));
      }
      const message = error?.message || "Não foi possível cancelar este agendamento.";
      setSlotsError(message);
      alert(message);
    } finally {
      setCancelingId(null);
    }
  }

  const selectedLabel = selectedTherapist
    ? resolveTherapistLabel({ uid: selectedTherapist.id, profile: selectedTherapist })
    : null;

  const currentSlots = slotsByDay[activeDay] || [];

  return (
    <div className="tw-min-h-screen tw-bg-slate-50 tw-font-inter tw-p-8">
      <div className="tw-max-w-6xl tw-mx-auto tw-space-y-6">
        <header className="tw-space-y-2">
          <span className="tw-pill">Agenda do paciente</span>
          <h1 className="tw-text-2xl tw-font-bold tw-text-slate-900">Encontre o melhor horário para a sua próxima sessão</h1>
          <p className="tw-text-sm tw-text-slate-600 tw-text-balance">
            Consulte a agenda do seu musicoterapeuta em tempo real, escolha horários disponíveis e acompanhe o status das suas solicitações confirmadas.
          </p>
        </header>

        <div className="tw-flex tw-gap-6 tw-items-start">
          <aside className="tw-w-72 tw-space-y-4">
            <div className="tw-card">
              <div className="tw-card-header">
                <div className="tw-flex tw-flex-col tw-gap-1">
                  <span className="tw-text-xs tw-font-semibold tw-text-slate-500 tw-uppercase">
                    Musicoterapeutas
                  </span>
                  <span className="tw-text-sm tw-text-slate-600">
                    Selecione um profissional para visualizar a agenda.
                  </span>
                </div>
              </div>
              <div className="tw-card-body tw-space-y-3">
                <div className="tw-filter-wrap">
                  <label className="tw-text-xs tw-font-semibold tw-text-slate-500" htmlFor="specialty-filter">
                    Filtrar por especialidade
                  </label>
                  <select
                    id="specialty-filter"
                    className="tw-select"
                    value={specialtyFilter}
                    onChange={(event) => setSpecialtyFilter(event.target.value)}
                  >
                    <option value="all">Todas as especialidades</option>
                    {specialtyOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <TherapistList
                  therapists={therapists}
                  selectedId={selectedId}
                  onSelect={handleSelectTherapist}
                  loading={therapistsLoading}
                  error={therapistError}
                />
              </div>
            </div>
          </aside>

          <section className="tw-flex-1 tw-space-y-4">
            <div className="tw-card">
              <div className="tw-card-header">
                <div>
                  <h2 className="tw-text-lg tw-font-semibold tw-text-slate-900">Agenda disponível</h2>
                  <p className="tw-text-sm tw-text-slate-600">
                    Atualizada automaticamente conforme o terapeuta publica ou altera horários.
                  </p>
                </div>
                {selectedLabel && (
                  <div className="tw-text-right tw-space-y-1">
                    <p className="tw-text-sm tw-font-semibold tw-text-slate-900">{selectedLabel.name}</p>
                    <p className="tw-text-xs tw-text-slate-500">{selectedLabel.specialtyText}</p>
                  </div>
                )}
              </div>

              <div className="tw-meta-row">
                <span className="tw-inline-flex tw-items-center tw-gap-2">
                  <Icons.ClockIcon /> Duração padrão: 50 min
                </span>
                <span className="tw-inline-flex tw-items-center tw-gap-2">
                  <Icons.VideoIcon /> Modalidade: Online
                </span>
                {slotsError && <span className="tw-text-xs tw-font-semibold tw-text-slate-700">{slotsError}</span>}
              </div>

              <div className="tw-card-body tw-space-y-3">
                <div className="tw-inline-flex tw-items-center tw-gap-2">
                  <button
                    className="tw-btn tw-btn-secondary"
                    disabled={weekIndex === 0}
                    onClick={() => setWeekIndex((index) => Math.max(0, index - 1))}
                  >
                    ←
                  </button>
                  <div className="tw-flex tw-gap-2 tw-items-center">
                    {pagedDays.map((day) => {
                      const key = ymd(day);
                      const active = key === activeDay;
                      const label = day.toLocaleDateString([], {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      });
                      return (
                        <button
                          key={key}
                          className={active ? "tw-btn tw-btn-primary" : "tw-btn tw-btn-ghost"}
                          onClick={() => setActiveDay(key)}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    className="tw-btn tw-btn-secondary"
                    disabled={(weekIndex + 1) * pageSize >= days.length}
                    onClick={() =>
                      setWeekIndex((index) =>
                        (index + 1) * pageSize >= days.length ? index : index + 1
                      )
                    }
                  >
                    →
                  </button>
                </div>

                {slotsLoading ? (
                  <div className="tw-empty-state">Carregando horários...</div>
                ) : currentSlots.length === 0 ? (
                  <div className="tw-empty-state">Nenhum horário disponível para este dia.</div>
                ) : (
                  <div className="tw-overflow-x-auto">
                    <table className="tw-table tw-table-fixed">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Início</th>
                          <th>Fim</th>
                          <th>Duração</th>
                          <th>Status</th>
                          <th className="tw-text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentSlots.map((slot) => {
                          const appt = appointmentsBySlot[slot.id];
                          const myStatus = appt?.status;
                          const normalizedMyStatus = normalizeStatus(myStatus);
                          const requesting = requestingSlotId === slot.id;
                          const canceling = appt && cancelingId === appt.id;
                          const canCancel =
                            normalizedMyStatus === "pending" || normalizedMyStatus === "confirmed";
                          const disabled = (slot.status !== "OPEN" && !myStatus) || requesting;
                          const actionLabel = requesting
                            ? "Solicitando..."
                            : myStatus
                            ? "Solicitado"
                            : "Solicitar";

                          return (
                            <tr key={slot.id}>
                              <td>{fmtDate(slot.startsAt)}</td>
                              <td>{fmtTime(slot.startsAt)}</td>
                              <td>{fmtTime(slot.endsAt)}</td>
                              <td>{fmtDuration(slot.startsAt, slot.endsAt)}</td>
                              <td>
                                <div className="tw-tag-group">
                                  <span className={slotBadgeClass(slot.status)}>
                                    {slotStatusText[slot.status] || slot.status}
                                  </span>
                                  {myStatus && (
                                    <span className={appointmentBadgeClass(myStatus)}>
                                      Minha solicitação:{" "}
                                      {appointmentStatusLabels[normalizedMyStatus] ||
                                        normalizedMyStatus.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="tw-text-right">
                                {canCancel && appt ? (
                                  <button
                                    className="tw-btn tw-btn-danger"
                                    onClick={() => onCancel(appt.id)}
                                    disabled={canceling}
                                  >
                                    {canceling ? "Cancelando..." : "Cancelar"}
                                  </button>
                                ) : normalizedMyStatus === "canceled" ? (
                                  <span className={appointmentBadgeClass(appt.status)}>Cancelado</span>
                                ) : (
                                  <button
                                    className="tw-btn tw-btn-primary"
                                    onClick={() => onRequest(slot)}
                                    disabled={disabled}
                                  >
                                    {actionLabel}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="tw-card">
              <div className="tw-card-header">
                <div>
                  <h2 className="tw-text-lg tw-font-semibold tw-text-slate-900">Meus agendamentos</h2>
                  <p className="tw-text-sm tw-text-slate-600">
                    Acompanhe o status de cada solicitação e cancele quando necessário.
                  </p>
                </div>
              </div>
              <div className="tw-card-body tw-space-y-3">
                {appointments.length === 0 ? (
                  <div className="tw-empty-state">Você ainda não possui solicitações registradas.</div>
                ) : (
                  appointments
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(a.slotStartsAt).getTime() - new Date(b.slotStartsAt).getTime()
                    )
                    .map((appt) => {
                      const therapistLabel = resolveTherapistLabel({
                        uid: appt.therapistId,
                        profile: profiles[appt.therapistId],
                      });
                      const normalizedStatus = normalizeStatus(appt.status);
                      return (
                        <div key={appt.id} className="tw-flex tw-justify-between tw-items-center tw-gap-3">
                          <div className="tw-flex tw-flex-col tw-gap-1">
                            <span className="tw-text-sm tw-font-semibold tw-text-slate-900">
                              {fmtDateWithWeekday(appt.slotStartsAt)} → {fmtTime(appt.slotStartsAt)} - {fmtTime(appt.slotEndsAt)}
                            </span>
                            <span className="tw-text-xs tw-text-slate-500">
                              Musicoterapeuta: {therapistLabel.name} - {therapistLabel.specialtyText}
                            </span>
                            <span className="tw-text-xs tw-text-slate-500">Paciente: {patientLabel}</span>
                            <span className={appointmentBadgeClass(appt.status)}>
                              {appointmentStatusLabels[normalizedStatus] || normalizedStatus.toUpperCase()}
                            </span>
                          </div>
                          {normalizedStatus === "pending" || normalizedStatus === "confirmed" ? (
                            <button
                              className="tw-btn tw-btn-danger"
                              onClick={() => onCancel(appt.id)}
                              disabled={cancelingId === appt.id}
                            >
                              {cancelingId === appt.id ? "Cancelando..." : "Cancelar"}
                            </button>
                          ) : normalizedStatus === "canceled" ? (
                            <span className={appointmentBadgeClass(appt.status)}>Cancelado</span>
                          ) : null}
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}







