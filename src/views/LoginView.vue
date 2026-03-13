<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { login, getSavedKeys, removeSavedKey } = useAuth()

const apiKey = ref('')
const showKey = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const savedKeys = ref(getSavedKeys())

async function doLogin(key) {
  if (!key) return
  loading.value = true
  errorMsg.value = ''
  try {
    await login(key)
    router.push({ name: 'dashboard' })
  } catch (e) {
    errorMsg.value = e.message
  } finally {
    loading.value = false
  }
}

function selectSavedKey(entry) {
  apiKey.value = entry.apiKey
  doLogin(entry.apiKey)
}

function deleteSavedKey(entry, event) {
  event.stopPropagation()
  removeSavedKey(entry.apiKey)
  savedKeys.value = getSavedKeys()
}

function maskKey(key) {
  if (key.length <= 8) return '****'
  return key.slice(0, 4) + '...' + key.slice(-4)
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-ov-bg via-ov-surface to-ov-bg flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ov-accent/10 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-ov-accent">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-ov-text">OpenViking</h1>
        <p class="text-ov-text-muted mt-2">Enter your API key to continue</p>
      </div>

      <!-- Login Card -->
      <div class="bg-ov-surface border border-ov-border rounded-2xl p-6 shadow-xl">
        <!-- Saved Keys -->
        <div v-if="savedKeys.length > 0" class="mb-6">
          <label class="block text-xs font-medium text-ov-text-muted uppercase tracking-wide mb-2">Saved Keys</label>
          <div class="space-y-2 max-h-48 overflow-auto">
            <button
              v-for="entry in savedKeys"
              :key="entry.apiKey"
              @click="selectSavedKey(entry)"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-ov-bg border border-ov-border hover:border-ov-accent/50 transition-colors cursor-pointer group text-left"
            >
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-ov-text truncate">
                  {{ entry.accountId || 'root' }} / {{ entry.userId || 'admin' }}
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-ov-text-muted font-mono">{{ maskKey(entry.apiKey) }}</span>
                  <span
                    class="text-xs px-1.5 py-0.5 rounded-full font-medium"
                    :class="entry.role === 'root' ? 'bg-ov-accent/20 text-ov-accent' : entry.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'"
                  >{{ entry.role }}</span>
                </div>
              </div>
              <button
                @click="deleteSavedKey(entry, $event)"
                class="opacity-0 group-hover:opacity-100 text-ov-text-muted hover:text-ov-danger transition-all cursor-pointer p-1"
                title="Remove saved key"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </button>
          </div>
          <div class="border-t border-ov-border mt-4 pt-4">
            <label class="block text-xs font-medium text-ov-text-muted uppercase tracking-wide mb-2">Or enter manually</label>
          </div>
        </div>

        <!-- Manual Input -->
        <div class="relative mb-4">
          <input
            v-model="apiKey"
            :type="showKey ? 'text' : 'password'"
            placeholder="Paste your API key"
            class="w-full px-4 py-3 pr-12 bg-ov-input border border-ov-input-border rounded-lg text-ov-text placeholder-ov-text-muted/50 focus:outline-none focus:border-ov-accent transition-colors font-mono text-sm"
            @keyup.enter="doLogin(apiKey)"
          />
          <button
            @click="showKey = !showKey"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-ov-text-muted hover:text-ov-text transition-colors cursor-pointer"
          >
            <svg v-if="showKey" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>
        </div>

        <!-- Error -->
        <div v-if="errorMsg" class="mb-4 px-3 py-2 rounded-lg bg-ov-danger/10 border border-ov-danger/30 text-ov-danger text-sm">
          {{ errorMsg }}
        </div>

        <!-- Login Button -->
        <button
          @click="doLogin(apiKey)"
          :disabled="!apiKey || loading"
          class="w-full py-3 rounded-lg bg-ov-accent hover:bg-ov-accent-hover text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        >
          <svg v-if="loading" class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {{ loading ? 'Authenticating...' : 'Login' }}
        </button>
      </div>

      <!-- Register link -->
      <div class="text-center mt-4">
        <span class="text-sm text-ov-text-muted">Don't have an API key? </span>
        <router-link :to="{ name: 'register' }" class="text-sm text-ov-accent hover:text-ov-accent-hover font-medium transition-colors">
          Create a new user
        </router-link>
      </div>
    </div>
  </div>
</template>
