import { api } from './api';

export const timeEntryService = {
  // Get time entries for a log
  getTimeEntries: (logId) => {
    return api.get(`/time-entries/log/${logId}`);
  },

  // Add time entry
  addTimeEntry: (habitId, date, startTime, endTime) => {
    const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
    return api.post(`/time-entries/habit/${habitId}/date/${dateStr}`, {
      startTime,
      endTime
    });
  }
};