<script setup>
import { ref, onMounted, computed } from 'vue'
import { useApi } from '../composables/useApi'
import { useAuth } from '../composables/useAuth'
import { useToast } from '../composables/useToast'
import PageHeader from '../components/common/PageHeader.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'

const { get, post, del, put } = useApi()
const { canManageUsers, saveKey, state: authState } = useAuth()
const toast = useToast()

const accounts = ref([])
const selectedAccount = ref(null)
const users = ref([])
const newAccountId = ref('')
const newAdminUserId = ref('')
const newUserId = ref('')
const newUserRole = ref('user')
const newKeyDisplay = ref(null)
const newKeyMeta = ref({})
const confirmDelete = ref({ show: false, type: '', id: '', name: '' })

const canManageSelected = computed(() =>
  selectedAccount.value ? canManageUsers(selectedAccount.value) : false
)

async function loadAccounts() {
  try {
    const d = await get('/admin/accounts')
    const r = d.result !== undefined ? d.result : d
    accounts.value = Array.isArray(r) ? r : (r.accounts || [])
  } catch (e) { toast.error(e.message) }
}

async function createAccount() {
  if (!newAccountId.value || !newAdminUserId.value) return
  try {
    const d = await post('/admin/accounts', {
      account_id: newAccountId.value,
      admin_user_id: newAdminUserId.value,
    })
    const r = d.result || d
    const key = r.user_key || r.api_key
    if (key) {
      newKeyDisplay.value = key
      newKeyMeta.value = { accountId: newAccountId.value, userId: newAdminUserId.value }
      saveKey(key, newAccountId.value, newAdminUserId.value, 'admin')
    }
    toast.success(`Account "${newAccountId.value}" created`)
    newAccountId.value = ''
    newAdminUserId.value = ''
    await loadAccounts()
    if (r.account_id) selectAccount(r.account_id)
  } catch (e) { toast.error(e.message) }
}

function accId(acc) {
  return typeof acc === 'string' ? acc : (acc.id || acc.account_id || JSON.stringify(acc))
}

function userId(u) {
  return typeof u === 'string' ? u : (u.id || u.user_id || JSON.stringify(u))
}

async function selectAccount(id) {
  selectedAccount.value = id
  newKeyDisplay.value = null
  await loadUsers()
}

async function loadUsers() {
  if (!selectedAccount.value) return
  try {
    const d = await get(`/admin/accounts/${encodeURIComponent(selectedAccount.value)}/users`)
    const r = d.result !== undefined ? d.result : d
    users.value = Array.isArray(r) ? r : (r.users || [])
  } catch (e) { toast.error(e.message) }
}

async function createUser() {
  if (!newUserId.value || !selectedAccount.value) return
  try {
    const d = await post(`/admin/accounts/${encodeURIComponent(selectedAccount.value)}/users`, {
      user_id: newUserId.value,
      role: newUserRole.value,
    })
    const r = d.result || d
    const key = r.user_key || r.api_key
    if (key) {
      newKeyDisplay.value = key
      newKeyMeta.value = { accountId: selectedAccount.value, userId: newUserId.value }
      saveKey(key, selectedAccount.value, newUserId.value, newUserRole.value)
    }
    toast.success(`User "${newUserId.value}" added`)
    newUserId.value = ''
    loadUsers()
  } catch (e) { toast.error(e.message) }
}

async function deleteAccount(id) {
  try {
    await del(`/admin/accounts/${encodeURIComponent(id)}`)
    if (selectedAccount.value === id) { selectedAccount.value = null; users.value = [] }
    toast.success(`Account "${id}" deleted`)
    loadAccounts()
  } catch (e) { toast.error(e.message) }
}

async function deleteUser(uid) {
  try {
    await del(`/admin/accounts/${encodeURIComponent(selectedAccount.value)}/users/${encodeURIComponent(uid)}`)
    toast.success(`User "${uid}" removed`)
    loadUsers()
  } catch (e) { toast.error(e.message) }
}

async function toggleRole(u) {
  const uid = userId(u)
  const newRole = u.role === 'admin' ? 'user' : 'admin'
  try {
    await put(`/admin/accounts/${encodeURIComponent(selectedAccount.value)}/users/${encodeURIComponent(uid)}/role`, { role: newRole })
    toast.success(`${uid} is now "${newRole}"`)
    loadUsers()
  } catch (e) { toast.error(e.message) }
}

