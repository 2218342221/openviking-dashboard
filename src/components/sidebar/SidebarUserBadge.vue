<script setup>
import { useAuth } from '../../composables/useAuth'
const { state, logout, isRoot } = useAuth()

const roleColors = {
  root: 'bg-ov-accent/20 text-ov-accent',
  admin: 'bg-purple-500/20 text-purple-400',
  user: 'bg-blue-500/20 text-blue-400',
}
</script>

<template>
  <div class="px-3 py-4 border-t border-ov-border">
    <div class="flex items-center gap-3 mb-3">
      <div class="w-8 h-8 rounded-full bg-ov-surface-2 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-ov-text-muted">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-ov-text truncate">
          {{ isRoot ? 'Root Admin' : (state.userId || 'User') }}
        </div>
        <div class="flex items-center gap-2">
          <span
            :class="roleColors[state.role] || roleColors.user"
            class="text-xs px-1.5 py-0.5 rounded-full font-medium"
          >{{ state.role }}</span>
          <span v-if="state.accountId" class="text-xs text-ov-text-muted truncate">{{ state.accountId }}</span>
        </div>
      </div>
    </div>
    <button
      @click="logout(); $router.push({ name: 'login' })"
      class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ov-text-muted hover:bg-ov-surface-2 hover:text-ov-danger transition-colors cursor-pointer"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
      </svg>
      Logout
    </button>
  </div>
</template>
