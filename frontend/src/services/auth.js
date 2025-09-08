import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Something went wrong'
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(new Error(message))
  }
)

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData)
  return response
}

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password })
  return response
}

export const logout = async () => {
  const response = await api.post('/auth/logout')
  return response
}

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me')
  return response.user
}

export default api