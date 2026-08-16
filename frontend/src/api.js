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

/**
 * Extracts a human-readable error message from an Axios error,
 * including the backend detail field when present.
 */
function extractErrorMessage(err) {
  if (err.response) {
    // Backend responded with a non-2xx status
    const detail = err.response?.data?.detail
    if (detail) return typeof detail === 'string' ? detail : JSON.stringify(detail)
    return `Request failed with status code ${err.response.status}`
  }
  return err.message || 'Unknown error'
}

/**
 * fetchHealth — polls /api/health with a generous timeout to handle
 * Render free-tier cold-starts (which can take up to 60 s).
 * Retries up to 3 times with 8-second gaps before giving up.
 */
export async function fetchHealth() {
  const maxAttempts = 3
  let lastErr
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Try relative path first (Vercel rewrite / same-origin proxy)
      const { data } = await axios.get('/api/health', { timeout: 15000 })
      return data
    } catch (err) {
      lastErr = err
      // If the backend responded (e.g. 5xx) don't bother retrying with direct URL
      if (err.response) break
      try {
        // Direct backend URL fallback (local dev or if Vercel rewrite unavailable)
        const { data } = await axios.get(`${getBackendUrl()}/api/health`, { timeout: 15000 })
        return data
      } catch (directErr) {
        lastErr = directErr
      }
    }
    if (attempt < maxAttempts - 1) {
      // Wait 8 s before retrying — gives Render time to wake up
      await new Promise(resolve => setTimeout(resolve, 8000))
    }
  }
  throw lastErr
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
      // Network error — retry once against direct backend URL
      await new Promise(resolve => setTimeout(resolve, 1000))
      try {
        const { data } = await axios.post(`${getBackendUrl()}/api/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 300000,
        })
        return data
      } catch (directErr) {
        throw new Error(extractErrorMessage(directErr))
      }
    }
    // Re-throw with a clear message so the Pipeline Inspector can display it
    throw new Error(extractErrorMessage(err))
  }
}

export async function sendChatMessage(message, history = []) {
  try {
    const { data } = await axios.post('/api/chat', { message, history }, { timeout: 120000 })
    return data
  } catch (err) {
    if (!err.response) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      try {
        const { data } = await axios.post(`${getBackendUrl()}/api/chat`, { message, history }, { timeout: 120000 })
        return data
      } catch (directErr) {
        throw new Error(extractErrorMessage(directErr))
      }
    }
    throw new Error(extractErrorMessage(err))
  }
}

export async function clearKnowledgeBase() {
  try {
    const { data } = await axios.delete('/api/clear', { timeout: 10000 })
    return data
  } catch (err) {
    if (!err.response) {
      try {
        const { data } = await axios.delete(`${getBackendUrl()}/api/clear`, { timeout: 10000 })
        return data
      } catch (directErr) {
        throw new Error(extractErrorMessage(directErr))
      }
    }
    throw new Error(extractErrorMessage(err))
  }
}
