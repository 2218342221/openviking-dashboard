import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'

import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
import AccountsView from '../views/AccountsView.vue'
import SessionsView from '../views/SessionsView.vue'
import StorageView from '../views/StorageView.vue'
import SearchView from '../views/SearchView.vue'
import ResourcesView from '../views/ResourcesView.vue'
import RelationsView from '../views/RelationsView.vue'
import PackView from '../views/PackView.vue'
import SystemView from '../views/SystemView.vue'
import AppLayout from '../layouts/AppLayout.vue'

const routes = [
  { path: '/login', name: 'login', component: LoginView, meta: { guest: true } },
  { path: '/register', name: 'register', component: RegisterView, meta: { guest: true } },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', component: DashboardView },
      { path: 'accounts', name: 'accounts', component: AccountsView },
      { path: 'sessions', name: 'sessions', component: SessionsView },
      { path: 'storage', name: 'storage', component: StorageView },
      { path: 'search', name: 'search', component: SearchView },
      { path: 'resources', name: 'resources', component: ResourcesView },
      { path: 'relations', name: 'relations', component: RelationsView },
      { path: 'pack', name: 'pack', component: PackView },
      { path: 'system', name: 'system', component: SystemView, meta: { adminOnly: true } },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  const { isLoggedIn, isAdmin } = useAuth()
  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return { name: 'login' }
  }
  if (to.meta.guest && isLoggedIn.value) {
    return { name: 'dashboard' }
  }
  if (to.meta.adminOnly && !isAdmin.value) {
    return { name: 'dashboard' }
  }
})

export default router
