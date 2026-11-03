<script setup lang="ts">
import { ref, computed } from 'vue'
import type { LogTracking } from '@/services/api'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/utils/date'

const props = defineProps<{
  logs?: LogTracking[]
}>()

const showAllLogs = ref(false)

const reversedLogs = computed(() => {
  if (!props.logs) return []
  return [...props.logs].reverse()
})

const displayedLogs = computed(() => {
  return showAllLogs.value ? reversedLogs.value : reversedLogs.value.slice(0, 5)
})
</script>

<template>
  <section class="space-y-2.5">
    <h3 class="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-1">Riwayat Tracking (Log)</h3>

    <div v-if="!logs || logs.length === 0" class="text-xs text-zinc-500 italic px-1">
      Belum ada catatan riwayat tracking.
    </div>

    <div v-else class="space-y-3">
      <TransitionGroup
        name="log-item"
        tag="ol"
        class="relative border-l-2 border-[#0A84DC]/30 ml-2.5 space-y-4 text-xs"
      >
        <li
          v-for="log in displayedLogs"
          :key="log.id"
          class="ml-4 space-y-1"
        >
          <div class="absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-[#0A84DC]"></div>
          <div class="flex items-center justify-between">
            <span class="font-semibold text-zinc-900">{{ log.status_baru }}</span>
            <time class="text-[11px] text-zinc-500 font-mono">{{ formatDate(log.waktu_update) }}</time>
          </div>
          <p v-if="log.catatan_log" class="text-zinc-600 bg-white/80 border border-black/5 p-2.5 rounded-2xl text-[11px] leading-relaxed shadow-2xs">
            {{ log.catatan_log }}
          </p>
        </li>
      </TransitionGroup>

      <div v-if="reversedLogs.length > 5" class="pl-2.5">
        <Button
          type="button"
          variant="link"
          size="sm"
          @click="showAllLogs = !showAllLogs"
          class="h-auto p-0 text-xs font-medium text-[#0A84DC] hover:text-[#0872be]"
        >
          {{ showAllLogs ? 'Sembunyikan' : 'Lihat Semua' }}
        </Button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.log-item-enter-active,
.log-item-leave-active {
  transition: all 0.25s ease;
}
.log-item-enter-from,
.log-item-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
