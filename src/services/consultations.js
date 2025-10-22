// src/services/consultations.js
import { db } from '../firebase';
// CORREÇÃO: Importando getDocs
import { collection, addDoc, updateDoc, doc, getDoc, query, where, onSnapshot, getDocs } from 'firebase/firestore'; 

const CONSULTATIONS_COLLECTION = 'consultations';

/**
 * Cria um novo registro de consulta.
 * @param {object} consultation - Dados da consulta.
 * @param {string} consultation.therapistId - ID do terapeuta.
 * @param {string} consultation.patientId - ID do paciente.
 * @param {string} consultation.notes - Anotações da sessão.
 * @param {Date} consultation.completedAt - Data/hora de conclusão.
 * @param {string} [consultation.appointmentId] - Opcional: ID do agendamento relacionado.
 * @returns {Promise<string>} O ID do novo documento de consulta.
 */
export async function createConsultation(consultation) {
    // 1. Validação (Removida a obrigatoriedade do appointmentId)
    if (!consultation.therapistId || !consultation.patientId || !consultation.notes) {
        throw new Error('therapistId, patientId e notes são obrigatórios.');
    }
    
    try {
        const docRef = await addDoc(collection(db, CONSULTATIONS_COLLECTION), {
            ...consultation,
            createdAt: new Date(), // Adiciona o timestamp de criação
        });
        return docRef.id;
    } catch (error) {
        console.error("Erro ao criar consulta:", error);
        throw new Error(`Falha ao criar consulta: ${error.message}`);
    }
}

/**
 * Busca uma consulta pelo ID.
 * @param {string} consultationId - ID da consulta.
 * @returns {Promise<object | null>} Dados da consulta ou null.
 */
export async function getConsultation(consultationId) {
    const docRef = doc(db, CONSULTATIONS_COLLECTION, consultationId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    } else {
        return null;
    }
}

/**
 * Lista consultas por ID do paciente.
 * @param {string} patientId - ID do paciente.
 * @returns {Promise<object[]>} Lista de consultas.
 */
export async function listConsultationsByPatient(patientId) {
    const q = query(collection(db, CONSULTATIONS_COLLECTION), where('patientId', '==', patientId));
    const querySnapshot = await getDocs(q);
    const consultations = [];
    querySnapshot.forEach((doc) => {
        consultations.push({ id: doc.id, ...doc.data() });
    });
    return consultations;
}

/**
 * Lista consultas por ID do terapeuta.
 * @param {string} therapistId - ID do terapeuta.
 * @returns {Promise<object[]>} Lista de consultas.
 */
export async function listConsultationsByTherapist(therapistId) {
    const q = query(collection(db, CONSULTATIONS_COLLECTION), where('therapistId', '==', therapistId));
    const querySnapshot = await getDocs(q);
    const consultations = [];
    querySnapshot.forEach((doc) => {
        consultations.push({ id: doc.id, ...doc.data() });
    });
    return consultations;
}

/**
 * Assina as consultas de um paciente em tempo real.
 * @param {string} patientId - ID do paciente.
 * @param {(consultations: object[]) => void} callback - Função chamada com a lista de consultas.
 * @returns {() => void} Função para cancelar a assinatura.
 */
export function subscribePatientConsultations(patientId, callback) {
    const q = query(collection(db, CONSULTATIONS_COLLECTION), where('patientId', '==', patientId));
    return onSnapshot(q, (querySnapshot) => {
        const consultations = [];
        querySnapshot.forEach((doc) => {
            consultations.push({ id: doc.id, ...doc.data() });
        });
        callback(consultations);
    });
}

/**
 * Assina as consultas de um terapeuta em tempo real.
 * @param {string} therapistId - ID do terapeuta.
 * @param {(consultations: object[]) => void} callback - Função chamada com a lista de consultas.
 * @returns {() => void} Função para cancelar a assinatura.
 */
export function subscribeTherapistConsultations(therapistId, callback) {
    const q = query(collection(db, CONSULTATIONS_COLLECTION), where('therapistId', '==', therapistId));
    return onSnapshot(q, (querySnapshot) => {
        const consultations = [];
        querySnapshot.forEach((doc) => {
            consultations.push({ id: doc.id, ...doc.data() });
        });
        callback(consultations);
    });
}

/**
 * Atualiza um registro de consulta existente.
 * @param {string} consultationId - ID da consulta a ser atualizada.
 * @param {object} updates - Campos a serem atualizados.
 * @returns {Promise<void>}
 */
export async function updateConsultation(consultationId, updates) {
    const docRef = doc(db, CONSULTATIONS_COLLECTION, consultationId);
    try {
        await updateDoc(docRef, updates);
    } catch (error) {
        console.error("Erro ao atualizar consulta:", error);
        throw new Error(`Falha ao atualizar consulta: ${error.message}`);
    }
}
