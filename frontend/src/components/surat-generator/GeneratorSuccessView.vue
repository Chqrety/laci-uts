<script setup lang="ts">
import type { Surat } from '@/services/api'
import { Button } from '@/components/ui/button'

defineProps<{
  result: {
    surat: Surat
    gdocs_url: string
    pdf_url: string
  }
}>()

const emit = defineEmits<{
  (e: 'finish'): void
  (e: 'newGeneration'): void
}>()
</script>

<template>
  <div class="p-6 sm:p-8 space-y-5 text-center overflow-y-auto overscroll-contain">
    <div class="w-14 h-14 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
      <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>

    <div class="space-y-1">
      <h3 class="text-base font-bold text-slate-900">Surat Berhasil Digenerate!</h3>
      <p class="text-xs text-slate-600 font-mono font-semibold">{{ result.surat.nomor_surat }}</p>
      <p class="text-xs text-slate-500 font-medium">{{ result.surat.perihal }}</p>
    </div>

    <div class="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
      <Button
        v-if="result.gdocs_url"
        as-child
        size="sm"
        class="w-full sm:w-auto"
      >
        <a :href="result.gdocs_url" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span>Buka Google Docs (Edit)</span>
        </a>
      </Button>

      <Button
        v-if="result.pdf_url"
        as-child
        variant="outline"
        size="sm"
        class="w-full sm:w-auto"
      >
        <a :href="result.pdf_url" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span>Lihat / Download PDF</span>
        </a>
      </Button>
    </div>

    <div class="pt-4 flex items-center justify-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        @click="emit('newGeneration')"
        class="rounded-full px-4 text-xs font-medium text-slate-500 hover:text-slate-800"
      >
        Buat Surat Lagi
      </Button>
      <Button
        type="button"
        size="sm"
        @click="emit('finish')"
        class="rounded-full px-6 text-xs font-semibold"
      >
        Selesai & Masuk ke Laci
      </Button>
    </div>
  </div>
</template>
