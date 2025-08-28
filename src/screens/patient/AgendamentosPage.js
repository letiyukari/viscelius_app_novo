import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, onSnapshot, query, where, doc, deleteDoc } from 'firebase/firestore';
import { ClockIcon, VideoIcon } from '../../common/Icons';

const AgendamentosPage = ({ user }) => {
    const therapists = [
      { id: "carlos-mendes", name: "Dr. Carlos Mendes", specialty: "Foco e Ansiedade", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1374&auto=format&fit=crop" },
      { id: "sofia-ribeiro", name: "Dra. Sofia Ribeiro", specialty: "Expressão Emocional", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop" },
      { id: "ricardo-alves", name: "Dr. Ricardo Alves", specialty: "Reabilitação Motora", avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=2070&auto=format&fit=crop" },
    ];
  
    const availableSchedule = {
        "Seg, 22 Jul": ["14:00", "15:00"],
        "Ter, 23 Jul": ["11:00", "13:00", "16:00"],
        "Qua, 24 Jul": ["10:00", "11:00"],
        "Qui, 25 Jul": [],
        "Sex, 26 Jul": ["08:00", "15:00", "16:00", "17:00"],
    };
  
    const [selectedTherapist, setSelectedTherapist] = useState(therapists[0]);
    const [selectedDate, setSelectedDate] = useState(Object.keys(availableSchedule)[0]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [userAppointments, setUserAppointments] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
  
    const workHours = Array.from({ length: 11 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);
  
    const handleConfirmBooking = async () => {
      setMessage({ type: '', text: '' });
      if (!user) {
          setMessage({ type: 'error', text: 'Você precisa estar logado para agendar uma consulta.' });
          return;
      }
      if (!selectedTherapist || !selectedDate || !selectedSlot) {
          setMessage({ type: 'error', text: 'Por favor, selecione um terapeuta, data e horário.' });
          return;
      }
  
      try {
          await addDoc(collection(db, 'appointments'), {
              userId: user.uid,
              userEmail: user.email,
              therapistId: selectedTherapist.id,
              therapistName: selectedTherapist.name,
              date: selectedDate,
              time: selectedSlot,
              status: 'Agendada',
              createdAt: new Date(),
          });
          setMessage({ type: 'success', text: 'Consulta agendada com sucesso!' });
          setSelectedSlot(null);
      } catch (e) {
          setMessage({ type: 'error', text: 'Erro ao agendar consulta. Tente novamente.' });
          console.error("Erro ao agendar consulta: ", e);
      }
    };
  
    const handleDeleteAppointment = async (appointmentId) => {
      setMessage({ type: '', text: '' });
      if (!user) {
          setMessage({ type: 'error', text: 'Você precisa estar logado para cancelar uma consulta.' });
          return;
      }
      try {
          await deleteDoc(doc(db, 'appointments', appointmentId));
          setMessage({ type: 'success', text: 'Agendamento cancelado com sucesso!' });
      } catch (e) {
          setMessage({ type: 'error', text: 'Erro ao cancelar agendamento. Tente novamente.' });
          console.error("Erro ao cancelar agendamento: ", e);
      }
    };
  
    useEffect(() => {
      if (!user) {
          setUserAppointments([]);
          return;
      }
  
      const q = query(
          collection(db, 'appointments'),
          where('userId', '==', user.uid)
      );
  
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const fetchedAppointments = [];
          querySnapshot.forEach((doc) => {
              fetchedAppointments.push({ id: doc.id, ...doc.data() });
          });
          setUserAppointments(fetchedAppointments);
      }, (error) => {
          console.error("Erro ao carregar agendamentos:", error);
      });
      return () => unsubscribe();
    }, [user]);
  
    const styles = {
        pageContainer: { padding: '2rem 3.5rem', backgroundColor: '#F9FAFB', fontFamily: '"Inter", sans-serif', overflowY: 'auto', height: '100vh' },
        header: { marginBottom: '2rem' },
        title: { color: '#1F2937', fontSize: '2.2rem', fontWeight: '700', margin: '0' },
        subtitle: { color: '#6B7280', fontSize: '1.1rem', fontWeight: '500', marginTop: '0.5rem' },
        mainContent: { display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2.5rem', alignItems: 'flex-start' },
        therapistList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
        therapistCard: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '12px', cursor: 'pointer', border: '2px solid #fff', transition: 'border-color 0.2s, background-color 0.2s' },
        therapistCardSelected: { borderColor: '#8B5CF6', backgroundColor: '#F5F3FF' },
        therapistAvatar: { width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' },
        therapistInfo: {},
        therapistName: { margin: 0, color: '#1F2937', fontWeight: 600 },
        therapistSpecialty: { margin: 0, color: '#6B7280', fontSize: '0.9rem' },
        scheduleContainer: { backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '16px', overflow: 'hidden' },
        dateNavigator: { display: 'flex', borderBottom: '1px solid #E5E7EB' },
        dateButton: { flex: 1, padding: '1rem', border: 'none', background: 'none', cursor: 'pointer', color: '#6B7280', fontWeight: 500, transition: 'background-color 0.2s, color 0.2s' },
        dateButtonSelected: { backgroundColor: '#F5F3FF', color: '#6D28D9', boxShadow: 'inset 0 -2px 0 #6D28D9' },
        slotsAndCalendarContainer: { padding: '1.5rem' },
        slotsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' },
        slotButton: { padding: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '8px', background: 'none', cursor: 'pointer', color: '#374151', fontWeight: 600, transition: 'background-color 0.2s, color 0.2s' },
        slotButtonSelected: { backgroundColor: '#6D28D9', color: '#fff', borderColor: '#6D28D9' },
        sessionInfo: { display: 'flex', gap: '1rem', color: '#6B7280', marginTop: '1.5rem', alignItems: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid #E5E7EB' },
        infoItem: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
        bookingAction: { marginTop: '2rem', textAlign: 'right' },
        bookingButton: { backgroundColor: '#8B5CF6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', transition: 'background-color 0.2s' },
        userAppointmentsList: { marginTop: '3rem' },
        userAppointmentCard: { backgroundColor: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #E5E7EB', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        cancelButton: { backgroundColor: '#EF4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' },
    };

    const currentBookedSlots = userAppointments.filter(app => app.therapistId === selectedTherapist.id && app.date === selectedDate);
    const availableSlotsForDisplay = availableSchedule[selectedDate] ? availableSchedule[selectedDate].filter(
        slot => !currentBookedSlots.some(booked => booked.time === slot)
    ) : [];
  
    return (
      <div style={styles.pageContainer}>
        <header style={styles.header}>
          <h1 style={styles.title}>Agendar Sessão</h1>
          <p style={styles.subtitle}>Encontre o melhor horário para sua próxima consulta.</p>
        </header>
        <div style={styles.mainContent}>
            <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1F2937', marginBottom: '1rem' }}>Nossos Terapeutas</h2>
                <div style={styles.therapistList}>
                    {therapists.map(therapist => (
                        <div key={therapist.id} style={{ ...styles.therapistCard, ...(selectedTherapist.id === therapist.id && styles.therapistCardSelected) }} onClick={() => { setSelectedTherapist(therapist); setSelectedSlot(null); }}>
                            <img src={therapist.avatar} alt={therapist.name} style={styles.therapistAvatar} />
                            <div style={styles.therapistInfo}>
                                <p style={styles.therapistName}>{therapist.name}</p>
                                <p style={styles.therapistSpecialty}>{therapist.specialty}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div style={styles.scheduleContainer}>
                <div style={styles.dateNavigator}>
                {Object.keys(availableSchedule).map(day => (
                    <button key={day} style={{ ...styles.dateButton, ...(selectedDate === day && styles.dateButtonSelected) }} onClick={() => { setSelectedDate(day); setSelectedSlot(null); }}>
                    {day}
                    </button>
                ))}
                </div>
                <div style={styles.slotsAndCalendarContainer}>
                    <div>
                        <p style={{ fontWeight: 600, color: '#374151' }}>Horários disponíveis para {selectedDate}:</p>
                        <div style={styles.slotsGrid}>
                        {availableSlotsForDisplay.length > 0 ? availableSlotsForDisplay.map(time => (
                            <button key={time} style={{...styles.slotButton, ...(selectedSlot === time && styles.slotButtonSelected)}} onClick={() => setSelectedSlot(time)}>
                            {time}
                            </button>
                        )) : <p style={{color: '#6B7280'}}>Nenhum horário disponível para este dia.</p>}
                        </div>
                    </div>
                    <div style={styles.sessionInfo}>
                        <div style={styles.infoItem}><ClockIcon/> <span>Duração: 50 min</span></div>
                        <div style={styles.infoItem}><VideoIcon/> <span>Modalidade: Online</span></div>
                    </div>
                    {selectedSlot && (
                      <div style={styles.bookingAction}>
                          <button onClick={handleConfirmBooking} style={styles.bookingButton}>Confirmar Agendamento</button>
                      </div>
                    )}
                </div>
            </div>
        </div>
        <div style={styles.userAppointmentsList}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1F2937', marginBottom: '1.5rem' }}>Meus Agendamentos Confirmados</h2>
          {userAppointments.length > 0 ? (
              userAppointments.map(appointment => (
                  <div key={appointment.id} style={styles.userAppointmentCard}>
                      <div>
                          <p style={{ margin: 0, fontWeight: 600 }}>{appointment.therapistName}</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#6B7280' }}>{appointment.date} às {appointment.time}</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#2E7D32', fontWeight: 500 }}>Status: {appointment.status}</p>
                      </div>
                      <button onClick={() => handleDeleteAppointment(appointment.id)} style={styles.cancelButton}>Cancelar</button>
                  </div>
              ))
          ) : (
              <p style={{ color: '#6B7280' }}>Você não tem agendamentos futuros.</p>
          )}
        </div>
      </div>
    );
};
  
export default AgendamentosPage;