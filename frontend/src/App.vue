<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'
import { authService, currentRole } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Toaster } from '@/components/ui/toast'

const route = useRoute()
const authRoutes = ['login', 'activate', 'forgot-password', 'reset-password']
const isAuthPage = computed(() => authRoutes.includes(route.name as string))
const userRole = computed(() => currentRole.value)
const canManage = computed(() => userRole.value === 'sekre' || userRole.value === 'ketum')

const handleLogout = () => {
  authService.logout()
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 antialiased selection:bg-sky-200 relative">
    <!-- Floema Subtle Ambient Grid & Corner Blurs (Unifies workspace with Login) -->
    <div v-if="!isAuthPage" class="pointer-events-none fixed inset-0 overflow-hidden z-0">
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#0284C7_1px,transparent_1px),linear-gradient(to_bottom,#0284C7_1px,transparent_1px)] bg-[size:64px_64px] opacity-[0.025]" />
      <div class="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-sky-400/8 to-transparent blur-3xl" />
      <div class="absolute -bottom-32 -left-32 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-orange-400/6 to-transparent blur-3xl" />
    </div>

    <!-- Header with Floema Architectural Styling (Hidden on Auth pages) -->
    <header
      v-if="!isAuthPage"
      class="bg-white/95 sm:bg-white/90 sm:backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs transition-all"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        <!-- Top Row: Brand & Profile / Controls (Single row on desktop, split on mobile) -->
        <div class="h-14 sm:h-16 flex items-center justify-between gap-4">
          <!-- Left: Brand Logo -->
          <RouterLink to="/" class="flex items-center space-x-2.5 shrink-0 select-none outline-none focus:outline-none">
            <img
              src="/logo-doscom.png"
              alt="DOSCOM"
              class="w-8 h-8 rounded-full object-contain shrink-0 shadow-xs"
              @error="(e) => ((e.target as HTMLElement).style.display = 'none')"
            />
            <div>
              <h1 class="text-sm font-semibold leading-none tracking-tight text-slate-900">LACI</h1>
              <p class="hidden lg:block text-[10px] text-slate-400 mt-0.5">Pelacakan Surat DOSCOM</p>
            </div>
          </RouterLink>

          <!-- Middle: Desktop Architectural Pill Navigation (Hidden on mobile, inline on md+) -->
          <nav
            class="hidden md:flex items-center p-1 bg-slate-100/80 rounded-full space-x-1"
            aria-label="Navigasi Utama Desktop"
          >
            <RouterLink
              v-if="userRole"
              to="/"
              class="px-3 lg:px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 transition-all select-none outline-none focus:outline-none"
              active-class="!bg-white !text-sky-700 !font-semibold shadow-2xs"
            >
              Kanban Board
            </RouterLink>
            <RouterLink
              v-if="canManage"
              to="/letters"
              class="px-3 lg:px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 transition-all select-none outline-none focus:outline-none"
              active-class="!bg-white !text-sky-700 !font-semibold shadow-2xs"
            >
              Surat
            </RouterLink>
            <RouterLink
              v-if="canManage"
              to="/programs"
              class="px-3 lg:px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 transition-all select-none outline-none focus:outline-none"
              active-class="!bg-white !text-sky-700 !font-semibold shadow-2xs"
            >
              Proker
            </RouterLink>
            <RouterLink
              v-if="canManage"
              to="/users"
              class="px-3 lg:px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 transition-all select-none outline-none focus:outline-none"
              active-class="!bg-white !text-sky-700 !font-semibold shadow-2xs"
            >
              Pengurus
            </RouterLink>
            <RouterLink
              v-if="userRole"
              to="/profile"
              class="px-3 lg:px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 transition-all select-none outline-none focus:outline-none"
              active-class="!bg-white !text-sky-700 !font-semibold shadow-2xs"
            >
              Profil
            </RouterLink>
          </nav>

          <!-- Right: User Role Badge & Logout -->
          <div class="flex items-center gap-2 sm:gap-3 shrink-0">
            <Badge
              v-if="userRole"
              variant="info"
              size="pill"
              class="font-mono uppercase font-bold text-[10px]"
            >
              {{ userRole }}
            </Badge>

            <Button
              variant="ghost"
              size="sm"
              @click="handleLogout"
              class="text-xs text-slate-500 hover:text-slate-900 font-medium h-8 px-2.5 sm:px-3 rounded-full"
            >
              <svg class="w-3.5 h-3.5 sm:mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span class="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>

        <!-- Mobile Horizontal Pill Navigation (Only shown on < md) -->
        <div class="md:hidden pb-2.5 pt-0.5 overflow-x-auto no-scrollbar flex justify-start sm:justify-center px-1">
          <nav
            class="flex items-center p-1 bg-slate-100/80 rounded-full space-x-1 min-w-max shrink-0"
            aria-label="Navigasi Utama Mobile"
          >
            <RouterLink
              v-if="userRole"
              to="/"
              class="px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 transition-all select-none outline-none focus:outline-none shrink-0"
              active-class="!bg-white !text-sky-700 !font-semibold shadow-2xs"
            >
              Kanban
            </RouterLink>
            <RouterLink
              v-if="canManage"
              to="/letters"
              class="px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 transition-all select-none outline-none focus:outline-none shrink-0"
              active-class="!bg-white !text-sky-700 !font-semibold shadow-2xs"
            >
              Surat
            </RouterLink>
            <RouterLink
              v-if="canManage"
              to="/programs"
              class="px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 transition-all select-none outline-none focus:outline-none shrink-0"
              active-class="!bg-white !text-sky-700 !font-semibold shadow-2xs"
            >
              Proker
            </RouterLink>
            <RouterLink
              v-if="canManage"
              to="/users"
              class="px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 transition-all select-none outline-none focus:outline-none shrink-0"
              active-class="!bg-white !text-sky-700 !font-semibold shadow-2xs"
            >
              Pengurus
            </RouterLink>
            <RouterLink
              v-if="userRole"
              to="/profile"
              class="px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 transition-all select-none outline-none focus:outline-none shrink-0"
              active-class="!bg-white !text-sky-700 !font-semibold shadow-2xs"
            >
              Profil
            </RouterLink>
          </nav>
        </div>
      </div>
      <!-- Fine Top Accent Line -->
      <div class="h-[1.5px] w-full bg-gradient-to-r from-sky-500 via-sky-400 to-orange-400 opacity-70" />
    </header>

    <!-- Global Toast Container -->
    <Toaster />

    <!-- Main Viewport -->
    <main
      class="flex-1 w-full mx-auto relative z-10"
      :class="isAuthPage ? 'p-0' : 'max-w-7xl p-4 sm:p-6 flex flex-col'"
    >
      <RouterView v-slot="{ Component, route }">
        <Transition name="page-fade" mode="out-in">
          <KeepAlive include="KanbanBoard">
            <component :is="Component" :key="route.path" />
          </KeepAlive>
        </Transition>
      </RouterView>
    </main>
  </div>
</template>
