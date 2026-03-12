import { reactive, computed } from 'vue'

const STORAGE_KEY = 'ov_saved_keys'
const SESSION_KEY = 'ov_session'

const state = reactive({
  apiKey: null,
  role: null,
  accountId: null,
  userId: null,
})

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      state.apiKey = s.apiKey
      state.role = s.role
      state.accountId = s.accountId
      state.userId = s.userId
    }
  } catch { /* ignore */ }
}
loadSession()

function saveSession() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    apiKey: state.apiKey,
    role: state.role,
    accountId: state.accountId,
    userId: state.userId,
  }))
}

export function useAuth() {
  const isLoggedIn = computed(() => !!state.apiKey)
  const isRoot = computed(() => state.role === 'root')
  const isAdmin = computed(() => state.role === 'admin' || state.role === 'root')

  async function login(apiKey) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }))
      throw new Error(err.error || err.detail || 'Login failed')
    }
    const data = await res.json()
    state.apiKey = apiKey
    state.role = data.role
    state.accountId = data.account_id
    state.userId = data.user_id
    saveSession()
  }

  function logout() {
    state.apiKey = null
    state.role = null
    state.accountId = null
    state.userId = null
    sessionStorage.removeItem(SESSION_KEY)
  }

  function canManageUsers(accountId) {
    if (state.role === 'root') return true
    if (accountId === 'default') return true
    return state.role === 'admin' && state.accountId === accountId
  }

  function getSavedKeys() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch { return [] }
  }

  function saveKey(apiKey, accountId, userId, role) {
    const keys = getSavedKeys().filter(k => k.apiKey !== apiKey)
    keys.unshift({ apiKey, accountId, userId, role, savedAt: Date.now() })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys.slice(0, 50)))
  }

  function removeSavedKey(apiKey) {
    const keys = getSavedKeys().filter(k => k.apiKey !== apiKey)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys))
  }

  return {
    state,
    isLoggedIn,
    isRoot,
    isAdmin,
    login,
    logout,
    canManageUsers,
    getSavedKeys,
    saveKey,
    removeSavedKey,
  }
}
