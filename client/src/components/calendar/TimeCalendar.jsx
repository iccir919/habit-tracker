import { useState } from 'react';
import TimeSlotModal from './TimeSlotModal';
import './TimeCalendar.css';

function TimeCalendar({ date, habits, timeEntries, onUpdate }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Only show duration habits
  const durationHabits = habits.filter(h => h.tracking_type === 'duration');

  // Generate time slots from 6 AM to 10 PM (30-min intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push({ hour, minute: 0 });
      if (hour < 22) {
        slots.push({ hour, minute: 30 });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const formatTime = (hour, minute) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    setSelectedEntry(null);
    setShowModal(true);
  };

  const handleEntryClick = (entry, e) => {
    e.stopPropagation();
    setSelectedEntry(entry);
    setSelectedSlot(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedSlot(null);
    setSelectedEntry(null);
  };

  // Find entries that overlap with a time slot
  const getEntriesForSlot = (slot) => {
    const slotTime = `${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}`;
    
    return timeEntries.filter(entry => {
      const [entryStartHour, entryStartMin] = entry.start_time.split(':').map(Number);
      const [entryEndHour, entryEndMin] = entry.end_time.split(':').map(Number);
      
      const slotStart = slot.hour * 60 + slot.minute;
      const entryStart = entryStartHour * 60 + entryStartMin;
      const entryEnd = entryEndHour * 60 + entryEndMin;
      
      // Check if this slot falls within the entry's time range
      return slotStart >= entryStart && slotStart < entryEnd;
    });
  };

  // Get habit info for an entry
  const getHabitForEntry = (entry) => {
    return durationHabits.find(h => h.log?.id === entry.habit_log_id);
  };

  // Check if this is the first slot of an entry (to show the block)
  const isEntryStart = (entry, slot) => {
    const [entryStartHour, entryStartMin] = entry.start_time.split(':').map(Number);
    return slot.hour === entryStartHour && slot.minute === entryStartMin;
  };

  // Calculate how many 30-min slots this entry spans
  const getEntryHeight = (entry) => {
    const [startHour, startMin] = entry.start_time.split(':').map(Number);
    const [endHour, endMin] = entry.end_time.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const durationMinutes = endMinutes - startMinutes;
    
    return Math.ceil(durationMinutes / 30); // Number of 30-min blocks
  };

  if (durationHabits.length === 0) {
    return (
      <div className="time-calendar-empty">
        <p>No duration habits to display on calendar.</p>
        <p>Duration habits will appear here once created.</p>
      </div>
    );
  }

  return (
    <div className="time-calendar">
      <div className="time-calendar-header">
        <h3>Time Calendar</h3>
      </div>

      <div className="time-slots">
        {timeSlots.map((slot, index) => {
          const entries = getEntriesForSlot(slot);
          const entryToShow = entries.find(e => isEntryStart(e, slot));

          return (
            <div
              key={index}
              className="time-slot"
              onClick={() => handleSlotClick(slot)}
            >
              <div className="time-label">
                {slot.minute === 0 ? formatTime(slot.hour, slot.minute) : ''}
              </div>
              <div className="time-slot-content">
                {entryToShow && (
                  <div
                    className="time-entry-block"
                    style={{
                      height: `${getEntryHeight(entryToShow) * 40}px`,
                      backgroundColor: getHabitForEntry(entryToShow)?.color || '#3b82f6',
                      borderLeft: `4px solid ${getHabitForEntry(entryToShow)?.color || '#3b82f6'}`
                    }}
                    onClick={(e) => handleEntryClick(entryToShow, e)}
                  >
                    <div className="entry-habit-name">
                      {getHabitForEntry(entryToShow)?.icon} {getHabitForEntry(entryToShow)?.name}
                    </div>
                    <div className="entry-time-range">
                      {formatTime(...entryToShow.start_time.split(':').map(Number))} - 
                      {formatTime(...entryToShow.end_time.split(':').map(Number))}
                    </div>
                    <div className="entry-duration">
                      {entryToShow.duration_minutes} min
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <TimeSlotModal
          isOpen={showModal}
          onClose={handleModalClose}
          habits={durationHabits}
          date={date}
          initialSlot={selectedSlot}
          existingEntry={selectedEntry}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}

export default TimeCalendar;