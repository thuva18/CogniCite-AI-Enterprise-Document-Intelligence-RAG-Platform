import axios from 'axios'

// Dynamically construct backend URL matching current window hostname (localhost or 127.0.0.1)
const getBackendUrl = () => {
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
      const { data } = await axios.post(`${getBackendUrl()}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      })
      return data
    }
    throw err
  }
}

export async function sendChatMessage(message) {
  try {
    const { data } = await axios.post('/api/chat', { message }, { timeout: 120000 })
    return data
  } catch (err) {
    if (!err.response) {
      const { data } = await axios.post(`${getBackendUrl()}/api/chat`, { message }, { timeout: 120000 })
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
