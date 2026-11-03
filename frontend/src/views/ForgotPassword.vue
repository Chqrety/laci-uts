<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const router = useRouter()
const email = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const isSubmitted = ref(false)

const handleSubmit = async () => {
  if (!email.value.trim()) {
    errorMessage.value = 'Harap masukkan alamat email akun Anda.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await authService.forgotPassword(email.value.trim())
    isSubmitted.value = true
  } catch (err: any) {
    errorMessage.value =
      err.response?.data?.error || err.message || 'Terjadi kesalahan saat memproses permintaan. Silakan coba lagi.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-[100dvh] w-full bg-[#F8FAFC] text-slate-900 antialiased relative overflow-hidden flex flex-col justify-between p-4 sm:p-6 md:p-10 lg:p-12 select-none">
    <!-- Background Decor -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#0284C7_1px,transparent_1px),linear-gradient(to_bottom,#0284C7_1px,transparent_1px)] bg-[size:64px_64px] opacity-[0.03]" />
      <div class="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-sky-400/10 to-transparent blur-2xl" />
      <div class="absolute -bottom-40 -left-40 w-[560px] h-[560px] rounded-full bg-gradient-to-tr from-orange-400/8 to-transparent blur-3xl" />
    </div>

    <!-- Header -->
    <header class="relative z-10 w-full max-w-xl mx-auto flex items-center justify-between py-2">
      <div class="flex items-center gap-3">
        <img
          src="/logo-doscom.png"
          alt="DOSCOM"
          class="h-9 w-9 rounded-full object-contain shrink-0 shadow-xs"
          @error="(e) => ((e.target as HTMLElement).style.display = 'none')"
        />
        <div>
          <span class="text-xs font-bold tracking-widest uppercase text-slate-900 block leading-tight">DOSCOM</span>
          <span class="text-[10px] font-medium tracking-wider text-slate-400 block uppercase">Sistem Laci Digital</span>
        </div>
      </div>
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200/80 bg-white/80 text-xs font-semibold text-slate-600">
        <span class="w-2 h-2 rounded-full bg-sky-500" />
        <span>Pemulihan Akun</span>
      </div>
    </header>

    <!-- Main Card -->
    <main class="relative z-10 w-full max-w-xl mx-auto my-auto py-8">
      <div class="border border-slate-200/90 bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 md:p-12 shadow-[0_12px_40px_-16px_rgba(2,132,199,0.08)] relative">
        <div class="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-sky-500 via-sky-400 to-orange-400 rounded-full" />

        <!-- Error Alert -->
        <div
          v-if="errorMessage"
          role="alert"
          class="mb-6 flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200/80 text-rose-800 rounded-2xl text-xs sm:text-sm font-medium"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
          <span class="flex-1 leading-snug">{{ errorMessage }}</span>
        </div>

        <!-- Success Anti-Enumeration State -->
        <div v-if="isSubmitted" class="space-y-6 text-center py-4">
          <div class="w-14 h-14 mx-auto rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="space-y-2">
            <h1 class="text-xl sm:text-2xl font-medium tracking-tight text-slate-900">
              Instruksi Terkirim
            </h1>
            <p class="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              Jika alamat <strong class="text-slate-800">{{ email }}</strong> terdaftar dalam sistem, tautan pemulihan kata sandi telah dikirimkan. Tautan berlaku selama 1 jam.
            </p>
          </div>
          <div class="pt-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              class="w-full text-sm"
              @click="router.push({ name: 'login' })"
            >
              Kembali ke Halaman Masuk
            </Button>
          </div>
        </div>

        <!-- Request Form -->
        <div v-else class="space-y-8">
          <div class="space-y-2">
            <Badge variant="info" size="pill" class="font-bold uppercase tracking-wider">
              <span class="w-1.5 h-1.5 rounded-full bg-sky-600" />
              <span>Lupa Kata Sandi</span>
            </Badge>
            <h1 class="text-2xl sm:text-3xl font-medium tracking-tight text-slate-900 leading-snug">
              Atur Ulang Sandi Akun
            </h1>
            <p class="text-sm text-slate-500 font-normal leading-relaxed">
              Masukkan alamat email resmi pengurus Anda. Kami akan mengirimkan tautan verifikasi aman untuk membuat kata sandi baru.
            </p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-5" novalidate>
            <div class="space-y-2">
              <Label for="email" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Alamat Email Pengurus
              </Label>
              <Input
                id="email"
                v-model="email"
                type="email"
                autocomplete="email"
                required
                placeholder="email@anda.com atau username terdaftar"
                class="text-sm sm:text-base py-3"
              />
            </div>

            <div class="space-y-3 pt-3">
              <Button
                type="submit"
                size="lg"
                :disabled="isLoading || !email.trim()"
                class="w-full text-sm sm:text-base"
              >
                <span v-if="isLoading" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{{ isLoading ? 'Mengirim Instruksi...' : 'Kirim Tautan Pemulihan' }}</span>
                <span v-if="!isLoading" class="text-sm tracking-widest">&rarr;</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                @click="router.push({ name: 'login' })"
                class="w-full text-xs font-bold text-slate-500 hover:text-slate-800 tracking-wider uppercase"
              >
                Batal &amp; Kembali ke Masuk
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="relative z-10 w-full max-w-xl mx-auto flex items-center justify-between text-xs font-medium text-slate-400 py-2 border-t border-slate-200/60">
      <span>&copy; {{ new Date().getFullYear() }} DOSCOM</span>
      <span>LACI PERSURATAN // PORTAL RESMI</span>
    </footer>
  </div>
</template>
