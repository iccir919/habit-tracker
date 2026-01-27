import { api } from './api';

export const logService = {
    // Get daily summary (all habits + their logs)
    getDailySummary: (date) => {
        const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
        return api.get(`/logs/daily?date=${dateStr}`);
    },

    // Get logs by date
    getLogsByDate: (date) => {
        const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
        return api.get(`/logs?date=${dateStr}`);
    },

    // Get logs for a specific habit
    getHabitLogs: (habitId, params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return api.get(`/logs/habit/${habitId}?${queryString ? `${queryString}` : ''}`);
    },

    // Create or update a log
    updateLog: (habitId, logData) => {
        return api.post(`/logs/habit/${habitId}`, logData);
    },

    // Delete a log
    deleteLog: (habitId, date) => {
        const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
        return api.delete(`/logs/habit/${habitId}`, { date: dateStr });
    }
}