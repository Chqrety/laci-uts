<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authService, type User } from '@/services/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'

const profile = ref<User | null>(null)
const isLoading = ref(false)
const newUsername = ref('')
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isSubmitting = ref(false)
const isSubmittingUsername = ref(false)
const msg = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const fetchProfile = async () => {
  isLoading.value = true
  try {
    profile.value = await authService.getProfile()
    newUsername.value = profile.value?.username || ''
  } catch (err: any) {
    msg.value = { type: 'error', text: err.response?.data?.error || 'Gagal memuat profil' }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchProfile()
})

const onSubmitUsername = async () => {
  const usernameVal = newUsername.value.trim()
  if (!usernameVal) {
    toast({ title: 'Gagal', description: 'Username wajib diisi', variant: 'destructive' })
    return
  }
  if (usernameVal.length < 3) {
    toast({ title: 'Gagal', description: 'Username minimal 3 karakter', variant: 'destructive' })
    return
  }
  if (/\s/.test(usernameVal)) {
    toast({ title: 'Gagal', description: 'Username tidak boleh mengandung spasi', variant: 'destructive' })
    return
  }

  msg.value = null
  isSubmittingUsername.value = true
  try {
    const res = await authService.changeUsername(usernameVal)
    const text = res.message || 'Username berhasil diperbarui!'
    msg.value = { type: 'success', text }
    toast({
      title: 'Berhasil',
      description: text,
      variant: 'success',
    })
    if (profile.value) {
      profile.value.username = res.username
      newUsername.value = res.username
    }
  } catch (err: any) {
    const text = err.response?.data?.error || 'Gagal mengubah username'
    msg.value = { type: 'error', text }
    toast({
      title: 'Gagal',
      description: text,
      variant: 'destructive',
    })
  } finally {
    isSubmittingUsername.value = false
  }
}

const handleChangePassword = async () => {
  msg.value = null
  if (!newPassword.value || newPassword.value.length < 6) {
    const text = 'Password baru minimal 6 karakter'
    msg.value = { type: 'error', text }
    toast({
      title: 'Validasi Gagal',
      description: text,
      variant: 'destructive',
    })
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    const text = 'Konfirmasi password tidak cocok'
    msg.value = { type: 'error', text }
    toast({
      title: 'Validasi Gagal',
      description: text,
      variant: 'destructive',
    })
    return
  }

  isSubmitting.value = true
  try {
    const res = await authService.changePassword(newPassword.value, oldPassword.value)
    const text = res.message || 'Password berhasil diperbarui!'
    msg.value = { type: 'success', text }
    toast({
      title: 'Berhasil',
      description: text,
      variant: 'success',
    })
    oldPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    await fetchProfile()
  } catch (err: any) {
    const text = err.response?.data?.error || 'Gagal mengubah password'
    msg.value = { type: 'error', text }
    toast({
      title: 'Gagal',
      description: text,
      variant: 'destructive',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto w-full flex flex-col gap-6 py-4">
    <div>
      <h2 class="text-xl font-medium tracking-tight text-slate-900 leading-snug">Profil Saya</h2>
      <p class="text-xs text-zinc-500 mt-0.5">Informasi akun dan pengaturan keamanan password</p>
    </div>

    <!-- Alert message -->
    <div
      v-if="msg"
      class="p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between border"
      :class="
        msg.type === 'success'
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-rose-50 text-rose-700 border-rose-200'
      "
    >
      <span>{{ msg.text }}</span>
      <button @click="msg = null" class="opacity-60 hover:opacity-100">✕</button>
    </div>

    <!-- Info User Card -->
    <div class="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col gap-4">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-lg border border-sky-100">
          {{ profile?.nama ? profile.nama.charAt(0).toUpperCase() : 'U' }}
        </div>
        <div>
          <h3 class="text-base font-semibold text-zinc-900">{{ profile?.nama || profile?.username }}</h3>
          <p class="text-xs text-zinc-400">@{{ profile?.username }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-black/5 text-xs">
        <div>
          <span class="text-zinc-400 block text-[11px]">NIM</span>
          <span class="font-mono font-medium text-zinc-800">{{ profile?.nim || '-' }}</span>
        </div>
        <div>
          <span class="text-zinc-400 block text-[11px]">Divisi</span>
          <span class="font-mono uppercase font-semibold text-[#0A84DC]">{{ profile?.divisi }}</span>
        </div>
        <div>
          <span class="text-zinc-400 block text-[11px]">Email</span>
          <span class="text-zinc-800">{{ profile?.email || '-' }}</span>
        </div>
        <div>
          <span class="text-zinc-400 block text-[11px]">Status Akun</span>
          <Badge variant="success" size="xs" class="mt-0.5">
            Aktif Terverifikasi
          </Badge>
        </div>
      </div>
    </div>

    <!-- Form Ganti Username (Native Vue v-model + HTML5) -->
    <div class="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col gap-4">
      <div>
        <h3 class="text-sm font-semibold text-zinc-900">Ubah Username</h3>
        <p class="text-xs text-zinc-400 mt-0.5">Ubah username kamu agar lebih mudah diingat saat login</p>
      </div>

      <form @submit.prevent="onSubmitUsername" class="flex flex-col gap-3.5">
        <div class="space-y-1.5">
          <Label for="profile-username">Username Baru</Label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-medium z-10 pointer-events-none">@</span>
            <Input
              id="profile-username"
              v-model="newUsername"
              type="text"
              placeholder="username_kamu"
              class="pl-8"
              required
              minlength="3"
            />
          </div>
          <p class="text-xs text-zinc-400 leading-relaxed">
            Default akun menggunakan format persis NIM (misal: {{ profile?.nim || 'A11.2022.14000' }}). Anda dapat menggantinya menjadi username personal tanpa spasi.
          </p>
        </div>

        <div class="flex justify-end pt-1">
          <Button
            type="submit"
            :disabled="isSubmittingUsername || !newUsername || newUsername.trim() === profile?.username"
          >
            {{ isSubmittingUsername ? 'Menyimpan...' : 'Simpan Username Baru' }}
          </Button>
        </div>
      </form>
    </div>

    <!-- Form Ganti Password -->
    <div class="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col gap-4">
      <div>
        <h3 class="text-sm font-semibold text-zinc-900">Ubah Password</h3>
        <p class="text-xs text-zinc-400 mt-0.5">Ganti password akun kamu kapan saja demi keamanan</p>
      </div>

      <form @submit.prevent="handleChangePassword" novalidate class="flex flex-col gap-3.5">
        <div class="space-y-1.5">
          <Label for="old-password">Password Saat Ini</Label>
          <Input
            id="old-password"
            v-model="oldPassword"
            type="password"
            placeholder="Masukkan password saat ini"
          />
        </div>

        <div class="space-y-1.5">
          <Label for="new-password">Password Baru</Label>
          <Input
            id="new-password"
            v-model="newPassword"
            type="password"
            required
            placeholder="Minimal 6 karakter"
          />
        </div>

        <div class="space-y-1.5">
          <Label for="confirm-password">Konfirmasi Password Baru</Label>
          <Input
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            required
            placeholder="Ketik ulang password baru"
          />
        </div>

        <div class="flex justify-end pt-2">
          <Button
            type="submit"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Menyimpan...' : 'Simpan Password Baru' }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
