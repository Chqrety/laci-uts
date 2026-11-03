<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '@/services/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const route = useRoute()
const router = useRouter()

const token = ref('')
const isVerifying = ref(true)
const isTokenValid = ref(false)
const verifyError = ref('')

const userInfo = ref<{ email: string; nama: string; username: string }>({
  email: '',
  nama: '',
  username: '',
})

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')
const isSuccess = ref(false)

const isMinLength = computed(() => password.value.length >= 6)
const isPasswordMatched = computed(() => password.value.length > 0 && password.value === confirmPassword.value)
const canSubmit = computed(() => isMinLength.value && isPasswordMatched.value && !isSubmitting.value)

onMounted(async () => {
  const queryToken = route.query.token as string
  if (!queryToken) {
    isVerifying.value = false
    isTokenValid.value = false
    verifyError.value = 'Token aktivasi tidak ditemukan pada tautan ini.'
    return
  }

  token.value = queryToken
  try {
    const res = await authService.verifyToken(queryToken, 'activation')
    isTokenValid.value = true
    userInfo.value = {
      email: res.email,
      nama: res.nama,
      username: res.username,
    }
  } catch (err: any) {
    isTokenValid.value = false
    verifyError.value =
      err.response?.data?.error || 'Tautan aktivasi tidak valid atau telah kedaluwarsa. Silakan hubungi Sekretaris atau Ketua Umum.'
  } finally {
    isVerifying.value = false
  }
})

const handleActivate = async () => {
  if (!canSubmit.value) return

  isSubmitting.value = true
  submitError.value = ''

  try {
    await authService.activateAccount(token.value, password.value)
    isSuccess.value = true
  } catch (err: any) {
    submitError.value = err.response?.data?.error || err.message || 'Gagal mengaktifkan akun. Silakan coba lagi.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-[100dvh] w-full bg-[#F8FAFC] text-slate-900 antialiased relative overflow-hidden flex flex-col justify-between p-4 sm:p-6 md:p-10 lg:p-12 select-none">
    <!-- Background Decor -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#0284C7_1px,transparent_1px),linear-gradient(to_bottom,#0284C7_1px,transparent_1px)] bg-[size:64px_64px] opacity-[0.03]" />
      <div class="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-sky-400/10 to-transparent blur-2xl" />
      <div class="absolute -bottom-40 -left-40 w-[560px] h-[560px] rounded-full bg-gradient-to-tr from-emerald-400/8 to-transparent blur-3xl" />
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
      <router-link to="/login" class="text-xs font-semibold text-slate-500 hover:text-sky-600 transition-colors">
        Ke Halaman Masuk &rarr;
      </router-link>
    </header>

    <!-- Center Card -->
    <main class="relative z-10 w-full max-w-xl mx-auto my-auto py-8">
      <div class="border border-slate-200/90 bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 md:p-12 shadow-[0_12px_40px_-16px_rgba(2,132,199,0.08)] relative">
        <div class="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-sky-500 via-emerald-400 to-sky-400 rounded-full" />

        <!-- 1. LOADING STATE -->
        <div v-if="isVerifying" class="py-12 text-center space-y-4">
          <div class="inline-block w-8 h-8 border-3 border-sky-600/20 border-t-sky-600 rounded-full animate-spin" />
          <p class="text-xs font-semibold text-slate-500">Memverifikasi tautan aktivasi akun...</p>
        </div>

        <!-- 2. ERROR / EXPIRED STATE -->
        <div v-else-if="!isTokenValid" class="space-y-6 text-center py-4">
          <div class="w-14 h-14 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500">
            <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="space-y-2">
            <h2 class="text-xl font-bold text-slate-900">Tautan Tidak Valid</h2>
            <p class="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              {{ verifyError }}
            </p>
          </div>
          <Button as-child size="lg" class="rounded-full">
            <router-link to="/login">Kembali ke Halaman Masuk</router-link>
          </Button>
        </div>

        <!-- 3. SUCCESS ACTIVATION STATE -->
        <div v-else-if="isSuccess" class="space-y-6 text-center py-4">
          <div class="w-14 h-14 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div class="space-y-2">
            <h2 class="text-xl font-bold text-slate-900">Akun Berhasil Diaktifkan!</h2>
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Kata sandi baru kamu telah disimpan secara aman. Silakan masuk menggunakan username <b>{{ userInfo.username }}</b> atau email kamu.
            </p>
          </div>
          <Button as-child size="lg" class="rounded-full w-full">
            <router-link to="/login">Masuk ke Dashboard &rarr;</router-link>
          </Button>
        </div>

        <!-- 4. ACTIVE FORM: SET PASSWORD -->
        <div v-else class="space-y-6">
          <div class="space-y-2">
            <Badge variant="success" size="pill" class="font-bold uppercase tracking-wider">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Aktivasi Akun Mandiri</span>
            </Badge>
            <h1 class="text-2xl sm:text-3xl font-medium tracking-tight text-slate-900 leading-snug">
              Buat Kata Sandi Baru
            </h1>
            <p class="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Halo <b class="text-slate-800">{{ userInfo.nama }}</b> (@{{ userInfo.username }}), silakan tentukan kata sandi rahasia untuk akunmu.
            </p>
          </div>

          <div v-if="submitError" role="alert" class="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs sm:text-sm font-medium">
            {{ submitError }}
          </div>

          <form @submit.prevent="handleActivate" class="space-y-4" novalidate>
            <!-- Password Baru -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <Label for="password" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Kata Sandi Baru
                </Label>
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer"
                >
                  {{ showPassword ? 'Sembunyikan' : 'Perlihatkan' }}
                </button>
              </div>
              <Input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="Minimal 6 karakter"
                class="py-2.5 text-sm"
              />
            </div>

            <!-- Konfirmasi Password -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <Label for="confirmPassword" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Ulangi Kata Sandi
                </Label>
                <button
                  type="button"
                  @click="showConfirm = !showConfirm"
                  class="text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer"
                >
                  {{ showConfirm ? 'Sembunyikan' : 'Perlihatkan' }}
                </button>
              </div>
              <Input
                id="confirmPassword"
                v-model="confirmPassword"
                :type="showConfirm ? 'text' : 'password'"
                required
                placeholder="Masukkan ulang kata sandi"
                class="py-2.5 text-sm"
              />
            </div>

            <!-- Validation Badges -->
            <div class="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1 text-xs">
              <div class="flex items-center gap-2" :class="isMinLength ? 'text-emerald-700' : 'text-slate-400'">
                <span>{{ isMinLength ? '✓' : '•' }}</span>
                <span>Minimal 6 karakter</span>
              </div>
              <div class="flex items-center gap-2" :class="isPasswordMatched ? 'text-emerald-700' : 'text-slate-400'">
                <span>{{ isPasswordMatched ? '✓' : '•' }}</span>
                <span>Kata sandi cocok</span>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              :disabled="!canSubmit"
              class="w-full text-sm sm:text-base mt-2"
            >
              <span v-if="isSubmitting" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{{ isSubmitting ? 'Mengaktifkan...' : 'Simpan & Aktifkan Akun' }}</span>
            </Button>
          </form>
        </div>
      </div>
    </main>

    <footer class="relative z-10 text-center py-2 text-xs text-slate-400">
      &copy; DOSCOM &bull; Dinus Open Source Community
    </footer>
  </div>
</template>
