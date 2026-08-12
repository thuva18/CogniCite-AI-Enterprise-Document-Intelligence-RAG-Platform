import axios from 'axios'

// Dynamically construct backend URL matching current window hostname (localhost or 127.0.0.1)
// or use VITE_API_URL for production (e.g. Render/Vercel)
const getBackendUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  return `http://${host}:8000`
}

export async function fetchHealth() {
  try {
    const { data } = await axios.get('/api/health', { timeout: 4000 })
    return data
  } catch {
    const { data } = await axios.get(`${getBackendUrl()}/api/health`, { timeout: 5000 })
    return data
  }
}

export async function uploadFiles(formData) {
  try {
    const { data } = await axios.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000,
    })
    return data
  } catch (err) {
    if (!err.response) {
      // Add a small delay for retry backoff
      await new Promise(resolve => setTimeout(resolve, 1000));
      const { data } = await axios.post(`${getBackendUrl()}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      })
      return data
    }
    throw err
  }
}

export async function sendChatMessage(message, history = []) {
  try {
    const { data } = await axios.post('/api/chat', { message, history }, { timeout: 120000 })
    return data
  } catch (err) {
    if (!err.response) {
      // Add a small delay for retry backoff
      await new Promise(resolve => setTimeout(resolve, 1000));
      const { data } = await axios.post(`${getBackendUrl()}/api/chat`, { message, history }, { timeout: 120000 })
      return data
    }
    throw err
  }
}

export async function clearKnowledgeBase() {
  try {
    const { data } = await axios.delete('/api/clear', { timeout: 10000 })
    return data
  } catch {
    const { data } = await axios.delete(`${getBackendUrl()}/api/clear`, { timeout: 10000 })
    return data
  }
}
