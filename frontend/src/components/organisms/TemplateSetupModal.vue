<script setup lang="ts">
import { ref, watch } from 'vue'
import { templateService, type SuratTemplate } from '@/services/api'
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
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'synced', templates: SuratTemplate[]): void
}>()

const folderUrl = ref('')
const gasUrl = ref('')
const defaultOutputFolderUrl = ref('')
const isSyncing = ref(false)
const isLoadingSettings = ref(false)
const syncedTemplates = ref<SuratTemplate[]>([])

const loadSettings = async () => {
  isLoadingSettings.value = true
  try {
    const settings = await templateService.getSettings()
    if (settings.master_template_folder_url) {
      folderUrl.value = settings.master_template_folder_url
    }
    if (settings.gas_webhook_url) {
      gasUrl.value = settings.gas_webhook_url
    }
    if (settings.default_output_folder_url) {
      defaultOutputFolderUrl.value = settings.default_output_folder_url
    }
    const currentTemplates = await templateService.getAll()
    syncedTemplates.value = currentTemplates
  } catch (err) {
    console.error('Gagal memuat pengaturan:', err)
  } finally {
    isLoadingSettings.value = false
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      loadSettings()
    }
  },
  { immediate: true }
)

const handleSync = async () => {
  if (!folderUrl.value.trim()) {
    toast({
      title: 'Validasi Gagal',
      description: 'Link Folder Google Drive Master Template wajib diisi.',
      variant: 'destructive',
    })
    return
  }

  isSyncing.value = true
  try {
    // Simpan default output folder jika diisi
    if (defaultOutputFolderUrl.value.trim()) {
      await templateService.updateSettings({
        default_output_folder_url: defaultOutputFolderUrl.value.trim(),
      })
    }

    const res = await templateService.sync(folderUrl.value.trim(), gasUrl.value.trim())
    syncedTemplates.value = res.templates
    emit('synced', res.templates)

    toast({
      title: 'Sinkronisasi Berhasil',
      description: `Berhasil mendata ${res.count} template surat dari Google Drive.`,
      variant: 'success',
    })
  } catch (err: any) {
    toast({
      title: 'Sinkronisasi Gagal',
      description: err.response?.data?.error || err.message || 'Gagal memindai folder Google Drive',
      variant: 'destructive',
    })
  } finally {
    isSyncing.value = false
  }
}

const parsePlaceholders = (placeholdersJson: string): string[] => {
  try {
    const parsed = JSON.parse(placeholdersJson)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
</script>

<template>
  <Dialog :open="isOpen" @update:open="emit('close')">
    <DialogContent size="2xl" class="max-h-[90vh] overflow-y-auto no-scrollbar">
      <DialogHeader class="space-y-1.5 pb-2 border-b border-black/5">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 shrink-0">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <DialogTitle class="text-base font-semibold text-slate-900 tracking-tight">
              Setup Master Template GDrive
            </DialogTitle>
            <DialogDescription class="text-xs text-slate-500">
              Cukup masukkan link folder Google Drive sekali untuk digunakan sepanjang 1 periode kepengurusan.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div class="space-y-4 py-3">
        <!-- Input URL Webhook GAS -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <Label for="gas-url" class="text-xs font-semibold text-slate-800">
              URL Webhook Google Apps Script (GAS)
            </Label>
            <span class="text-[10px] text-slate-400 font-mono">Gratis / Zero-cost</span>
          </div>
          <Input
            id="gas-url"
            v-model="gasUrl"
            type="url"
            placeholder="https://script.google.com/macros/s/.../exec"
            size="lg"
          />
          <p class="text-[11px] text-slate-500 leading-relaxed">
            Didapatkan dari deployment Web App Google Apps Script. Kode script tersedia di berkas
            <code class="px-1.5 py-0.5 rounded-md bg-slate-100 text-sky-700 font-mono text-[10px]">gas/Code.js</code>.
          </p>
        </div>

        <!-- Input Link Folder Master GDrive -->
        <div class="space-y-1.5">
          <Label for="folder-url" class="text-xs font-semibold text-slate-800">
            Link Folder Master Template (Google Drive) <span class="text-rose-500">*</span>
          </Label>
          <Input
            id="folder-url"
            v-model="folderUrl"
            type="url"
            placeholder="https://drive.google.com/drive/folders/1AbCdEf..."
            size="lg"
          />
          <p class="text-[11px] text-slate-500 leading-relaxed">
            Folder di Google Drive yang berisi 16 file Google Docs template surat. Pastikan folder dapat diakses atau di-share ke akun pemilik script.
          </p>
        </div>

        <!-- Input Folder Default Output -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <Label for="output-url" class="text-xs font-semibold text-slate-800">
              Link Folder Default Penyimpanan Surat Keluar (Opsional)
            </Label>
            <span class="text-[10px] text-slate-400">Tujuan hasil export</span>
          </div>
          <Input
            id="output-url"
            v-model="defaultOutputFolderUrl"
            type="url"
            placeholder="https://drive.google.com/drive/folders/..."
            size="lg"
          />
          <p class="text-[11px] text-slate-500 leading-relaxed">
            Folder di Google Drive tempat surat yang digenerate akan disimpan secara default jika sekre tidak memilih folder lain.
          </p>
        </div>

        <!-- Tombol Aksi Sync -->
        <div class="pt-1 flex items-center justify-between gap-3">
          <div class="text-xs text-slate-500">
            Status: <span class="font-semibold text-slate-800">{{ syncedTemplates.length }} template aktif</span>
          </div>
          <Button
            type="button"
            :disabled="isSyncing || !folderUrl"
            @click="handleSync"
            class="px-5 py-2 rounded-full text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.98] shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <svg
              v-if="isSyncing"
              class="w-3.5 h-3.5 mr-1.5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{{ isSyncing ? 'Memindai Google Drive...' : 'Sinkronkan Template Sekarang' }}</span>
          </Button>
        </div>

        <!-- Daftar Template Terdeteksi -->
        <div v-if="syncedTemplates.length > 0" class="pt-2 space-y-2">
          <h4 class="text-xs font-semibold text-slate-700">Daftar Template Tersedia:</h4>
          <div class="max-h-52 overflow-y-auto no-scrollbar rounded-2xl border border-slate-200/90 divide-y divide-black/5 bg-slate-50/50">
            <div
              v-for="(tpl, idx) in syncedTemplates"
              :key="tpl.id"
              class="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white transition-colors"
            >
              <div class="min-w-0 flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-mono shrink-0 font-bold">
                  {{ idx + 1 }}
                </span>
                <span class="font-medium text-slate-900 truncate">{{ tpl.nama_template }}</span>
              </div>
              <div class="flex items-center gap-1.5 flex-wrap shrink-0">
                <Badge
                  v-for="ph in parsePlaceholders(tpl.placeholders).slice(0, 3)"
                  :key="ph"
                  variant="outline"
                  size="pill"
                  class="font-mono text-[10px]"
                >
                  {&#123;{{ ph }}&#125;}
                </Badge>
                <span
                  v-if="parsePlaceholders(tpl.placeholders).length > 3"
                  class="text-[10px] text-slate-400 font-mono"
                >
                  +{{ parsePlaceholders(tpl.placeholders).length - 3 }} variabel
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="border-t border-black/5 pt-3 flex items-center justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          @click="emit('close')"
          class="rounded-full px-4 text-xs font-semibold"
        >
          Tutup
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
