<script setup>
defineProps({
  show: Boolean,
  title: { type: String, default: 'Confirm' },
  message: { type: String, default: 'Are you sure?' },
  confirmText: { type: String, default: 'Confirm' },
  danger: { type: Boolean, default: false },
})
const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('cancel')" />
        <div class="relative bg-ov-surface border border-ov-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
          <h3 class="text-lg font-semibold text-ov-text mb-2">{{ title }}</h3>
          <p class="text-sm text-ov-text-muted mb-6">{{ message }}</p>
          <div class="flex justify-end gap-3">
            <button
              @click="emit('cancel')"
              class="px-4 py-2 text-sm rounded-lg border border-ov-border text-ov-text-muted hover:bg-ov-surface-2 transition-colors cursor-pointer"
            >Cancel</button>
            <button
              @click="emit('confirm')"
              :class="danger
                ? 'bg-ov-danger hover:bg-ov-danger-hover'
                : 'bg-ov-accent hover:bg-ov-accent-hover'"
              class="px-4 py-2 text-sm rounded-lg text-white font-medium transition-colors cursor-pointer"
            >{{ confirmText }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active { transition: all 0.2s ease-out; }
.modal-leave-active { transition: all 0.15s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .relative { transform: scale(0.95); }
</style>