async function regenKey(uid) {
  try {
    const d = await post(`/admin/accounts/${encodeURIComponent(selectedAccount.value)}/users/${encodeURIComponent(uid)}/key`)
    const r = d.result || d
    const key = r.user_key || r.api_key
    if (key) {
      newKeyDisplay.value = key
      newKeyMeta.value = { accountId: selectedAccount.value, userId: uid }
      saveKey(key, selectedAccount.value, uid, users.value.find(u => userId(u) === uid)?.role || 'user')
    }
    toast.success(`New key generated for ${uid}`)
  } catch (e) { toast.error(e.message) }
}

async function copyKey(key) {
  try {
    await navigator.clipboard.writeText(key)
    toast.success('Copied to clipboard')
  } catch { /* fallback */ }
}

function doConfirmDelete() {
  if (confirmDelete.value.type === 'account') deleteAccount(confirmDelete.value.id)
  else if (confirmDelete.value.type === 'user') deleteUser(confirmDelete.value.id)
  confirmDelete.value.show = false
}

onMounted(loadAccounts)
</script>

<template>
  <div>
    <PageHeader title="Accounts" subtitle="Manage accounts and users">
      <template #actions>
        <button
          @click="loadAccounts"
          class="px-4 py-2 text-sm rounded-lg border border-ov-border text-ov-text-muted hover:bg-ov-surface-2 transition-colors cursor-pointer"
        >Refresh</button>
      </template>
    </PageHeader>

    <!-- Create Account -->
    <div class="bg-ov-surface border border-ov-border rounded-xl p-6 mb-6">
      <h2 class="text-base font-semibold text-ov-text mb-4">Create Account</h2>
      <div class="flex flex-wrap gap-3 items-end">
        <div>
          <label class="block text-xs text-ov-text-muted mb-1">Account ID</label>
          <input v-model="newAccountId" placeholder="e.g. my-team"
            class="px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text placeholder-ov-text-muted/50 focus:outline-none focus:border-ov-accent transition-colors w-48" />
        </div>
        <div>
          <label class="block text-xs text-ov-text-muted mb-1">Admin User ID</label>
          <input v-model="newAdminUserId" placeholder="e.g. alice"
            class="px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text placeholder-ov-text-muted/50 focus:outline-none focus:border-ov-accent transition-colors w-48" />
        </div>
        <button
          @click="createAccount"
          :disabled="!newAccountId || !newAdminUserId"
          class="px-5 py-2 bg-ov-accent hover:bg-ov-accent-hover text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >Create</button>
      </div>
    </div>

    <!-- API Key Reveal -->
    <div v-if="newKeyDisplay" class="bg-ov-accent/10 border border-ov-accent/30 rounded-xl p-5 mb-6">
      <p class="text-sm text-ov-accent font-semibold mb-2">API Key generated (saved for quick login):</p>
      <div class="flex items-center gap-2">
        <code class="flex-1 font-mono text-sm bg-ov-bg px-3 py-2 rounded-lg border border-ov-border text-ov-text select-all break-all">{{ newKeyDisplay }}</code>
        <button @click="copyKey(newKeyDisplay)" class="px-3 py-2 text-sm text-ov-accent hover:text-ov-accent-hover transition-colors cursor-pointer whitespace-nowrap">Copy</button>
      </div>
      <p class="text-xs text-ov-text-muted mt-2">{{ newKeyMeta.accountId }} / {{ newKeyMeta.userId }}</p>
    </div>

    <!-- Accounts Table -->
    <div class="bg-ov-surface border border-ov-border rounded-xl overflow-hidden mb-6">
      <table class="w-full">
        <thead>
          <tr class="border-b border-ov-border">
            <th class="px-5 py-3 text-left text-xs font-medium text-ov-text-muted uppercase tracking-wide">Account ID</th>
            <th class="px-5 py-3 text-left text-xs font-medium text-ov-text-muted uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-ov-border">
          <tr
            v-for="acc in accounts"
            :key="accId(acc)"
            :class="selectedAccount === accId(acc) ? 'bg-ov-surface-2' : ''"
            class="hover:bg-ov-surface-2/50 transition-colors"
          >
            <td class="px-5 py-3 text-sm font-medium text-ov-text">{{ accId(acc) }}</td>
            <td class="px-5 py-3 flex gap-3">
              <button @click="selectAccount(accId(acc))" class="text-ov-info text-sm hover:underline cursor-pointer">Manage Users</button>
              <button
                @click="confirmDelete = { show: true, type: 'account', id: accId(acc), name: accId(acc) }"
                class="text-ov-danger text-sm hover:underline cursor-pointer"
              >Delete</button>
            </td>
          </tr>
          <tr v-if="accounts.length === 0">
            <td colspan="2" class="px-5 py-8 text-center text-ov-text-muted">No accounts found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Users Panel -->
    <div v-if="selectedAccount" class="bg-ov-surface border-t-2 border-ov-accent border border-ov-border rounded-xl p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-base font-semibold text-ov-text">
          Users in <span class="text-ov-accent">{{ selectedAccount }}</span>
        </h2>
        <button @click="loadUsers" class="text-sm text-ov-info hover:underline cursor-pointer">Refresh</button>
      </div>

      <!-- Add User -->
      <div v-if="canManageSelected" class="flex flex-wrap gap-3 items-end mb-4 pb-4 border-b border-ov-border">
        <div>
          <label class="block text-xs text-ov-text-muted mb-1">User ID</label>
          <input v-model="newUserId" placeholder="e.g. bob"
            class="px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text placeholder-ov-text-muted/50 focus:outline-none focus:border-ov-accent transition-colors w-40" />
        </div>
        <div>
          <label class="block text-xs text-ov-text-muted mb-1">Role</label>
          <select v-model="newUserRole"
            class="px-3 py-2 bg-ov-input border border-ov-input-border rounded-lg text-sm text-ov-text focus:outline-none focus:border-ov-accent transition-colors cursor-pointer">
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <button
          @click="createUser"
          :disabled="!newUserId"
          class="px-4 py-2 bg-ov-accent hover:bg-ov-accent-hover text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >Add User</button>
      </div>
      <div v-else class="mb-4 pb-4 border-b border-ov-border">
        <p class="text-sm text-ov-text-muted">You don't have permission to manage users in this account.</p>
      </div>

      <!-- Users Table -->
      <table class="w-full">
        <thead>
          <tr class="border-b border-ov-border">
            <th class="px-4 py-3 text-left text-xs font-medium text-ov-text-muted uppercase tracking-wide">User ID</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-ov-text-muted uppercase tracking-wide">Role</th>
            <th v-if="canManageSelected" class="px-4 py-3 text-left text-xs font-medium text-ov-text-muted uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-ov-border">
          <tr v-for="u in users" :key="userId(u)" class="hover:bg-ov-surface-2/50 transition-colors">
            <td class="px-4 py-3 text-sm font-medium text-ov-text">{{ userId(u) }}</td>
            <td class="px-4 py-3">
              <span
                class="text-xs px-2 py-0.5 rounded-full font-medium"
                :class="u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'"
              >{{ u.role || 'user' }}</span>
            </td>
            <td v-if="canManageSelected" class="px-4 py-3 flex gap-3">
              <button @click="toggleRole(u)" class="text-purple-400 text-sm hover:underline cursor-pointer">
                {{ u.role === 'admin' ? 'Demote' : 'Promote' }}
              </button>
              <button @click="regenKey(userId(u))" class="text-ov-warning text-sm hover:underline cursor-pointer">Regen Key</button>
              <button
                @click="confirmDelete = { show: true, type: 'user', id: userId(u), name: userId(u) }"
                class="text-ov-danger text-sm hover:underline cursor-pointer"
              >Remove</button>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td :colspan="canManageSelected ? 3 : 2" class="px-4 py-8 text-center text-ov-text-muted">No users found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <ConfirmDialog
      :show="confirmDelete.show"
      :title="`Delete ${confirmDelete.type}`"
      :message="`Are you sure you want to delete ${confirmDelete.type} '${confirmDelete.name}'? This cannot be undone.`"
      confirm-text="Delete"
      :danger="true"
      @confirm="doConfirmDelete"
      @cancel="confirmDelete.show = false"
    />
  </div>
</template>
