<script setup lang="ts">
import { ref } from 'vue'
import { userService } from '@/services/api'
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
import { toast } from '@/components/ui/toast'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'imported'): void
}>()

const importMethod = ref<'csv' | 'sheet'>('csv')
const sheetUrl = ref('')
const importFile = ref<File | null>(null)
const isSubmitting = ref(false)

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    importFile.value = target.files[0]
  } else {
    importFile.value = null
  }
}

const handleImportData = async () => {
  if (importMethod.value === 'csv') {
    if (!importFile.value) {
      toast({ title: 'Pilih file CSV terlebih dahulu', variant: 'destructive' })
      return
    }

    isSubmitting.value = true
    try {
      const res = await userService.importCSV(importFile.value)
      toast({ title: res.message, variant: 'success' })
      if (res.skipped && res.skipped.length > 0) {
        toast({
          title: 'Catatan Duplikasi Import',
          description: `${res.skipped.length} baris dilewati karena duplikat: ${res.skipped.join(', ')}`,
        })
      }
      importFile.value = null
      emit('imported')
      emit('update:open', false)
    } catch (err: any) {
      toast({
        title: 'Gagal mengimpor file CSV',
        description: err.response?.data?.error || err.message,
        variant: 'destructive',
      })
    } finally {
      isSubmitting.value = false
    }
  } else {
    if (!sheetUrl.value.trim()) {
      toast({ title: 'Masukkan link Google Sheets terlebih dahulu', variant: 'destructive' })
      return
    }

    isSubmitting.value = true
    try {
      const res = await userService.importSpreadsheet(sheetUrl.value.trim())
      toast({ title: res.message, variant: 'success' })
      if (res.skipped && res.skipped.length > 0) {
        toast({
          title: 'Catatan Duplikasi Import',
          description: `${res.skipped.length} baris dilewati karena duplikat: ${res.skipped.join(', ')}`,
        })
      }
      sheetUrl.value = ''
      emit('imported')
      emit('update:open', false)
    } catch (err: any) {
      toast({
        title: 'Gagal menarik data dari Google Sheets',
        description: err.response?.data?.error || err.message,
        variant: 'destructive',
      })
    } finally {
      isSubmitting.value = false
    }
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(val: boolean) => emit('update:open', val)">
    <DialogContent
      @pointer-down-outside="(e: Event) => e.preventDefault()"
      @interact-outside="(e: Event) => e.preventDefault()"
    >
      <DialogHeader>
        <DialogTitle>Import Data Pengurus</DialogTitle>
        <DialogDescription>Import massal pengurus melalui berkas CSV atau Google Sheets.</DialogDescription>
      </DialogHeader>

      <div class="p-1 bg-zinc-100 rounded-2xl flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          :variant="importMethod === 'csv' ? 'default' : 'ghost'"
          class="flex-1"
          @click="importMethod = 'csv'"
        >
          Upload File CSV
        </Button>
        <Button
          type="button"
          size="sm"
          :variant="importMethod === 'sheet' ? 'default' : 'ghost'"
          class="flex-1"
          @click="importMethod = 'sheet'"
        >
          Link Google Sheets
        </Button>
      </div>

      <div class="text-xs text-zinc-500 leading-relaxed bg-zinc-50 p-3 rounded-2xl border border-zinc-200">
        <p class="font-medium text-zinc-800 mb-1">Format urutan kolom yang didukung:</p>
        <code class="block font-mono text-[11px] text-zinc-700 bg-white p-2 rounded-xl border border-zinc-200">
          nim,nama,email,divisi
        </code>
        <p class="mt-1 text-[11px] text-zinc-500">
          Seluruh akun hasil import akan menerima tautan aktivasi mandiri ke email masing-masing.
        </p>
      </div>

      <div v-if="importMethod === 'csv'" class="flex flex-col gap-2">
        <Label>Pilih File CSV</Label>
        <input
          type="file"
          accept=".csv"
          @change="onFileChange"
          class="text-xs file:mr-3 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-xs file:font-semibold file:bg-[#0A84DC]/10 file:text-[#0A84DC] hover:file:bg-[#0A84DC]/20 cursor-pointer"
        />
      </div>

      <div v-else class="flex flex-col gap-2">
        <Label for="sheet-url">URL / Link Google Sheets</Label>
        <Input
          id="sheet-url"
          v-model="sheetUrl"
          type="url"
          placeholder="https://docs.google.com/spreadsheets/d/.../edit"
        />
        <span class="text-[11px] text-zinc-400">
          *Pastikan akses link sheet diset ke: <b>"Siapa saja yang memiliki link dapat melihat"</b>.
        </span>
      </div>

      <DialogFooter class="pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          @click="emit('update:open', false)"
        >
          Batal
        </Button>
        <Button
          type="button"
          size="sm"
          @click="handleImportData"
          :disabled="isSubmitting || (importMethod === 'csv' ? !importFile : !sheetUrl.trim())"
        >
          {{ isSubmitting ? 'Memproses...' : (importMethod === 'csv' ? 'Mulai Import CSV' : 'Tarik Data Spreadsheet') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
