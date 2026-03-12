import { reactive } from 'vue'

const toasts = reactive([])
let nextId = 0

export function useToast() {
  function add(message, type = 'info', duration = 4000) {
    const id = nextId++
    toasts.push({ id, message, type })
    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }
  }

  function remove(id) {
    const idx = toasts.findIndex(t => t.id === id)
    if (idx !== -1) toasts.splice(idx, 1)
  }

  function success(msg) { add(msg, 'success') }
  function error(msg) { add(msg, 'error', 6000) }
  function info(msg) { add(msg, 'info') }
  function warning(msg) { add(msg, 'warning') }

  return { toasts, add, remove, success, error, info, warning }
}
