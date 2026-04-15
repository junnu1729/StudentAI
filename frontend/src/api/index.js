import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  timeout: 60000
})

// Notes
export const uploadNote = (formData) => api.post('/notes/upload', formData)
export const listNotes = () => api.get('/notes/')
export const getNote = (id) => api.get(`/notes/${id}`)
export const summarizeNote = (id) => api.post(`/notes/${id}/summarize`)
export const deleteNote = (id) => api.delete(`/notes/${id}`)
export const downloadNote = (id) => `/api/notes/${id}/download`

// Papers
export const uploadPaper = (formData) => api.post('/papers/upload', formData)
export const listPapers = (params) => api.get('/papers/', { params })
export const getPaper = (id) => api.get(`/papers/${id}`)
export const getSubjects = () => api.get('/papers/subjects')
export const analyzeTrends = (subject) => api.post('/papers/analyze', { subject })
export const searchPapers = (q) => api.get('/papers/search', { params: { q } })
export const downloadPaper = (id) => `/api/papers/${id}/download`
export const deletePaper = (id) => api.delete(`/papers/${id}`)

// Chat
export const askQuestion = (data) => api.post('/chat/ask', data)
export const getChatHistory = (sessionId) => api.get(`/chat/history/${sessionId}`)
export const listSessions = () => api.get('/chat/sessions')
export const deleteSession = (sessionId) => api.delete(`/chat/session/${sessionId}`)

// Quiz
export const generateQuiz = (data) => api.post('/quiz/generate', data)
export const submitQuiz = (quizId, answers) => api.post(`/quiz/${quizId}/submit`, { answers })
export const listQuizzes = () => api.get('/quiz/')

export default api
