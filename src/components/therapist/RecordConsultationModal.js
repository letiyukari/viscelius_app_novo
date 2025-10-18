import React, { useEffect, useMemo, useState } from "react";
import { getConsultation } from "../../services/consultations";
import { ClockIcon, VideoIcon } from "../../common/Icons";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

const createResourceRow = (label = "", url = "") => ({ label, url });
const createTaskRow = (label = "", dueDate = "") => ({ label, dueDate });

function toDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatInputDate(value) {
  const date = toDateValue(value);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeResourceRows(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return [createResourceRow()];
  }
  const rows = items
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") {
        const label = item.trim();
        if (!label) return null;
        return createResourceRow(label, "");
      }
      const label =
        (item.label || item.title || item.name || item.id || "").toString().trim();
      const url = (item.url || item.link || item.href || "").toString().trim();
      if (!label && !url) return null;
      return createResourceRow(label, url);
    })
    .filter(Boolean);
  return rows.length > 0 ? rows : [createResourceRow()];
}

function normalizeTaskRows(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return [createTaskRow()];
  }
  const rows = items
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") {
        const label = item.trim();
        if (!label) return null;
        return createTaskRow(label, "");
      }
      const label = (item.label || item.title || item.name || "").toString().trim();
      if (!label) return null;
      const dueAt = item.dueAt || item.dueDate || item.reminderAt || null;
      return createTaskRow(label, formatInputDate(dueAt));
    })
    .filter(Boolean);
  return rows.length > 0 ? rows : [createTaskRow()];
}

