<script setup>
import { useToast } from '../../composables/useToast'
const { toasts, remove } = useToast()

const typeClasses = {
  success: 'bg-green-900/80 border-green-500 text-green-200',
  error: 'bg-red-900/80 border-red-500 text-red-200',
  warning: 'bg-yellow-900/80 border-yellow-500 text-yellow-200',
  info: 'bg-blue-900/80 border-blue-500 text-blue-200',
}
</script>

<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        :class="typeClasses[t.type] || typeClasses.info"
        class="border-l-4 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm flex items-start gap-2 cursor-pointer"
        @click="remove(t.id)"
      >
        <span class="text-sm flex-1">{{ t.message }}</span>
        <button class="opacity-60 hover:opacity-100 text-lg leading-none">&times;</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active { transition: all 0.3s ease-out; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from { opacity: 0; transform: translateX(100%); }
.toast-leave-to { opacity: 0; transform: translateX(100%); }
</style>
