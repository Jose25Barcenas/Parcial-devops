import { api } from './api'

export const analyticsService = {
  async getKPIs() {
    const response = await api.get('/analytics/kpis')
    return response.data
  },

  async getStageAverages() {
    const response = await api.get('/analytics/stage-averages')
    return response.data
  },

  async getProcessesByStage() {
    const response = await api.get('/analytics/by-stage')
    return response.data
  },

  async getProcessesByProgram() {
    const response = await api.get('/analytics/by-program')
    return response.data
  },

  async getProcessesByDecision() {
    const response = await api.get('/analytics/by-decision')
    return response.data
  },

  async getTimeline() {
    const response = await api.get('/analytics/timeline')
    return response.data
  },

  async getMonthlyActivity() {
    const response = await api.get('/analytics/monthly')
    return response.data
  },
}
