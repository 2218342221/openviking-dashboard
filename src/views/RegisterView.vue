<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { login, saveKey } = useAuth()

const userId = ref('')
const loading = ref(false)
const errorMsg = ref('')
const created = ref(null)
const keyCopied = ref(false)

async function doRegister() {
  if (!userId.value.trim()) return
  loading.value = true
  errorMsg.value = ''
  created.value = null
  try {
    const pathBase = window.location.pathname.replace(/\/?$/, '')
    const res = await fetch(pathBase + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId.value.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      const msg = data.detail?.message || data.detail?.detail || data.detail || data.error || data.message || JSON.stringify(data)
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
    }
    const result = data.result || data
    const apiKey = result.api_key || result.apiKey || result.user_key || result.userKey
    if (!apiKey) throw new Error('No API key returned')
    created.value = { userId: userId.value.trim(), apiKey }
    saveKey(apiKey, 'default', userId.value.trim(), 'user')
  } catch (e) {
    errorMsg.value = e.message
  } finally {
    loading.value = false
  }
}

async function copyKey() {
  if (!created.value) return
  try {
    await navigator.clipboard.writeText(created.value.apiKey)
    keyCopied.value = true
    setTimeout(() => { keyCopied.value = false }, 2000)
  } catch { /* ignore */ }
}

async function loginWithKey() {
  if (!created.value) return
  loading.value = true
  try {
    await login(created.value.apiKey)
    router.push({ name: 'dashboard' })
  } catch (e) {
    errorMsg.value = e.message
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-ov-bg via-ov-surface to-ov-bg flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ov-accent/10 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-ov-accent">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-ov-text">Create User</h1>
        <p class="text-ov-text-muted mt-2">Create a new user under the default account</p>
      </div>

      <!-- Registration Card -->
      <div class="bg-ov-surface border border-ov-border rounded-2xl p-6 shadow-xl">
        <!-- Success State -->
        <div v-if="created" class="space-y-4">
          <div class="flex items-center gap-2 text-ov-accent mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span class="font-semibold">User created successfully</span>
          </div>

          <div class="bg-ov-bg rounded-lg p-4 space-y-3">
            <div>
              <div class="text-xs text-ov-text-muted mb-1">User ID</div>
              <div class="text-sm font-medium text-ov-text">{{ created.userId }}</div>
            </div>
            <div>
              <div class="text-xs text-ov-text-muted mb-1">Account</div>
              <div class="text-sm font-medium text-ov-text">default</div>
            </div>
            <div>
              <div class="text-xs text-ov-text-muted mb-1">API Key</div>
              <div class="flex items-center gap-2">
                <code class="text-sm font-mono text-ov-accent bg-ov-surface px-2 py-1 rounded break-all flex-1">{{ created.apiKey }}</code>
                <button @click="copyKey" class="shrink-0 p-1.5 rounded-lg hover:bg-ov-surface-2 transition-colors cursor-pointer" title="Copy">
                  <svg v-if="keyCopied" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-ov-accent">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-ov-text-muted">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div class="p-3 bg-ov-warning/10 border border-ov-warning/20 rounded-lg">
            <p class="text-xs text-ov-warning">Please save your API key now. It has been stored in your browser for quick login, but you should also keep a copy somewhere safe.</p>
          </div>

          <button @click="loginWithKey" :disabled="loading"
            class="w-full py-3 rounded-lg bg-ov-accent hover:bg-ov-accent-hover text-white font-semibold text-sm transition-colors cursor-pointer disabled:opacity-40">
            {{ loading ? 'Logging in...' : 'Login with this key' }}
          </button>
        </div>

        <!-- Registration Form -->
        <div v-else>
          <div class="mb-4">
            <label class="block text-xs font-medium text-ov-text-muted uppercase tracking-wide mb-2">User ID</label>
            <input
              v-model="userId"
              type="text"
              placeholder="e.g. alice, bob"
              class="w-full px-4 py-3 bg-ov-input border border-ov-input-border rounded-lg text-ov-text placeholder-ov-text-muted/50 focus:outline-none focus:border-ov-accent transition-colors text-sm"
              @keyup.enter="doRegister"
            />
          </div>

          <div v-if="errorMsg" class="mb-4 px-3 py-2 rounded-lg bg-ov-danger/10 border border-ov-danger/30 text-ov-danger text-sm">
            {{ errorMsg }}
          </div>

          <button @click="doRegister" :disabled="!userId.trim() || loading"
            class="w-full py-3 rounded-lg bg-ov-accent hover:bg-ov-accent-hover text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2">
            <svg v-if="loading" class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ loading ? 'Creating...' : 'Create User' }}
          </button>
        </div>
      </div>

      <!-- Back to login -->
      <div class="text-center mt-4">
        <router-link :to="{ name: 'login' }" class="text-sm text-ov-text-muted hover:text-ov-accent transition-colors">
          &larr; Back to login
        </router-link>
      </div>
    </div>
  </div>
</template>