function formatRange(start, end) {
  const startDate = toDateValue(start);
  const endDate = toDateValue(end);
  if (!startDate) return "--";
  const datePart = dateFormatter.format(startDate);
  const startTime = timeFormatter.format(startDate);
  const endTime = endDate ? timeFormatter.format(endDate) : "";
  return endTime ? `${datePart} â€¢ ${startTime} - ${endTime}` : `${datePart} â€¢ ${startTime}`;
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
  resourceList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  resourceRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: "0.75rem",
    alignItems: "center",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #D1D5DB",
    backgroundColor: "#FFFFFF",
    fontSize: "0.95rem",
  },
  removeButton: {
    background: "#FEE2E2",
    color: "#B91C1C",
    border: "none",
    borderRadius: "8px",
    padding: "0.45rem 0.75rem",
    cursor: "pointer",
    fontWeight: 600,
  },
  addButton: {
    background: "#EEF2FF",
    color: "#4338CA",
    border: "none",
    borderRadius: "8px",
    padding: "0.6rem 0.9rem",
    cursor: "pointer",
    fontWeight: 600,
    alignSelf: "flex-start",
  },
  tasksGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  taskRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr auto",
    gap: "0.75rem",
    alignItems: "center",
  },
  reminderRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginTop: "0.5rem",
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
  const [playlists, setPlaylists] = useState([createResourceRow()]);
  const [exercises, setExercises] = useState([createResourceRow()]);
  const [files, setFiles] = useState([createResourceRow()]);
  const [tasks, setTasks] = useState([createTaskRow()]);
  const [reminderDate, setReminderDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sessionRange = useMemo(() => {
    if (!appointment) return "--";
    return formatRange(appointment.slotStartsAt || appointment.startTime, appointment.slotEndsAt || appointment.endTime);
  }, [appointment]);

  const meetingUrl = useMemo(() => {
    if (!appointment) return null;
    return appointment.meetingUrl || appointment.meeting?.joinUrl || null;
  }, [appointment]);

  const meetingRoom = useMemo(() => {
    if (!appointment) return null;
    return appointment.meetingRoom || appointment.meeting?.roomName || null;
  }, [appointment]);

  const resetForm = () => {
    setSummaryNotes("");
    setPlaylists([createResourceRow()]);
    setExercises([createResourceRow()]);
    setFiles([createResourceRow()]);
    setTasks([createTaskRow()]);
    setReminderDate("");
    setSubmitError(null);
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (!open || !appointment) {
      resetForm();
      setLoading(false);
      return;
    }
    let active = true;
    resetForm();
    const historyId = appointment.historyId;
    if (!historyId) {
      return () => {
        active = false;
      };
    }
    setLoading(true);
    getConsultation(historyId)
      .then((consultation) => {
        if (!active || !consultation) return;
        setSummaryNotes(consultation.summaryNotes || "");
        setPlaylists(normalizeResourceRows(consultation.resources?.playlists));
        setExercises(normalizeResourceRows(consultation.resources?.exercises));
        setFiles(normalizeResourceRows(consultation.resources?.files));
        setTasks(normalizeTaskRows(consultation.followUp?.tasks));
        setReminderDate(formatInputDate(consultation.followUp?.reminderAt));
      })
      .catch((error) => {
        console.error("RecordConsultationModal getConsultation", error);
        if (active) {
          setSubmitError("Não foi possível carregar os dados anteriores desta sessão.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, appointment]);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  if (!open || !appointment) {
    return null;
  }

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  const handleAddResource = (list, setList) => {
    setList([...list, createResourceRow()]);
  };

  const handleRemoveResource = (index, list, setList) => {
    if (list.length === 1) return;
    const next = [...list];
    next.splice(index, 1);
    setList(next);
  };

  const handleResourceChange = (index, field, value, list, setList) => {
    const next = [...list];
    next[index] = { ...next[index], [field]: value };
    setList(next);
  };

  const handleAddTask = () => {
    setTasks([...tasks, createTaskRow()]);
  };

  const handleRemoveTask = (index) => {
    if (tasks.length === 1) return;
    const next = [...tasks];
    next.splice(index, 1);
    setTasks(next);
  };

  const handleTaskChange = (index, field, value) => {
    const next = [...tasks];
    next[index] = { ...next[index], [field]: value };
    setTasks(next);
  };

  const sanitizeResourcePayload = (rows) =>
    rows
      .map((row) => {
        const label = (row.label || "").trim();
        const url = (row.url || "").trim();
        if (!label && !url) return null;
        return url ? { label: label || url, url } : label;
      })
      .filter(Boolean);

  const sanitizeTaskPayload = (rows) =>
    rows
      .map((row) => {
        const label = (row.label || "").trim();
        if (!label) return null;
        const dueDate = (row.dueDate || "").trim();
        if (!dueDate) return { label };
        const due = new Date(`${dueDate}T00:00:00`);
        if (Number.isNaN(due.getTime())) {
          return { label };
        }
        return { label, dueAt: due };
      })
      .filter(Boolean);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!onSave) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        summaryNotes: summaryNotes.trim(),
        resources: {
          playlists: sanitizeResourcePayload(playlists),
          exercises: sanitizeResourcePayload(exercises),
          files: sanitizeResourcePayload(files),
        },
        followUp: {
          tasks: sanitizeTaskPayload(tasks),
          reminderAt: reminderDate ? new Date(`${reminderDate}T00:00:00`) : null,
        },
      };
      await onSave(payload);
    } catch (error) {
      console.error("RecordConsultationModal submit", error);
      setSubmitError(error?.message || "Não foi possível salvar a sessão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={handleOverlayClick} role="presentation">
      <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.headerTitle}>Registrar histórico da sessão</h2>
            <p style={styles.headerSubtitle}>
              {patientName ? `Paciente: ${patientName}` : "Paciente não identificado"} â€¢ {sessionRange}
            </p>
          </div>
          <button type="button" onClick={onClose} style={styles.closeButton} aria-label="Fechar">
            {"\u00D7"}
          </button>
        </div>

        {loading ? (
          <div style={styles.loadingBox}>Carregando informações anteriores...</div>
        ) : (
          <form style={{ display: "contents" }} onSubmit={handleSubmit}>
            <div style={styles.body}>
              <div style={styles.infoBox}>
                <div style={styles.infoRow}>
                  <ClockIcon />
                  <span>{sessionRange}</span>
                </div>
                {meetingUrl ? (
                  <div style={styles.infoRow}>
                    <VideoIcon />
                    <a href={meetingUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB" }}>
                      Acessar sala Jitsi
                    </a>
                  </div>
                ) : null}
                {meetingRoom && (
                  <div style={styles.infoRow}>
                    <span style={{ fontWeight: 600 }}>Sala:</span>
                    <span>{meetingRoom}</span>
                  </div>
                )}
              </div>

              {submitError ? <div style={styles.errorBox}>{submitError}</div> : null}

              <section style={styles.section}>
                <div>
                  <h3 style={styles.sectionTitle}>Resumo da sessão</h3>
                  <p style={styles.sectionDescription}>
                    Compartilhe pontos principais discutidos, respostas do paciente e orientacoes futuras.
                  </p>
                </div>
                <label style={styles.label} htmlFor="consultation-summary">
                  observações gerais
                </label>
                <textarea
                  id="consultation-summary"
                  style={styles.textarea}
                  value={summaryNotes}
                  onChange={(event) => setSummaryNotes(event.target.value)}
                  placeholder="Ex.: Exploramos técnicas de respiração com percussão leve. Paciente relatou alívio imediato."
                />
              </section>

              <section style={styles.section}>
                <div>
                  <h3 style={styles.sectionTitle}>Recursos recomendados</h3>
                  <p style={styles.sectionDescription}>
                    Informe playlists, exercícios ou materiais de apoio para o paciente continuar a prática.
                  </p>
                </div>

                <div>
                  <label style={styles.label}>Playlists</label>
                  <div style={styles.resourceList}>
                    {playlists.map((row, index) => (
                      <div key={`playlist-${index}`} style={styles.resourceRow}>
                        <input
                          style={styles.input}
                          type="text"
                          placeholder="Nome ou descricao"
                          value={row.label}
                          onChange={(event) =>
                            handleResourceChange(index, "label", event.target.value, playlists, setPlaylists)
                          }
                        />
                        <input
                          style={styles.input}
                          type="url"
                          placeholder="URL (opcional)"
                          value={row.url}
                          onChange={(event) =>
                            handleResourceChange(index, "url", event.target.value, playlists, setPlaylists)
                          }
                        />
                        <button
                          type="button"
                          style={styles.removeButton}
                          onClick={() => handleRemoveResource(index, playlists, setPlaylists)}
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" style={styles.addButton} onClick={() => handleAddResource(playlists, setPlaylists)}>
                    + Adicionar playlist
                  </button>
                </div>

                <div>
                  <label style={styles.label}>Exercícios e técnicas</label>
                  <div style={styles.resourceList}>
                    {exercises.map((row, index) => (
                      <div key={`exercise-${index}`} style={styles.resourceRow}>
                        <input
                          style={styles.input}
                          type="text"
                          placeholder="Nome ou descricao"
                          value={row.label}
                          onChange={(event) =>
                            handleResourceChange(index, "label", event.target.value, exercises, setExercises)
                          }
                        />
                        <input
                          style={styles.input}
                          type="url"
                          placeholder="URL (opcional)"
                          value={row.url}
                          onChange={(event) =>
                            handleResourceChange(index, "url", event.target.value, exercises, setExercises)
                          }
                        />
                        <button
                          type="button"
                          style={styles.removeButton}
                          onClick={() => handleRemoveResource(index, exercises, setExercises)}
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" style={styles.addButton} onClick={() => handleAddResource(exercises, setExercises)}>
                    + Adicionar exercicio
                  </button>
                </div>

                <div>
                  <label style={styles.label}>Materiais de apoio</label>
                  <div style={styles.resourceList}>
                    {files.map((row, index) => (
                      <div key={`file-${index}`} style={styles.resourceRow}>
                        <input
                          style={styles.input}
                          type="text"
                          placeholder="Nome ou descricao"
                          value={row.label}
                          onChange={(event) =>
                            handleResourceChange(index, "label", event.target.value, files, setFiles)
                          }
                        />
                        <input
                          style={styles.input}
                          type="url"
                          placeholder="URL (opcional)"
                          value={row.url}
                          onChange={(event) =>
                            handleResourceChange(index, "url", event.target.value, files, setFiles)
                          }
                        />
                        <button
                          type="button"
                          style={styles.removeButton}
                          onClick={() => handleRemoveResource(index, files, setFiles)}
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" style={styles.addButton} onClick={() => handleAddResource(files, setFiles)}>
                    + Adicionar material
                  </button>
                </div>
              </section>

              <section style={styles.section}>
                <div>
                  <h3 style={styles.sectionTitle}>Follow-up</h3>
                  <p style={styles.sectionDescription}>
                    Defina tarefas para acompanhar o progresso e opcionalmente inclua datas de revisao.
                  </p>
                </div>

                <div style={styles.tasksGrid}>
                  {tasks.map((row, index) => (
                    <div key={`task-${index}`} style={styles.taskRow}>
                      <input
                        style={styles.input}
                        type="text"
                        placeholder="Tarefa ou foco de estudo"
                        value={row.label}
                        onChange={(event) => handleTaskChange(index, "label", event.target.value)}
                      />
                      <input
                        style={styles.input}
                        type="date"
                        value={row.dueDate}
                        onChange={(event) => handleTaskChange(index, "dueDate", event.target.value)}
                      />
                      <button type="button" style={styles.removeButton} onClick={() => handleRemoveTask(index)}>
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" style={styles.addButton} onClick={handleAddTask}>
                  + Adicionar tarefa
                </button>

                <div>
                  <label style={styles.label}>Sugestao de proxima revisao</label>
                  <div style={styles.reminderRow}>
                    <input
                      style={styles.input}
                      type="date"
                      value={reminderDate}
                      onChange={(event) => setReminderDate(event.target.value)}
                    />
                  </div>
                </div>
              </section>
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
                {isSubmitting ? "Salvando..." : "Salvar no historico"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RecordConsultationModal;



