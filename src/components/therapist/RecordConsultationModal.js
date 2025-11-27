import React, { useEffect, useMemo, useState } from "react";
import { getConsultation, updateConsultation } from "../../services/consultations";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { ClockIcon } from "../../common/Icons";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

function toDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatRange(start, end) {
  const startDate = toDateValue(start);
  const endDate = toDateValue(end);
  if (!startDate) return "--";
  const datePart = dateFormatter.format(startDate);
  const startTime = timeFormatter.format(startDate);
  const endTime = endDate ? timeFormatter.format(endDate) : "";
  return endTime ? `${datePart} • ${startTime} - ${endTime}` : `${datePart} • ${startTime}`;
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(17, 24, 39, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    zIndex: 1600,
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "720px",
    display: "flex",
    flexDirection: "column",
    maxHeight: "90vh",
    boxShadow: "0 32px 80px rgba(15, 23, 42, 0.25)",
  },
  header: {
    padding: "1.75rem 2rem 1.25rem 2rem",
    borderBottom: "1px solid #E5E7EB",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1.25rem",
  },
  headerTitle: { margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "#111827" },
  headerSubtitle: { margin: "0.3rem 0 0 0", color: "#6B7280", fontSize: "0.95rem" },
  closeButton: {
    background: "transparent",
    border: "none",
    fontSize: "1.5rem",
    fontWeight: 600,
    color: "#6B7280",
    cursor: "pointer",
    lineHeight: 1,
  },
  body: {
    padding: "1.75rem 2rem",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  sectionTitle: { margin: 0, color: "#1F2937", fontWeight: 700, fontSize: "1.1rem" },
  sectionDescription: { margin: 0, color: "#6B7280", fontSize: "0.9rem" },
  label: { fontSize: "0.85rem", fontWeight: 600, color: "#4B5563" },
  textarea: {
    width: "100%",
    minHeight: "140px",
    padding: "12px",
    border: "1px solid #D1D5DB",
    borderRadius: "12px",
    fontFamily: "inherit",
    fontSize: "1rem",
    color: "#1F2937",
    backgroundColor: "#F9FAFB",
  },
  input: {
    width: "100%",
    padding: "12px",
    border: "1px solid #D1D5DB",
    borderRadius: "12px",
    fontFamily: "inherit",
    fontSize: "1rem",
    color: "#1F2937",
    backgroundColor: "#FFFFFF",
  },
  infoBox: {
    padding: "0.75rem 1rem",
    borderRadius: "10px",
    backgroundColor: "#F1F5F9",
    color: "#0F172A",
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
    fontSize: "0.9rem",
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  checkboxContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginTop: "1rem",
    padding: "1rem",
    backgroundColor: "#FFFBEB",
    borderRadius: "8px",
    border: "1px solid #FCD34D"
  },
  checkboxLabel: {
    fontSize: "0.95rem",
    color: "#92400E",
    fontWeight: "600"
  },
  footer: {
    padding: "1.5rem 2rem 2rem 2rem",
    borderTop: "1px solid #E5E7EB",
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.75rem",
  },
  secondaryButton: {
    background: "#E5E7EB",
    color: "#374151",
    border: "none",
    borderRadius: "10px",
    padding: "0.75rem 1.4rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  primaryButton: {
    background: "#7C3AED",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    padding: "0.75rem 1.6rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  buttonDisabled: { opacity: 0.6, cursor: "not-allowed" },
  errorBox: {
    background: "#FEE2E2",
    color: "#B91C1C",
    borderRadius: "10px",
    padding: "0.75rem 1rem",
    fontSize: "0.9rem",
  },
  loadingBox: {
    padding: "2rem",
    textAlign: "center",
    color: "#4B5563",
  },
};

const RecordConsultationModal = ({ open, appointment, patientName, onClose, onSave }) => {
  const [summaryNotes, setSummaryNotes] = useState("");
  const [meetingUrlInput, setMeetingUrlInput] = useState("");
  const [isFinalizing, setIsFinalizing] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado local para buscar o agendamento mais recente e garantir que temos o ID do histórico
  const [freshAppointment, setFreshAppointment] = useState(null);
  const [existingHistoryId, setExistingHistoryId] = useState(null);

  const activeAppointment = freshAppointment || appointment;

  const sessionRange = useMemo(() => {
    if (!activeAppointment) return "--";
    return formatRange(activeAppointment.slotStartsAt || activeAppointment.startTime, activeAppointment.slotEndsAt || activeAppointment.endTime);
  }, [activeAppointment]);

  const resetForm = () => {
    setSummaryNotes("");
    setMeetingUrlInput("");
    setIsFinalizing(false);
    setSubmitError(null);
    setIsSubmitting(false);
    setFreshAppointment(null);
    setExistingHistoryId(null);
  };

  useEffect(() => {
    if (!open || !appointment) {
      resetForm();
      return;
    }
    
    resetForm();
    setLoading(true);

    // 1. Busca os dados mais recentes do agendamento no Firebase
    const fetchFreshData = async () => {
        try {
            const apptDocRef = doc(db, "appointments", appointment.id);
            const apptSnap = await getDoc(apptDocRef);
            
            let currentAppt = appointment;
            let historyId = appointment.historyId;

            if (apptSnap.exists()) {
                const data = apptSnap.data();
                currentAppt = { id: apptSnap.id, ...data };
                historyId = data.historyId; 
                setFreshAppointment(currentAppt);
            }

            // Preenche campos do formulário
            setSummaryNotes(currentAppt.summaryNotes || currentAppt.notes || "");
            setMeetingUrlInput(currentAppt.meetingUrl || currentAppt.meeting?.joinUrl || "");

            // 2. Se já tem histórico (edição), busca os dados da consulta
            if (historyId) {
                setExistingHistoryId(historyId);
                const consultation = await getConsultation(historyId);
                if (consultation) {
                    setSummaryNotes(prev => prev || consultation.summaryNotes || "");
                    if (currentAppt.status === 'completed') {
                         setIsFinalizing(true);
                    }
                }
            }
        } catch (error) {
            console.error("Erro ao carregar dados frescos:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchFreshData();
  }, [open, appointment]);

  if (!open || !appointment) {
    return null;
  }

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    
    try {
      const payload = {
        summaryNotes: summaryNotes.trim(),
        meetingUrl: meetingUrlInput.trim(),
        isFinalizing: isFinalizing, 
        resources: { playlists: [], exercises: [], files: [] },
        followUp: { tasks: [], reminderAt: null },
      };

      // Se já existe um histórico vinculado, atualizamos diretamente
      if (existingHistoryId) {
        await updateConsultation(existingHistoryId, {
            summaryNotes: payload.summaryNotes,
            meetingUrl: payload.meetingUrl,
        });
        
        // Também precisamos atualizar o agendamento para o paciente ver as notas
        // Isso é opcional se a função onSave já fizesse isso, mas para garantir:
        if (onSave) {
             // Chamamos onSave apenas para atualizar o status/notas no agendamento se necessário,
             // ou podemos confiar que o updateConsultation foi suficiente para o histórico.
             // Para atualizar as notas do AGENDAMENTO (visível pro paciente), chamamos o onSave.
             await onSave(payload);
        } else {
             if (onClose) onClose();
        }
        
      } else {
        // Se NÃO existe histórico, chamamos o onSave normal para criar e vincular
        if (onSave) {
            await onSave(payload);
        }
      }

    } catch (error) {
      console.error("RecordConsultationModal submit", error);
      setSubmitError(error?.message || "Não foi possível salvar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={handleOverlayClick} role="presentation">
      <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.headerTitle}>Detalhes da Sessão</h2>
            <p style={styles.headerSubtitle}>
              {patientName ? `Paciente: ${patientName}` : "Paciente não identificado"} • {sessionRange}
            </p>
          </div>
          <button type="button" onClick={onClose} style={styles.closeButton} aria-label="Fechar">
            {"\u00D7"}
          </button>
        </div>

        {loading ? (
          <div style={styles.loadingBox}>Carregando informações atualizadas...</div>
        ) : (
          <form style={{ display: "contents" }} onSubmit={handleSubmit}>
            <div style={styles.body}>
              <div style={styles.infoBox}>
                <div style={styles.infoRow}>
                  <ClockIcon />
                  <span>{sessionRange}</span>
                </div>
              </div>

              {submitError ? <div style={styles.errorBox}>{submitError}</div> : null}

              <section style={styles.section}>
                <label style={styles.label} htmlFor="meeting-url">
                  Link da Sala (Meet/Jitsi)
                </label>
                <input
                  id="meeting-url"
                  type="text"
                  style={styles.input}
                  value={meetingUrlInput}
                  onChange={(e) => setMeetingUrlInput(e.target.value)}
                  placeholder="Cole o link da videochamada aqui..."
                />
              </section>

              <section style={styles.section}>
                <label style={styles.label} htmlFor="consultation-summary">
                  Observações da sessão (visível para o paciente)
                </label>
                <textarea
                  id="consultation-summary"
                  style={styles.textarea}
                  value={summaryNotes}
                  onChange={(event) => setSummaryNotes(event.target.value)}
                  placeholder="Ex.: Link da sala, orientações prévias ou resumo pós-sessão."
                />
              </section>

              <div style={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  id="finalize-check"
                  checked={isFinalizing}
                  onChange={(e) => setIsFinalizing(e.target.checked)}
                  style={{ width: '20px', height: '20px' }}
                />
                <label htmlFor="finalize-check" style={styles.checkboxLabel}>
                  Finalizar sessão e mover para histórico?
                </label>
              </div>
              {!isFinalizing && (
                <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: '0 0 0 1rem' }}>
                  (Se desmarcado, apenas salva as informações e mantém o agendamento confirmado)
                </p>
              )}
            </div>

            <div style={styles.footer}>
              <button type="button" style={styles.secondaryButton} onClick={onClose}>
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  ...styles.primaryButton,
                  ...(isSubmitting ? styles.buttonDisabled : null),
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Salvando..." : (isFinalizing ? "Concluir Sessão" : "Salvar Alterações")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RecordConsultationModal;