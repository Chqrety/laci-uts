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
    verifyError.value = 'Token pemulihan kata sandi tidak ditemukan pada tautan ini.'
    return
  }

  token.value = queryToken
  try {
    const res = await authService.verifyToken(queryToken, 'reset')
    isTokenValid.value = true
    userInfo.value = {
      email: res.email,
      nama: res.nama,
      username: res.username,
    }
  } catch (err: any) {
    isTokenValid.value = false
    verifyError.value =
      err.response?.data?.error || 'Tautan pemulihan tidak valid atau telah kedaluwarsa. Silakan ajukan permohonan baru.'
  } finally {
    isVerifying.value = false
  }
})

const handleReset = async () => {
  if (!canSubmit.value) return

  isSubmitting.value = true
  submitError.value = ''

  try {
    await authService.resetPassword(token.value, password.value)
    isSuccess.value = true
  } catch (err: any) {
    submitError.value = err.response?.data?.error || err.message || 'Gagal mengatur ulang kata sandi. Silakan coba lagi.'
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
        <span class="w-2 h-2 rounded-full bg-orange-500" />
        <span>Atur Ulang Sandi</span>
      </div>
    </header>

    <!-- Main Card -->
    <main class="relative z-10 w-full max-w-xl mx-auto my-auto py-8">
      <div class="border border-slate-200/90 bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 md:p-12 shadow-[0_12px_40px_-16px_rgba(2,132,199,0.08)] relative">
        <div class="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-sky-500 via-sky-400 to-orange-400 rounded-full" />

        <!-- Verifying State -->
        <div v-if="isVerifying" class="py-12 text-center space-y-4">
          <div class="inline-block w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p class="text-sm font-medium text-slate-600">Memvalidasi token pemulihan...</p>
        </div>

        <!-- Invalid / Expired Token State -->
        <div v-else-if="!isTokenValid" class="py-6 space-y-6 text-center">
          <div class="w-14 h-14 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="space-y-2">
            <h1 class="text-xl sm:text-2xl font-medium tracking-tight text-slate-900">
              Tautan Tidak Valid
            </h1>
            <p class="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              {{ verifyError }}
            </p>
          </div>
          <div class="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              type="button"
              variant="default"
              size="lg"
              class="text-sm"
              @click="router.push({ name: 'forgot-password' })"
            >
              Minta Tautan Baru
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              class="text-sm"
              @click="router.push({ name: 'login' })"
            >
              Kembali ke Masuk
            </Button>
          </div>
        </div>

        <!-- Success State -->
        <div v-else-if="isSuccess" class="py-6 space-y-6 text-center">
          <div class="w-14 h-14 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div class="space-y-2">
            <h1 class="text-xl sm:text-2xl font-medium tracking-tight text-slate-900">
              Kata Sandi Berhasil Diperbarui
            </h1>
            <p class="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              Kata sandi baru untuk akun <strong class="text-slate-800">{{ userInfo.username }}</strong> telah aktif. Silakan masuk menggunakan sandi baru Anda.
            </p>
          </div>
          <div class="pt-4">
            <Button
              type="button"
              size="lg"
              class="w-full text-sm"
              @click="router.push({ name: 'login' })"
            >
              Lanjut Masuk ke Sistem &rarr;
            </Button>
          </div>
        </div>

        <!-- Form State: Enter New Password -->
        <div v-else class="space-y-8">
          <div class="space-y-2">
            <Badge variant="orange" size="pill" class="font-bold uppercase tracking-wider">
              <span class="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span>Sandi Baru</span>
            </Badge>
            <h1 class="text-2xl sm:text-3xl font-medium tracking-tight text-slate-900 leading-snug">
              Buat Kata Sandi Baru
            </h1>
            <p class="text-sm text-slate-500 font-normal leading-relaxed">
              Hai <strong class="text-slate-800">{{ userInfo.nama }}</strong> ({{ userInfo.username }}), buat kata sandi baru untuk mengamankan akun Anda.
            </p>
          </div>

          <!-- Error Feedback -->
          <div
            v-if="submitError"
            role="alert"
            class="p-3.5 bg-rose-50 border border-rose-200/80 text-rose-800 rounded-2xl text-xs sm:text-sm font-medium flex items-start gap-2"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
            <span class="flex-1 leading-snug">{{ submitError }}</span>
          </div>

          <form @submit.prevent="handleReset" class="space-y-5" novalidate>
            <!-- Field: New Password -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label for="newPass" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Kata Sandi Baru
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
                id="newPass"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                required
                placeholder="Minimal 6 karakter"
                class="text-sm sm:text-base py-3"
              />
            </div>

            <!-- Field: Confirm Password -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label for="confPass" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Konfirmasi Kata Sandi Baru
                </Label>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  @click="showConfirm = !showConfirm"
                  class="h-auto p-0 text-xs font-bold text-sky-600 hover:text-sky-700"
                >
                  {{ showConfirm ? 'Sembunyikan' : 'Perlihatkan' }}
                </Button>
              </div>
              <Input
                id="confPass"
                v-model="confirmPassword"
                :type="showConfirm ? 'text' : 'password'"
                autocomplete="new-password"
                required
                placeholder="Ketik ulang kata sandi baru"
                class="text-sm sm:text-base py-3"
              />
            </div>

            <!-- Validation Badges -->
            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-wrap gap-4 text-xs font-semibold">
              <div class="flex items-center gap-1.5" :class="isMinLength ? 'text-emerald-700' : 'text-slate-400'">
                <span class="w-1.5 h-1.5 rounded-full" :class="isMinLength ? 'bg-emerald-500' : 'bg-slate-300'" />
                <span>Min. 6 Karakter</span>
              </div>
              <div class="flex items-center gap-1.5" :class="isPasswordMatched ? 'text-emerald-700' : 'text-slate-400'">
                <span class="w-1.5 h-1.5 rounded-full" :class="isPasswordMatched ? 'bg-emerald-500' : 'bg-slate-300'" />
                <span>Sandi Cocok</span>
              </div>
            </div>

            <!-- Submit -->
            <div class="pt-3">
              <Button
                type="submit"
                variant="orange"
                size="lg"
                :disabled="!canSubmit"
                class="w-full text-sm sm:text-base"
              >
                <span v-if="isSubmitting" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{{ isSubmitting ? 'Menyimpan...' : 'Perbarui Kata Sandi' }}</span>
                <span v-if="!isSubmitting" class="text-sm tracking-widest">&rarr;</span>
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
