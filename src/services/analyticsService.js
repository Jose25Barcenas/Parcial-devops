import { api } from './api'

export const analyticsService = {
  async getKPIs() {
    return api.get('/analytics/kpis')
  },

  async getStageAverages() {
    return api.get('/analytics/stage-averages')
  },

  async getProcessesByStage() {
    return api.get('/analytics/by-stage')
  },

  async getProcessesByProgram() {
    return api.get('/analytics/by-program')
  },

  async getProcessesByDecision() {
    return api.get('/analytics/by-decision')
  },

  async getTimeline() {
    return api.get('/analytics/timeline')
  },

  async getMonthlyActivity() {
    return api.get('/analytics/monthly')
  },

  async getRevenue() {
    return api.get('/analytics/revenue')
  },

  async getRevenueMonthly() {
    return api.get('/analytics/revenue-monthly')
  },

  async getGoalsProgress() {
    return api.get('/analytics/goals-progress')
  },
}
