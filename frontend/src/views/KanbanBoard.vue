<script setup lang="ts">
import { ref, onMounted, onActivated, computed } from 'vue'
import {
  suratService,
  prokerService,
  currentRole,
  STATUS_COLUMNS,
  type Surat,
  type Proker,
} from '@/services/api'
import { useKanbanDragDrop } from '@/composables/useKanbanDragDrop'
import CardDetail from '@/components/molecules/CardDetail.vue'
import KanbanFilter from '@/components/molecules/KanbanFilter.vue'
import KanbanCard from '@/components/organisms/KanbanCard.vue'
import KanbanModalForm from '@/components/organisms/KanbanModalForm.vue'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

const suratList = ref<Surat[]>([])
const filteredSuratList = ref<Surat[]>([])
const prokerList = ref<Proker[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const selectedSurat = ref<Surat | null>(null)

// Modal tambah surat baru
const isCreateModalOpen = ref(false)


const isSekre = computed(() => currentRole.value === 'sekre' || currentRole.value === 'ketum')
const isHumas = computed(() => currentRole.value === 'humas')
const canCreateSurat = computed(() => isSekre.value || isHumas.value)

const totalSuratCount = computed(() => suratList.value.length)
const completedSuratCount = computed(() =>
  suratList.value.filter((s) => s.status_saat_ini.toLowerCase().includes('selesai') || s.status_saat_ini.toLowerCase().includes('arsip')).length
)
const activeSuratCount = computed(() => Math.max(0, totalSuratCount.value - completedSuratCount.value))

// Status columns array defined from shared constant
const statusColumns = [...STATUS_COLUMNS]

const loadSurat = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const data = await suratService.getAll()
    suratList.value = data

    if (selectedSurat.value) {
      const updated = data.find((s) => s.id === selectedSurat.value?.id)
      if (updated) {
        selectedSurat.value = updated
      }
    }
  } catch (err: any) {
    errorMessage.value = err.response?.data?.error || err.message || 'Gagal memuat data surat'
  } finally {
    isLoading.value = false
  }
}

const loadProker = async () => {
  try {
    prokerList.value = await prokerService.getAll()
  } catch (err: any) {
    console.error('Gagal memuat daftar proker:', err)
  }
}

const getSuratByStatus = (status: string) => {
  return filteredSuratList.value.filter((s) => s.status_saat_ini.toLowerCase() === status.toLowerCase())
}

const openDetail = (surat: Surat) => {
  if (isDragging.value) return
  selectedSurat.value = surat
}

const closeDetail = () => {
  selectedSurat.value = null
}

// Core status update function
const executeStatusUpdate = async (suratId: string, targetStatus: string) => {
  const surat = suratList.value.find((s) => s.id === suratId)
  if (!surat) return
  if (surat.status_saat_ini.toLowerCase() === targetStatus.toLowerCase()) return

  const previousStatus = surat.status_saat_ini
  surat.status_saat_ini = targetStatus
  filteredSuratList.value = [...filteredSuratList.value]

  try {
    await suratService.updateStatus(suratId, {
      status_saat_ini: targetStatus,
    })
    await loadSurat()
    toast({
      title: 'Status Diperbarui',
      description: `Surat berhasil dipindahkan ke kolom "${targetStatus}"`,
      variant: 'success',
    })
  } catch (err: any) {
    surat.status_saat_ini = previousStatus
    filteredSuratList.value = [...filteredSuratList.value]
    toast({
      title: 'Gagal Memindahkan Surat',
      description: err.response?.data?.error || err.message || 'Gagal memindahkan status surat',
      variant: 'destructive',
    })
  }
}

// Drag & Drop Composable (Desktop DnD, Mobile Touch, & Ambient Edge Zone)
const {
  draggingCardId,
  dragOverColumn,
  ambientDrop,
  isDragging,
  onDragStart,
  onDrag,
  onDragEnd,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
} = useKanbanDragDrop(suratList, statusColumns, executeStatusUpdate)

onMounted(() => {
  loadSurat()
  loadProker()
})

