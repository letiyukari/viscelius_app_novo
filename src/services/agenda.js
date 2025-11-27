// src/services/agenda.js
import {
  collection,
  collectionGroup,
  doc,
  setDoc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { createConsultation, updateConsultation } from "./consultations";
import { generateJitsiRoomMetadata } from "./jitsiService";

// Helpers
function toIso(v) { if (!v) return null; if (typeof v === "string") return new Date(v).toISOString(); if (v instanceof Date) return v.toISOString(); throw new Error("Data inválida"); }
function docFromPath(path) { return doc(db, path); }
function normalizeAppointmentStatus(raw) { const value = String(raw || "").toLowerCase(); return ["pending", "confirmed", "canceled", "declined", "completed"].includes(value) ? value : "pending"; }
function normalizeSessionStatus(raw) { const value = String(raw || "").toLowerCase(); return ["scheduled", "in_progress", "completed", "canceled"].includes(value) ? value : "scheduled"; }
function coerceTimestamp(value, fallbackIso) { if (value && typeof value.toDate === "function") return value; const source = value ?? fallbackIso; if (!source) return undefined; const date = source instanceof Date ? source : typeof source === "string" ? new Date(source) : null; if (!date || Number.isNaN(date.getTime())) return undefined; return Timestamp.fromDate(date); }

// --- SLOTS ---

export async function publishSlots(therapistId, slots) {
  if (!therapistId) throw new Error("therapistId é obrigatório");
  const base = collection(db, "therapists", therapistId, "slots");
  const results = [];
  for (const s of slots) {
    const starts = toIso(s.startsAt);
    const ends = toIso(s.endsAt);
    const slotId = starts.replace(/[:.]/g, "_");
    const ref = doc(base, slotId);
    await setDoc(ref, { therapistId, startsAt: starts, endsAt: ends, status: "OPEN", createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
    results.push(ref);
  }
  return results;
}

export async function listOpenSlotsByTherapist(therapistId, fromIso) {
  const base = collection(db, "therapists", therapistId, "slots");
  const [openSnap, heldSnap] = await Promise.all([ getDocs(query(base, where("status", "==", "OPEN"))), getDocs(query(base, where("status", "==", "HELD"))) ]);
  const rows = [...openSnap.docs.map((d) => ({ id: d.id, ...d.data() })), ...heldSnap.docs.map((d) => ({ id: d.id, ...d.data() }))];
  const filtered = rows.filter((x) => (fromIso ? x.startsAt >= fromIso : true));
  filtered.sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));
  return filtered;
}

export function subscribeSlots(therapistId, cb, onError) {
  const base = collection(db, "therapists", therapistId, "slots");
  const qy = query(base, orderBy("startsAt", "asc"));
  const observer = { next: (snap) => { const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })); cb(data); } };
  if (onError) observer.error = onError;
  return onSnapshot(qy, observer);
}

export async function deleteSlot(therapistId, slotId) {
  const slotRef = doc(db, "therapists", therapistId, "slots", slotId);
  const snap = await getDoc(slotRef);
  if (!snap.exists()) throw new Error("Slot não encontrado");
  const slot = snap.data();
  if (slot.status !== "OPEN") throw new Error("Só é possível excluir horários com status ABERTO.");
  await deleteDoc(slotRef);
}

// --- APPOINTMENTS ---

