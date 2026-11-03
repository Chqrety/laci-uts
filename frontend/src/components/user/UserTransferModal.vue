<script setup lang="ts">
import { ref } from 'vue'
import { userService, type User } from '@/services/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/toast'

defineProps<{
  open: boolean
  eligibleSuccessors: User[]
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'transferred'): void
}>()

const transferTargetUserId = ref('')
const transferKetumPassword = ref('')
const isTransferring = ref(false)

const handleTransferKetum = async () => {
  if (!transferTargetUserId.value) {
    toast({ title: 'Pilih calon Ketua Umum pengganti', variant: 'destructive' })
    return
  }
  if (!transferKetumPassword.value) {
    toast({ title: 'Masukkan kata sandi Ketua Umum untuk verifikasi', variant: 'destructive' })
    return
  }

  isTransferring.value = true
  try {
    const res = await userService.transferKetum(transferTargetUserId.value, transferKetumPassword.value)
    toast({
      title: res.message || 'Serah terima jabatan berhasil dilaksanakan',
      variant: 'success',
    })
    emit('update:open', false)
    transferTargetUserId.value = ''
    transferKetumPassword.value = ''
    emit('transferred')
    setTimeout(() => {
      window.location.reload()
    }, 1200)
  } catch (err: any) {
    toast({
      title: 'Gagal memproses serah terima jabatan',
      description: err.response?.data?.error || err.message,
      variant: 'destructive',
    })
  } finally {
    isTransferring.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(val: boolean) => emit('update:open', val)">
    <DialogContent>
      <DialogHeader>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <DialogTitle>Serah Terima Jabatan Ketua Umum</DialogTitle>
            <DialogDescription>Alihkan kepemimpinan DOSCOM kepada Ketua Umum terpilih.</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <form @submit.prevent="handleTransferKetum" novalidate class="flex flex-col gap-3.5 pt-2">
        <div class="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs text-amber-900 leading-relaxed">
          <p class="font-semibold mb-1">Perhatian Penting:</p>
          Akun Anda akan dialihkan menjadi divisi <b>ex-ketum</b>, dan pengurus yang dipilih akan diangkat menjadi <b>Ketua Umum</b> baru.
        </div>

        <div class="space-y-1">
          <Label for="transfer-target">Pilih Calon Ketua Umum Baru *</Label>
          <Select v-model="transferTargetUserId">
            <SelectTrigger id="transfer-target">
              <SelectValue placeholder="Pilih pengurus penerus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="cand in eligibleSuccessors"
                :key="cand.id"
                :value="cand.id"
              >
                {{ cand.nama || cand.username }} ({{ cand.divisi.toUpperCase() }})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-1">
          <Label for="transfer-password">Konfirmasi Kata Sandi Ketua Umum Saat Ini *</Label>
          <Input
            id="transfer-password"
            v-model="transferKetumPassword"
            type="password"
            required
            placeholder="Masukkan kata sandi Anda untuk otentikasi"
          />
        </div>

        <DialogFooter class="pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            @click="emit('update:open', false)"
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="orange"
            size="sm"
            :disabled="isTransferring || !transferTargetUserId || !transferKetumPassword"
          >
            {{ isTransferring ? 'Memproses Suksesi...' : 'Konfirmasi Serah Terima' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
