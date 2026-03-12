import { useAuth } from './useAuth'

export function useApi() {
  const { state } = useAuth()

  async function api(endpoint, { method = 'GET', body, query } = {}) {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '')
    let url = base + '/api' + endpoint
    if (query) {
      const qs = new URLSearchParams(query).toString()
      if (qs) url += '?' + qs
    }
    const headers = { 'Content-Type': 'application/json' }
    if (state.apiKey) {
      headers['X-API-Key'] = state.apiKey
    }
    const opts = { method, headers }
    if (body && method !== 'GET' && method !== 'HEAD') {
      opts.body = JSON.stringify(body)
    }
    const res = await fetch(url, opts)
    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch { data = text }
    if (!res.ok) {
      const msg = typeof data === 'object'
        ? (data.detail?.message || data.detail?.detail || data.detail || data.error || data.message || JSON.stringify(data))
        : data
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
    }
    return data
  }

  function get(endpoint, query) { return api(endpoint, { query }) }
  function post(endpoint, body) { return api(endpoint, { method: 'POST', body }) }
  function put(endpoint, body) { return api(endpoint, { method: 'PUT', body }) }
  function del(endpoint, query) { return api(endpoint, { method: 'DELETE', query }) }

  return { api, get, post, put, del }
}
