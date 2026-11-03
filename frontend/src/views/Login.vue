<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService, type LoginResponse } from '@/services/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const router = useRouter()

// State: Login
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

// Handle Login Submission
const handleLogin = async () => {
  if (!username.value.trim() || !password.value) {
    errorMessage.value = 'Harap lengkapi username atau NIM dan kata sandi.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const res: LoginResponse = await authService.login(username.value.trim(), password.value)
    if (res.token) {
      router.push({ name: 'board' })
    }
  } catch (err: any) {
    errorMessage.value =
      err.response?.data?.error || err.message || 'Otentikasi gagal. Periksa kembali data login Anda.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div
    class="min-h-[100dvh] w-full bg-[#F8FAFC] text-slate-900 antialiased relative overflow-hidden flex flex-col justify-between p-4 sm:p-6 md:p-10 lg:p-12 select-none"
  >
    <!-- Background Decor -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        class="absolute inset-0 bg-[linear-gradient(to_right,#0284C7_1px,transparent_1px),linear-gradient(to_bottom,#0284C7_1px,transparent_1px)] bg-[size:64px_64px] opacity-[0.03]"
      />
      <div
        class="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-sky-400/10 to-transparent blur-2xl"
      />
      <div
        class="absolute -bottom-40 -left-40 w-[560px] h-[560px] rounded-full bg-gradient-to-tr from-orange-400/8 to-transparent blur-3xl"
      />
      <div
        class="absolute top-1/4 right-8 lg:right-24 w-72 h-72 rounded-full border border-sky-300/25 pointer-events-none"
      />
      <div
        class="absolute top-1/4 right-8 lg:right-24 w-48 h-48 rounded-full border border-dashed border-sky-400/20 pointer-events-none"
      />

      <!-- Corner Crosshair Ticks -->
      <span class="absolute top-6 left-6 text-slate-300 font-mono text-xs select-none">+</span>
      <span class="absolute top-6 right-6 text-slate-300 font-mono text-xs select-none">+</span>
      <span class="absolute bottom-6 left-6 text-slate-300 font-mono text-xs select-none">+</span>
      <span class="absolute bottom-6 right-6 text-slate-300 font-mono text-xs select-none">+</span>
    </div>

    <!-- Header -->
    <header class="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between py-2">
      <div class="flex items-center gap-3">
        <img
          src="/logo-doscom.png"
          alt="DOSCOM"
          class="h-9 w-9 rounded-full object-contain shrink-0 shadow-xs"
          @error="(e) => ((e.target as HTMLElement).style.display = 'none')"
        />
        <div>
          <span class="text-xs font-bold tracking-widest uppercase text-slate-900 block leading-tight">
            DOSCOM
          </span>
          <span class="text-[10px] font-medium tracking-wider text-slate-400 block uppercase">
            Sistem Laci Digital
          </span>
        </div>
      </div>

      <div class="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200/80 bg-white/80 backdrop-blur-sm text-xs font-semibold text-slate-600">
        <span class="w-2 h-2 rounded-full bg-emerald-500" />
        <span class="tracking-wide">Portal Resmi Ormawa</span>
      </div>
    </header>

    <!-- Center Login Container -->
    <main class="relative z-10 w-full max-w-xl mx-auto my-auto py-8">
      <div
        class="border border-slate-200/90 bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 md:p-12 shadow-[0_12px_40px_-16px_rgba(2,132,199,0.08)] relative"
      >
        <div class="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-sky-500 via-sky-400 to-orange-400 rounded-full" />

        <!-- Feedback Alert -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-2 scale-95"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 -translate-y-2 scale-95"
        >
          <div
            v-if="errorMessage"
            role="alert"
            class="mb-6 flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200/80 text-rose-800 rounded-2xl text-xs sm:text-sm font-medium"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
            <span class="flex-1 leading-snug">{{ errorMessage }}</span>
            <button
              type="button"
              @click="errorMessage = ''"
              aria-label="Tutup pesan"
              class="text-rose-400 hover:text-rose-700 cursor-pointer"
            >
              &times;
            </button>
          </div>
        </Transition>

        <!-- Standard Login View -->
        <div class="space-y-8">
          <div class="space-y-2">
            <Badge variant="info" size="pill" class="font-bold uppercase tracking-wider">
              <span class="w-1.5 h-1.5 rounded-full bg-sky-600" />
              <span>Otentikasi Akun</span>
            </Badge>
            <h1 class="text-2xl sm:text-3xl font-medium tracking-tight text-slate-900 leading-snug">
              Akses Berkas &amp; Persuratan
            </h1>
            <p class="text-sm text-slate-500 font-normal leading-relaxed">
              Silakan masukkan kredensial resmi pengurus DOSCOM untuk membuka repositori.
            </p>
          </div>

          <!-- Login Form -->
          <form @submit.prevent="handleLogin" class="space-y-5" novalidate>
            <!-- Field: Username / NIM -->
            <div class="space-y-2">
              <Label for="username" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Username atau NIM
              </Label>
              <Input
                id="username"
                v-model="username"
                type="text"
                autocomplete="username"
                required
                placeholder="Masukkan username atau NIM anda"
                class="text-sm sm:text-base py-3"
              />
            </div>

            <!-- Field: Password -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label for="password" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Kata Sandi
                </Label>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  @click="showPassword = !showPassword"
                  class="h-auto p-0 text-xs font-bold text-sky-600 hover:text-sky-700"
                >
                  {{ showPassword ? 'Sembunyikan' : 'Perlihatkan' }}
                </Button>
              </div>
              <Input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                placeholder="Masukkan kata sandi"
                class="text-sm sm:text-base py-3 tracking-wider"
              />
              <div class="flex justify-end pt-1">
                <router-link
                  :to="{ name: 'forgot-password' }"
                  class="text-xs font-semibold text-sky-600 hover:text-sky-800 hover:underline"
                >
                  Lupa kata sandi?
                </router-link>
              </div>
            </div>

            <!-- Pill Button CTA -->
            <div class="pt-3">
              <Button
                type="submit"
                size="lg"
                :disabled="isLoading"
                class="w-full text-sm sm:text-base"
              >
                <span v-if="isLoading" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{{ isLoading ? 'Memverifikasi...' : 'Masuk ke Repositori' }}</span>
                <span v-if="!isLoading" class="text-sm tracking-widest">&rarr;</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="relative z-10 w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs font-medium text-slate-400 py-2 border-t border-slate-200/60 gap-2">
      <div>
        <span>&copy; {{ new Date().getFullYear() }} DOSCOM</span>
        <span class="mx-2">&bull;</span>
        <span>Kelompok Studi Linux &amp; Open Source</span>
      </div>
      <div class="flex items-center gap-4 text-[11px] text-slate-400">
        <span>LACI PERSURATAN // PORTAL RESMI</span>
      </div>
    </footer>
  </div>
</template>
