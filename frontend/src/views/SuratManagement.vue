<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

import {
  suratService,
  getBackendAssetUrl,
  STATUS_COLUMNS,
  type Surat,
} from '@/services/api'
import CardDetail from '@/components/molecules/CardDetail.vue'
import SuratGeneratorModal, { clearGeneratorCache } from '@/components/organisms/SuratGeneratorModal.vue'
import TemplateSetupModal from '@/components/organisms/TemplateSetupModal.vue'
import { ConfirmDialog } from '@/components/common'
import { usePagination } from '@/composables/usePagination'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/toast'


const suratList = ref<Surat[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const deletingId = ref<string | null>(null)

// Modals Generator & Setup Template
const isGeneratorModalOpen = ref(false)
const isSetupModalOpen = ref(false)
const generatorKey = ref(0)

// Delete confirm dialog
const isDeleteModalOpen = ref(false)
const suratToDelete = ref<Surat | null>(null)
const isDeleting = ref(false)

// Detail modal
const selectedSurat = ref<Surat | null>(null)
const isDetailOpen = ref(false)

// Search & Filter state
const searchQuery = ref('')
const statusFilter = ref('')

const fetchSurat = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    suratList.value = await suratService.getAll()
    if (selectedSurat.value) {
      selectedSurat.value = suratList.value.find((s) => s.id === selectedSurat.value?.id) || null
    }
  } catch (err: any) {
    errorMessage.value = err.response?.data?.error || err.message || 'Gagal memuat data surat'
  } finally {
    isLoading.value = false
  }
}

const filteredSurat = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const sf = statusFilter.value.trim().toLowerCase()

  return suratList.value.filter((s) => {
    const matchSearch =
      !q ||
      s.nomor_surat.toLowerCase().includes(q) ||
      s.perihal.toLowerCase().includes(q) ||
      (s.tujuan && s.tujuan.toLowerCase().includes(q))
    const matchStatus = !sf || sf === 'all' || s.status_saat_ini.toLowerCase() === sf
    return matchSearch && matchStatus
  })
})

// Unified Pagination Composable
const {
  currentPage,
  itemsPerPage,
  totalPages,
  paginatedItems: paginatedSurat,
  nextPage,
  prevPage,
  resetPage,
} = usePagination(filteredSurat, 20)

watch([searchQuery, statusFilter], () => {
  resetPage()
})

const openDetail = (surat: Surat) => {
  selectedSurat.value = surat
  isDetailOpen.value = true
}

const closeDetail = () => {
  isDetailOpen.value = false
  selectedSurat.value = null
}

const getStatusBadgeVariant = (status: string) => {
  const s = status.toLowerCase()
  if (s.includes('selesai') || s.includes('arsip')) return 'success'
  if (s.includes('cetak') || s.includes('proses')) return 'secondary'
  if (s.includes('ttd') || s.includes('paraf')) return 'outline'
  return 'secondary'
}

const confirmDeleteSurat = (surat: Surat) => {
  suratToDelete.value = surat
  isDeleteModalOpen.value = true
}

const executeDeleteSurat = async () => {
  if (!suratToDelete.value) return

  const surat = suratToDelete.value
  deletingId.value = surat.id
  isDeleting.value = true
  try {
    await suratService.delete(surat.id)
    if (selectedSurat.value?.id === surat.id) closeDetail()
    toast({
      title: 'Berhasil',
      description: `Surat "${surat.nomor_surat}" berhasil dihapus`,
      variant: 'success',
    })
    isDeleteModalOpen.value = false
    suratToDelete.value = null
    await fetchSurat()
  } catch (err: any) {
    toast({
      title: 'Gagal Menghapus Surat',
      description: err.response?.data?.error || err.message || 'Gagal menghapus surat',
      variant: 'destructive',
    })
  } finally {
    deletingId.value = null
    isDeleting.value = false
  }
}