export async function requestAppointment({ patientId, therapistId, slotId }) {
  if (!patientId || !therapistId || !slotId) throw new Error("patientId, therapistId e slotId são obrigatórios");

  const slotRef = doc(db, "therapists", therapistId, "slots", slotId);
  const slotSnap = await getDoc(slotRef);
  if (!slotSnap.exists()) throw new Error("Slot não encontrado");
  const slot = slotSnap.data();
  
  if (slot.status !== "OPEN") throw new Error("Slot não está disponível");

  const slotDate = new Date(slot.startsAt);
  const now = new Date();
  if (slotDate.getTime() < (now.getTime() - 60000)) {
      throw new Error("Este horário já expirou. Por favor, atualize a página e escolha um horário futuro.");
  }

  // 1. Reserva o Slot
  await updateDoc(slotRef, { status: "HELD", requestedBy: patientId, updatedAt: serverTimestamp() });

  // 2. Cria o Agendamento
  const apptRef = await addDoc(collection(db, "appointments"), {
    therapistId,
    patientId,
    slotPath: slotRef.path,
    slotStartsAt: slot.startsAt,
    slotEndsAt: slot.endsAt,
    startTime: coerceTimestamp(null, slot.startsAt),
    endTime: coerceTimestamp(null, slot.endsAt),
    status: normalizeAppointmentStatus("PENDING"),
    sessionStatus: normalizeSessionStatus("SCHEDULED"),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: apptRef.id };
}

export async function approveAppointment(appointmentId) {
  const apptRef = doc(db, "appointments", appointmentId);
  const apptSnap = await getDoc(apptRef);
  if (!apptSnap.exists()) throw new Error("Agendamento não encontrado");
  const appt = apptSnap.data();
  
  const meetingFields = prepareJitsiMeetingFields(appointmentId, appt);

  // 1. Atualiza Agendamento
  await updateDoc(apptRef, { 
      status: normalizeAppointmentStatus("CONFIRMED"), 
      sessionStatus: normalizeSessionStatus(appt.sessionStatus || "SCHEDULED"), 
      ...meetingFields, 
      updatedAt: serverTimestamp() 
  });

  // 2. Atualiza Slot
  const slotRef = docFromPath(appt.slotPath);
  await updateDoc(slotRef, { status: "BOOKED", updatedAt: serverTimestamp() });

  // 3. VINCULA PACIENTE (Com a permissão nova no firestore.rules, isso agora funciona!)
  try {
      if (appt.patientId && appt.therapistId) {
          const userRef = doc(db, 'users', appt.patientId);
          await updateDoc(userRef, {
              therapistUid: appt.therapistId,
              updatedAt: serverTimestamp()
          });
      }
  } catch (err) {
      console.warn("Falha ao vincular paciente na confirmação:", err);
  }
}

export async function declineAppointment(appointmentId) {
  const apptRef = doc(db, "appointments", appointmentId);
  const apptSnap = await getDoc(apptRef);
  if (!apptSnap.exists()) throw new Error("Agendamento não encontrado");
  const appt = apptSnap.data();
  await updateDoc(apptRef, { status: normalizeAppointmentStatus("DECLINED"), sessionStatus: normalizeSessionStatus("CANCELED"), updatedAt: serverTimestamp() });
  const slotRef = docFromPath(appt.slotPath);
  await updateDoc(slotRef, { status: "OPEN", requestedBy: null, updatedAt: serverTimestamp() });
}

export async function cancelAppointment(appointmentId) {
  const apptRef = doc(db, "appointments", appointmentId);
  const apptSnap = await getDoc(apptRef);
  if (!apptSnap.exists()) throw new Error("Agendamento não encontrado");
  const appt = apptSnap.data();
  await updateDoc(apptRef, { status: normalizeAppointmentStatus("CANCELED"), sessionStatus: normalizeSessionStatus("CANCELED"), updatedAt: serverTimestamp() });
  const slotRef = docFromPath(appt.slotPath);
  await updateDoc(slotRef, { status: "OPEN", requestedBy: null, updatedAt: serverTimestamp() });
}

// --- LISTAGEM ---
export function subscribeTherapistAppointments(therapistId, cb) {
  const base = collection(db, "appointments");
  // Removido orderBy para evitar erro de índice, garantindo que os dados cheguem
  const qy = query(base, where("therapistId", "==", therapistId));
  return onSnapshot(qy, (snap) => cb(snap.docs.map(mapAppointmentSnapshot)));
}

export function subscribePatientAppointments(patientId, cb) {
  const base = collection(db, "appointments");
  const qy = query(base, where("patientId", "==", patientId));
  return onSnapshot(qy, (snap) => cb(snap.docs.map(mapAppointmentSnapshot)));
}

export async function listAppointmentsByUser(userId, role) {
  const base = collection(db, "appointments");
  const field = role === "therapist" ? "therapistId" : "patientId";
  const qy = query(base, where(field, "==", userId), orderBy("slotStartsAt", "asc"));
  const snap = await getDocs(qy);
  return snap.docs.map(mapAppointmentSnapshot);
}

export async function regenerateAppointmentMeeting(appointmentId, options = {}) { 
  const apptRef = doc(db, "appointments", appointmentId); 
  const apptSnap = await getDoc(apptRef); 
  if (!apptSnap.exists()) throw new Error("Agendamento nao encontrado"); 
  const appt = apptSnap.data(); 
  if (normalizeAppointmentStatus(appt.status) !== "confirmed") throw new Error("Somente consultas confirmadas podem gerar link"); 
  const meetingFields = prepareJitsiMeetingFields(appointmentId, appt, options); 
  await updateDoc(apptRef, { ...meetingFields, updatedAt: serverTimestamp() }); 
  return meetingFields; 
}

// NOVA FUNÇÃO: Apenas atualiza detalhes sem finalizar
export async function updateAppointmentDetails(appointmentId, payload = {}) {
    const apptRef = doc(db, "appointments", appointmentId);
    const updates = {
        updatedAt: serverTimestamp()
    };
    
    if (payload.summaryNotes !== undefined) {
        updates.summaryNotes = payload.summaryNotes;
        updates.notes = payload.summaryNotes; // Compatibilidade
    }
    
    if (payload.meetingUrl !== undefined) {
        updates.meetingUrl = payload.meetingUrl;
    }

    await updateDoc(apptRef, updates);
}

export async function completeAppointment(appointmentId, payload = {}) { 
    const apptRef = doc(db, "appointments", appointmentId); 
    const apptSnap = await getDoc(apptRef); 
    if (!apptSnap.exists()) throw new Error("Agendamento nao encontrado"); 
    const appt = apptSnap.data(); 
    
    const actorId = payload.updatedBy || appt.therapistId; 
    const therapistId = appt.therapistId || actorId; 
    const completedDate = new Date(); 
    const completedTs = Timestamp.fromDate(completedDate); 
    const meetingData = extractMeetingFromAppointment(appt, payload.meeting); 
    
    const resources = { 
        playlists: payload?.resources?.playlists || [], 
        exercises: payload?.resources?.exercises || [], 
        files: payload?.resources?.files || [] 
    }; 
    const followUp = { 
        tasks: payload?.followUp?.tasks || [], 
        reminderAt: payload?.followUp?.reminderAt || null 
    }; 
    
    const consultationPayload = { 
        appointmentId, 
        therapistId, 
        patientId: appt.patientId, 
        startsAt: coerceTimestamp(appt.startTime, appt.slotStartsAt) ?? appt.slotStartsAt, 
        endsAt: coerceTimestamp(appt.endTime, appt.slotEndsAt) ?? appt.slotEndsAt, 
        sessionStatus: "COMPLETED", 
        meeting: meetingData, 
        summaryNotes: payload.summaryNotes ?? "", 
        notes: payload.summaryNotes ?? "", 
        resources, 
        followUp, 
        completedAt: completedDate, 
        createdBy: actorId, 
        updatedBy: actorId 
    }; 
    
    let consultationId = appt.historyId || null; 
    if (consultationId) { 
        await updateConsultation(consultationId, consultationPayload); 
    } else { 
        // CORREÇÃO AQUI: createConsultation retorna uma STRING (o ID), não um objeto.
        const resultId = await createConsultation(consultationPayload); 
        consultationId = resultId; 
    } 
    
    await updateDoc(apptRef, { 
        status: normalizeAppointmentStatus("COMPLETED"), 
        sessionStatus: normalizeSessionStatus("COMPLETED"), 
        completedAt: completedTs, 
        historyId: consultationId, 
        // CORREÇÃO: Atualizando as observações no agendamento para o paciente ver
        summaryNotes: payload.summaryNotes ?? "", 
        notes: payload.summaryNotes ?? "",
        updatedAt: serverTimestamp() 
    }); 
    return { consultationId }; 
}

export async function findTherapistsWithOpenSlots() { const cg = await getDocs(collectionGroup(db, "slots")); const ids = new Set(); cg.forEach((d) => { const data = d.data(); if (["OPEN", "HELD"].includes(data?.status)) { const parts = d.ref.path.split("/"); if (parts[1]) ids.add(parts[1]); } }); return Array.from(ids); }
function prepareJitsiMeetingFields(appointmentId, appt, options = {}) { const metadata = generateJitsiRoomMetadata({ therapistId: appt.therapistId, patientId: appt.patientId, appointmentId, startsAt: appt.startTime || appt.slotStartsAt, endsAt: appt.endTime || appt.slotEndsAt, domain: options.domain, ttlMinutes: options.ttlMinutes }); return { meetingProvider: metadata.provider, meetingRoom: metadata.roomName, meetingUrl: metadata.joinUrl, meetingConfig: metadata.config, meetingExpiresAt: metadata.expiresAt }; }
function extractMeetingFromAppointment(appt = {}, override = {}) { const source = { ...(appt || {}) }; const applied = { ...(override || {}) }; return { provider: applied.provider ?? source.meetingProvider ?? (source.meetingUrl ? "jitsi" : null), roomName: applied.roomName ?? source.meetingRoom ?? null, joinUrl: applied.joinUrl ?? source.meetingUrl ?? null, expiresAt: applied.expiresAt ?? source.meetingExpiresAt ?? null, config: applied.config ?? source.meetingConfig ?? null }; }
function mapAppointmentSnapshot(docSnap) { const data = docSnap.data() || {}; return { id: docSnap.id, ...data, status: normalizeAppointmentStatus(data.status), sessionStatus: normalizeSessionStatus(data.sessionStatus), startTime: coerceTimestamp(data.startTime, data.slotStartsAt), endTime: coerceTimestamp(data.endTime, data.slotEndsAt), meetingExpiresAt: coerceTimestamp(data.meetingExpiresAt), completedAt: coerceTimestamp(data.completedAt) }; }