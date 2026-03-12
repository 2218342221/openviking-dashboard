<script setup>
import { ref } from 'vue'
import SidebarNav from '../components/sidebar/SidebarNav.vue'
import SidebarUserBadge from '../components/sidebar/SidebarUserBadge.vue'
import ToastContainer from '../components/common/ToastContainer.vue'

const sidebarOpen = ref(false)
</script>

<template>
  <div class="flex h-screen bg-ov-bg">
    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/50 z-30 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
      class="fixed lg:static lg:translate-x-0 z-40 flex flex-col w-60 h-full bg-ov-sidebar border-r border-ov-border transition-transform duration-200"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 px-5 py-5 border-b border-ov-border">
        <div class="w-8 h-8 rounded-lg bg-ov-accent/20 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-ov-accent">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
          </svg>
        </div>
        <span class="text-lg font-bold text-ov-text">OpenViking</span>
      </div>

      <SidebarNav />
      <SidebarUserBadge />
    </aside>

    <!-- Main content -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Mobile header -->
      <header class="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-ov-border bg-ov-surface">
        <button @click="sidebarOpen = true" class="text-ov-text-muted hover:text-ov-text cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <span class="text-lg font-bold text-ov-text">OpenViking</span>
      </header>

      <div class="flex-1 overflow-auto p-6">
        <router-view />
      </div>
    </main>

    <ToastContainer />
  </div>
</template>
