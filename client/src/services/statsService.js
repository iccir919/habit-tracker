import { api } from './api';

export const statsService = {
  // Get user statistics
  getUserStats: () => {
    return api.get('/stats/user');
  },

  // Get habit-specific statistics
  getHabitStats: (habitId) => {
    return api.get(`/stats/habit/${habitId}`);
  }
};