onMounted(fetchSurat)
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6 w-full">
    <!-- Top Bar: Header & Action CTAs -->
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 px-1">
      <div>
        <div class="flex items-center gap-2.5">
          <h2 class="text-xl font-medium tracking-tight text-slate-900 leading-snug">Surat</h2>
          <Badge variant="muted" size="pill">
            {{ filteredSurat.length }} {{ filteredSurat.length === suratList.length ? 'surat' : `dari ${suratList.length}` }}
          </Badge>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">Kelola data arsip dan lacak seluruh status surat keluar DOSCOM.</p>
      </div>

      <!-- Button Group: Setup Template & Buat Surat -->
      <div class="flex items-center gap-2.5 shrink-0">

        <Button
          type="button"
          variant="outline"
          size="sm"
          @click="isSetupModalOpen = true"
          class="rounded-full px-3.5 py-2 text-xs font-semibold bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50 active:scale-[0.98] shadow-2xs transition-all cursor-pointer"
        >
          <svg class="w-3.5 h-3.5 mr-1.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Setup Template</span>
        </Button>

        <Button
          type="button"
          size="sm"
          @click="isGeneratorModalOpen = true"
          class="rounded-full px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.98] shadow-xs transition-all cursor-pointer"
        >
          <svg class="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Buat Surat</span>
        </Button>
      </div>
    </header>

    <!-- Filter Bar: Search, Status Filter & Reload -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
      <!-- Input Pencarian -->
      <div class="relative w-full sm:w-72 lg:w-80">
        <svg
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 105.65 5.65a7.5 7.5 0 0010.7 10.7z" />
        </svg>
        <Input
          v-model="searchQuery"
          type="search"
          placeholder="Cari nomor, perihal, atau tujuan..."
          class="pl-9 pr-8 h-9 rounded-2xl border-slate-200/90 bg-white text-xs shadow-2xs focus-visible:ring-sky-500/20"
        />
        <button
          v-if="searchQuery"
          type="button"
          @click="searchQuery = ''"
          title="Hapus pencarian"
          aria-label="Hapus pencarian"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-sm"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Kelompok Filter Status & Reload -->
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <Select v-model="statusFilter">
          <SelectTrigger variant="white" class="w-full sm:w-44 lg:w-48">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem v-for="status in STATUS_COLUMNS" :key="status" :value="status">
              {{ status }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="icon"
          @click="fetchSurat"
          :disabled="isLoading"
          title="Muat Ulang"
          aria-label="Muat Ulang"
          class="h-9 w-9 shrink-0 rounded-2xl border-slate-200/90 bg-white shadow-2xs text-slate-600 hover:text-slate-900 active:scale-95 transition-all"
        >
          <svg class="w-4 h-4" :class="{ 'animate-spin': isLoading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </Button>
      </div>
    </div>

    <!-- Error Notice -->
    <div
      v-if="errorMessage"
      role="alert"
      class="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl font-medium"
    >
      {{ errorMessage }}
    </div>

    <!-- Table Container: Floema Architectural rounded-3xl surface -->
    <div class="bg-white/95 border border-slate-200/90 rounded-3xl shadow-xs overflow-hidden">
      <div class="overflow-x-auto no-scrollbar">
        <table class="w-full text-left text-xs divide-y divide-black/5 min-w-[760px]">
          <thead class="bg-black/[0.02] text-zinc-500 font-semibold">
            <tr>
              <th scope="col" class="px-5 py-4 w-14 text-center">No</th>
              <th scope="col" class="px-5 py-4 w-52 font-mono">Nomor Surat</th>
              <th scope="col" class="px-5 py-4">Perihal</th>
              <th scope="col" class="px-5 py-4 w-40">PIC</th>
              <th scope="col" class="px-5 py-4 w-36">Status</th>
              <th scope="col" class="px-5 py-4 w-36 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-black/5 text-zinc-800">
            <!-- Loading Row -->
            <tr v-if="isLoading && suratList.length === 0">
              <td colspan="6" class="px-5 py-12 text-center text-zinc-400">
                <div class="flex flex-col items-center justify-center space-y-2">
                  <div class="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                  <p class="text-xs text-zinc-500">Memuat data surat...</p>
                </div>
              </td>
            </tr>

            <!-- Empty Row -->
            <tr v-else-if="filteredSurat.length === 0">
              <td colspan="6" class="px-5 py-12 text-center text-zinc-400">
                <div class="flex flex-col items-center justify-center space-y-1">
                  <p class="text-xs text-zinc-500 font-medium">Tidak ada surat yang ditemukan</p>
                  <p class="text-[11px] text-zinc-400">Gunakan tombol "Buat Surat" untuk membuat surat keluar baru.</p>
                </div>
              </td>
            </tr>

            <!-- Data Rows -->
            <tr
              v-for="(surat, index) in paginatedSurat"
              :key="surat.id"
              class="hover:bg-black/[0.015] transition-colors"
            >
              <td class="px-5 py-4 text-center text-zinc-400 font-mono">
                {{ (currentPage - 1) * itemsPerPage + index + 1 }}
              </td>
              <td class="px-5 py-4 font-mono font-medium text-zinc-900 whitespace-nowrap">
                {{ surat.nomor_surat }}
              </td>
              <td class="px-5 py-4 font-semibold text-zinc-900 leading-snug">
                <div>{{ surat.perihal }}</div>
                <div v-if="surat.tujuan" class="text-[11px] font-medium text-[#0A84DC] mt-0.5 line-clamp-1">
                  Tujuan: {{ surat.tujuan }}
                </div>
                <div v-if="surat.catatan" class="text-[11px] font-normal text-zinc-500 mt-0.5 line-clamp-1">
                  {{ surat.catatan }}
                </div>
              </td>
              <td class="px-5 py-4 text-zinc-700 font-medium whitespace-nowrap">
                {{ surat.pic_nama }}
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <Badge
                  :variant="getStatusBadgeVariant(surat.status_saat_ini)"
                  size="sm"
                >
                  {{ surat.status_saat_ini }}
                </Badge>
              </td>
              <td class="px-5 py-3 text-right whitespace-nowrap">
                <div class="inline-flex items-center justify-end gap-1">
                  <!-- Quick Link: Google Docs (Edit) -->
                  <Button
                    v-if="surat.gdocs_url"
                    as-child
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 rounded-xl text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                    title="Buka Google Docs (Edit)"
                    aria-label="Buka Google Docs"
                  >
                    <a :href="surat.gdocs_url" target="_blank" rel="noopener noreferrer">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </Button>

                  <!-- Quick Link: PDF File / Export -->
                  <Button
                    v-if="surat.arsip_url"
                    as-child
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                    title="Lihat / Download PDF"
                    aria-label="Lihat Dokumen PDF"
                  >
                    <a :href="getBackendAssetUrl(surat.arsip_url)" target="_blank" rel="noopener noreferrer">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </a>
                  </Button>

                  <!-- Tombol Detail Surat (Eye Icon) -->
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    @click="openDetail(surat)"
                    class="h-8 w-8 rounded-xl text-zinc-400 hover:text-[#0A84DC] hover:bg-[#0A84DC]/10"
                    title="Lihat Detail Surat"
                    aria-label="Lihat Detail Surat"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.8"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.8"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </Button>

                  <!-- Tombol Hapus Surat (Trash Icon) -->
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    @click="confirmDeleteSurat(surat)"
                    :disabled="deletingId === surat.id"
                    class="h-8 w-8 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    title="Hapus Surat"
                    aria-label="Hapus Surat"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.8"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <footer
        v-if="filteredSurat.length > 0"
        class="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t border-black/5 bg-black/[0.01] text-xs text-zinc-500 gap-3"
      >
        <div>
          Menampilkan
          <span class="font-semibold text-zinc-800">
            {{ (currentPage - 1) * itemsPerPage + 1 }}
          </span>
          -
          <span class="font-semibold text-zinc-800">
            {{ Math.min(currentPage * itemsPerPage, filteredSurat.length) }}
          </span>
          dari
          <span class="font-semibold text-zinc-800">{{ filteredSurat.length }}</span>
          surat
        </div>

        <div class="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            @click="prevPage"
            :disabled="currentPage <= 1"
          >
            Previous
          </Button>

          <span class="text-xs font-medium text-zinc-600 px-1">
            Halaman <span class="font-semibold text-zinc-900">{{ currentPage }}</span> dari <span class="font-semibold text-zinc-900">{{ totalPages }}</span>
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            @click="nextPage"
            :disabled="currentPage >= totalPages"
          >
            Next
          </Button>
        </div>
      </footer>
    </div>

    <!-- Modal Konfirmasi Hapus Surat (Reusable ConfirmDialog) -->
    <ConfirmDialog
      :open="isDeleteModalOpen"
      title="Hapus Surat Resmi?"
      confirm-text="Ya, Hapus"
      loading-text="Menghapus..."
      :is-loading="isDeleting"
      @update:open="(val: boolean) => { if (!val) isDeleteModalOpen = false }"
      @cancel="isDeleteModalOpen = false"
      @confirm="executeDeleteSurat"
    >
      <template #description>
        Yakin ingin menghapus surat <b class="text-zinc-900 font-mono">{{ suratToDelete?.nomor_surat }}</b> beserta seluruh log riwayatnya?
      </template>
    </ConfirmDialog>

    <!-- Modal Generator Surat Otomatis -->
    <SuratGeneratorModal
      v-if="isGeneratorModalOpen"
      :key="generatorKey"
      :is-open="isGeneratorModalOpen"
      @close="isGeneratorModalOpen = false"
      @created="fetchSurat"
      @open-setup="isGeneratorModalOpen = false; isSetupModalOpen = true"
    />

    <!-- Modal Setup Master Template GDrive -->
    <TemplateSetupModal
      v-if="isSetupModalOpen"
      :is-open="isSetupModalOpen"
      @close="isSetupModalOpen = false"
      @synced="clearGeneratorCache(); generatorKey++"
    />

    <!-- Modal Detail Component Integration -->
    <Teleport to="body">
      <Transition name="drawer">
        <CardDetail
          v-if="isDetailOpen && selectedSurat"
          :surat="selectedSurat"
          :status-options="STATUS_COLUMNS"
          @close="closeDetail"
          @updated="fetchSurat"
        />
      </Transition>
    </Teleport>
  </div>
</template>