onActivated(() => {
  loadSurat()
  loadProker()
})
</script>

<template>
  <div class="h-full flex flex-col space-y-4">
    <!-- Top Bar Controls -->
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-1">
      <div>
        <h2 class="text-xl font-medium tracking-tight text-slate-900 leading-snug">Alur Tracking Surat</h2>
        <p class="text-xs text-zinc-500 mt-0.5">Tarik dan lepas kartu atau geser horisontal untuk mengelola status surat.</p>
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto">
        <Button
          type="button"
          variant="outline"
          size="icon"
          @click="loadSurat"
          :disabled="isLoading"
          title="Muat Ulang"
          aria-label="Muat Ulang"
        >
          <svg class="w-4 h-4" :class="{ 'animate-spin': isLoading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </Button>

        <Button
          type="button"
          size="sm"
          @click="isCreateModalOpen = true"
          class="flex-1 sm:flex-initial"
        >
          + Tambah Surat
        </Button>
      </div>
    </header>

    <!-- Floema Micro-Metrics Strip (Architectural Quick Status) -->
    <div class="grid grid-cols-3 gap-2 sm:gap-4">
      <div class="rounded-2xl border border-slate-200/90 bg-white/90 backdrop-blur-sm p-3 sm:px-4 flex items-center justify-between shadow-2xs">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Surat</span>
          <span class="text-base sm:text-lg font-bold text-slate-900 leading-none mt-1 block">{{ totalSuratCount }}</span>
        </div>
        <span class="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
      </div>

      <div class="rounded-2xl border border-slate-200/90 bg-white/90 backdrop-blur-sm p-3 sm:px-4 flex items-center justify-between shadow-2xs">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Sedang Berjalan</span>
          <span class="text-base sm:text-lg font-bold text-orange-600 leading-none mt-1 block">{{ activeSuratCount }}</span>
        </div>
        <span class="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
      </div>

      <div class="rounded-2xl border border-slate-200/90 bg-white/90 backdrop-blur-sm p-3 sm:px-4 flex items-center justify-between shadow-2xs">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Selesai / Terarsip</span>
          <span class="text-base sm:text-lg font-bold text-emerald-600 leading-none mt-1 block">{{ completedSuratCount }}</span>
        </div>
        <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
      </div>
    </div>

    <!-- Advanced Multi-Filter Bar -->
    <KanbanFilter
      :surat-list="suratList"
      :proker-list="prokerList"
      @update:filtered="filteredSuratList = $event"
    />

    <!-- Error Notice -->
    <div
      v-if="errorMessage"
      role="alert"
      class="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl font-medium"
    >
      {{ errorMessage }}
    </div>

    <!-- Edge Ambient Dropzone Visual Overlay -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="ambientDrop.active"
        class="fixed inset-y-0 z-40 pointer-events-none flex items-center select-none"
        :class="ambientDrop.direction === 'left' ? 'left-0 justify-start' : 'right-0 justify-end'"
      >
        <!-- Soft Gradient Ambient Zone -->
        <div
          class="h-full w-28 sm:w-36 flex items-center transition-all duration-300"
          :class="[
            ambientDrop.direction === 'left'
              ? 'bg-gradient-to-r from-[#0A84DC]/40 via-[#0A84DC]/15 to-transparent pl-4 justify-start'
              : 'bg-gradient-to-l from-[#0A84DC]/40 via-[#0A84DC]/15 to-transparent pr-4 justify-end'
          ]"
        >
          <!-- Destination Status Pill (Miring & Elegan) -->
          <div
            class="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/95 border border-[#0A84DC]/30 text-[#0A84DC] shadow-xl transform transition-transform duration-200"
            :class="ambientDrop.direction === 'left' ? '-rotate-6 translate-x-1' : 'rotate-6 -translate-x-1'"
          >
            <svg
              v-if="ambientDrop.direction === 'left'"
              xmlns="http://www.w3.org/2000/svg"
              class="w-4 h-4 animate-pulse shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>

            <span class="text-xs font-bold tracking-tight whitespace-nowrap">
              Ke: {{ ambientDrop.targetStatus }}
            </span>

            <svg
              v-if="ambientDrop.direction === 'right'"
              xmlns="http://www.w3.org/2000/svg"
              class="w-4 h-4 animate-pulse shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Mobile-First Horizontal Scrolling Kanban Container -->
    <main
      class="flex-1 flex flex-nowrap gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-6 pt-1 items-start scroll-smooth"
      style="-webkit-overflow-scrolling: touch;"
    >
      <!-- Column Status Section (iOS rounded-3xl, glassmorphic) -->
      <section
        v-for="status in statusColumns"
        :key="status"
        :data-status="status"
        @dragover.prevent="onDragOver($event, status)"
        @dragenter.prevent="onDragEnter(status)"
        @dragleave="onDragLeave(status, $event)"
        @drop="onDrop($event, status)"
        :class="[
          'w-full min-w-full sm:w-[320px] sm:min-w-[320px] shrink-0 snap-center flex flex-col rounded-3xl border transition-all duration-200 max-h-[calc(100vh-12rem)] shadow-[0_8px_30px_rgb(0,0,0,0.05)]',
          dragOverColumn === status
            ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-200'
            : 'bg-white/85 backdrop-blur-md border-slate-200/80 shadow-xs'
        ]"
      >
        <!-- Column Header -->
        <header class="p-4 flex items-center justify-between border-b border-slate-200/60 bg-slate-50/60 rounded-t-3xl select-none">
          <div class="flex items-center gap-2">
            <h3 class="text-xs font-semibold text-zinc-900 tracking-tight">{{ status }}</h3>
            <span class="text-[11px] font-mono text-zinc-500 bg-white/90 border border-black/5 px-2 py-0.5 rounded-xl font-semibold shadow-2xs">
              {{ getSuratByStatus(status).length }}
            </span>
          </div>
        </header>

        <!-- Column Card List -->
        <div class="flex-1 p-3 space-y-3 overflow-y-auto no-scrollbar min-h-[130px]">
          <!-- Drop Placeholder Indicator -->
          <div
            v-if="dragOverColumn === status && draggingCardId"
            class="h-16 border-2 border-dashed border-[#0A84DC]/40 rounded-2xl bg-[#0A84DC]/5 flex items-center justify-center text-xs text-[#0A84DC] font-semibold transition-all"
          >
            Lepas kartu di sini
          </div>

          <div
            v-if="getSuratByStatus(status).length === 0 && dragOverColumn !== status"
            class="h-24 border border-dashed border-black/10 rounded-2xl flex items-center justify-center text-[11px] text-zinc-400"
          >
            Kosong
          </div>

          <!-- Surat Card (Apple iOS: rounded-2xl, subtle shadow, touch-supported) -->
          <KanbanCard
            v-for="item in getSuratByStatus(status)"
            :key="item.id"
            :surat="item"
            :is-dragging="draggingCardId === item.id"
            @dragstart="onDragStart($event, item.id)"
            @drag="onDrag"
            @dragend="onDragEnd"
            @dragover.prevent="onDragOver($event, status)"
            @drop.prevent="onDrop($event, status)"
            @touchstart="handleTouchStart($event, item.id)"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
            @touchcancel="handleTouchEnd"
            @contextmenu.prevent="() => {}"
            @click="openDetail(item)"
          />
        </div>
      </section>
    </main>

    <!-- Slide-over Card Detail with Transition Teleported to Body -->
    <Teleport to="body">
      <Transition name="drawer">
        <CardDetail
          v-if="selectedSurat"
          :surat="selectedSurat"
          :status-options="statusColumns"
          @close="closeDetail"
          @updated="loadSurat"
        />
      </Transition>
    </Teleport>

    <!-- Modal Create Surat -->
    <KanbanModalForm
      :is-open="isCreateModalOpen"
      :proker-list="prokerList"
      :status-columns="statusColumns"
      :is-humas="isHumas"
      @close="isCreateModalOpen = false"
      @created="loadSurat"
    />
  </div>
</template>
