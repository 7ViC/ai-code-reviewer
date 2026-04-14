import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''

export const api = {
  getReviews: (limit = 20) =>
    axios.get(`${BASE}/api/reviews?limit=${limit}`).then(r => r.data),

  getReview: (id) =>
    axios.get(`${BASE}/api/reviews/${id}`).then(r => r.data),

  manualReview: (payload) =>
    axios.post(`${BASE}/api/reviews/manual`, payload).then(r => r.data),

  health: () =>
    axios.get(`${BASE}/api/health`).then(r => r.data),
}
