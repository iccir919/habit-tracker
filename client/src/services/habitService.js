import { api } from './api';

export const habitService = {

    // Get all habits
    getHabits: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await api.get(`/habits?${queryString ? `${queryString}` : ''}`);
    },

    // Get single habit
    getHabit: (id) => {
        return api.get(`/habits/${id}`);
    },

    // Create habit
    createHabit: (habitData) => {
        return api.post('/habits', habitData);
    },

    // Update habit
    updateHabit: (id, habitData) => {
        return api.put(`/habits/${id}`, habitData);
    },

    // Delete habit
    deleteHabit: (id) => {
        return api.delete(`/habits/${id}`);
    }
};