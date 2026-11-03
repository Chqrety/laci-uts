<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    disabled?: boolean
    placeholder?: string
  }>(),
  {
    modelValue: '',
    disabled: false,
    placeholder: 'HH:MM',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const hoursRef = ref<HTMLElement | null>(null)
const minutesRef = ref<HTMLElement | null>(null)

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

const inputValue = ref(props.modelValue || '')
const activeSegment = ref<'hour' | 'minute'>('hour')

// Guard flag against scroll feedback loop
let isProgrammatic = false
let scrollTimer: any = null

watch(
  () => props.modelValue,
  (val) => {
    if (val !== inputValue.value) {
      inputValue.value = val || ''
    }
  }
)

const selectedHour = computed(() => {
  if (!inputValue.value || !inputValue.value.includes(':')) return '08'
  const parts = inputValue.value.split(':')
  return (parts[0] || '08').padStart(2, '0')
})

const selectedMinute = computed(() => {
  if (!inputValue.value || !inputValue.value.includes(':')) return '00'
  const parts = inputValue.value.split(':')
  return (parts[1] || '00').padStart(2, '0')
})

const scrollToActive = () => {
  isProgrammatic = true
  if (scrollTimer) clearTimeout(scrollTimer)

  nextTick(() => {
    if (hoursRef.value) {
      const activeEl = hoursRef.value.querySelector(`[data-hour="${selectedHour.value}"]`) as HTMLElement
      if (activeEl) {
        hoursRef.value.scrollTop = activeEl.offsetTop - (hoursRef.value.clientHeight / 2 - activeEl.clientHeight / 2)
      }
    }
    if (minutesRef.value) {
      const currentMinNum = parseInt(selectedMinute.value, 10) || 0
      const closestMin = minutes.reduce((prev, curr) => {
        return Math.abs(parseInt(curr, 10) - currentMinNum) < Math.abs(parseInt(prev, 10) - currentMinNum) ? curr : prev
      })
      const activeEl = minutesRef.value.querySelector(`[data-minute="${closestMin}"]`) as HTMLElement
      if (activeEl) {
        minutesRef.value.scrollTop = activeEl.offsetTop - (minutesRef.value.clientHeight / 2 - activeEl.clientHeight / 2)
      }
    }

    scrollTimer = setTimeout(() => {
      isProgrammatic = false
    }, 200)
  })
}

const openPicker = () => {
  if (props.disabled) return
  isOpen.value = true
  if (!inputValue.value) {
    commitTime('08', '00')
  }
  scrollToActive()
}

const togglePicker = () => {
  if (props.disabled) return
  if (isOpen.value) {
    isOpen.value = false
  } else {
    openPicker()
  }
}

const commitTime = (h: string, m: string) => {
  const formatted = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
  inputValue.value = formatted
  emit('update:modelValue', formatted)
  scrollToActive()
}

const selectHour = (h: string) => {
  commitTime(h, selectedMinute.value)
  activeSegment.value = 'hour'
  nextTick(() => inputRef.value?.setSelectionRange(0, 2))
}

const selectMinute = (m: string) => {
  commitTime(selectedHour.value, m)
  activeSegment.value = 'minute'
  nextTick(() => inputRef.value?.setSelectionRange(3, 5))
}

// Wheel manual scroll handlers (only fire when user is dragging/scrolling)
const onHoursScroll = (e: Event) => {
  if (isProgrammatic) return
  const el = e.target as HTMLElement
  const centerPos = el.scrollTop + el.clientHeight / 2
  const children = Array.from(el.querySelectorAll('[data-hour]')) as HTMLElement[]
  let closest: HTMLElement | null = null
  let minDiff = Infinity
  for (const child of children) {
    const childCenter = child.offsetTop + child.clientHeight / 2
    const diff = Math.abs(childCenter - centerPos)
    if (diff < minDiff) {
      minDiff = diff
      closest = child
    }
  }
  if (closest && closest.dataset.hour && closest.dataset.hour !== selectedHour.value) {
    commitTime(closest.dataset.hour, selectedMinute.value)
  }
}

const onMinutesScroll = (e: Event) => {
  if (isProgrammatic) return
  const el = e.target as HTMLElement
  const centerPos = el.scrollTop + el.clientHeight / 2
  const children = Array.from(el.querySelectorAll('[data-minute]')) as HTMLElement[]
  let closest: HTMLElement | null = null
  let minDiff = Infinity
  for (const child of children) {
    const childCenter = child.offsetTop + child.clientHeight / 2
    const diff = Math.abs(childCenter - centerPos)
    if (diff < minDiff) {
      minDiff = diff
      closest = child
    }
  }
  if (closest && closest.dataset.minute && closest.dataset.minute !== selectedMinute.value) {
    commitTime(selectedHour.value, closest.dataset.minute)
  }
}

// Click on input updates activeSegment (hour or minute)
const handleClick = () => {
  const cursor = inputRef.value?.selectionStart ?? 0
  activeSegment.value = cursor <= 2 ? 'hour' : 'minute'
  const pos = activeSegment.value === 'hour' ? 0 : 3
  inputRef.value?.setSelectionRange(pos, pos + 2)
}

// Manual Typing Handler
const handleInput = (e: Event) => {
  const el = e.target as HTMLInputElement
  let raw = el.value.replace(/[^\d:]/g, '')

  if (!raw.includes(':') && raw.length === 4) {
    raw = `${raw.slice(0, 2)}:${raw.slice(2, 4)}`
  }

  inputValue.value = raw

  const match = raw.match(/^([01]?\d|2[0-3]):([0-5]?\d)$/)
  if (match && match[1] && match[2]) {
    const h = match[1].padStart(2, '0')
    const m = match[2].padStart(2, '0')
    emit('update:modelValue', `${h}:${m}`)
    scrollToActive()
  }
}

const handleBlur = () => {
  const match = inputValue.value.match(/^([01]?\d|2[0-3]):([0-5]?\d)$/)
  if (match && match[1] && match[2]) {
    const h = match[1].padStart(2, '0')
    const m = match[2].padStart(2, '0')
    commitTime(h, m)
  } else if (!inputValue.value.trim()) {
    emit('update:modelValue', '')
  } else {
    inputValue.value = props.modelValue || ''
  }
}

// Arrow Keys Keyboard Navigation
const handleKeydown = (e: KeyboardEvent) => {
  if (props.disabled) return

  if (e.key === 'Escape' || e.key === 'Enter') {
    isOpen.value = false
    inputRef.value?.blur()
    e.stopPropagation()
    return
  }

  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    activeSegment.value = 'hour'
    inputRef.value?.setSelectionRange(0, 2)
    return
  }

  if (e.key === 'ArrowRight') {
    e.preventDefault()
    activeSegment.value = 'minute'
    inputRef.value?.setSelectionRange(3, 5)
    return
  }

  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    if (!isOpen.value) openPicker()

    let h = parseInt(selectedHour.value, 10) || 0
    let m = parseInt(selectedMinute.value, 10) || 0

    if (activeSegment.value === 'hour') {
      h = e.key === 'ArrowUp' ? (h + 1) % 24 : (h - 1 + 24) % 24
      commitTime(String(h), String(m))
      nextTick(() => inputRef.value?.setSelectionRange(0, 2))
    } else {
      // Step per 5 menit
      m = e.key === 'ArrowUp' ? (Math.floor(m / 5) * 5 + 5) % 60 : ((Math.ceil(m / 5) * 5 - 5 + 60) % 60)
      commitTime(String(h), String(m))
      nextTick(() => inputRef.value?.setSelectionRange(3, 5))
    }
  }
}

// ESC handler: close popover and prevent bubbling to parent modal dialog
const handleGlobalEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isOpen.value) {
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
    isOpen.value = false
    inputRef.value?.blur()
  }
}

watch(isOpen, (val) => {
  if (val) {
    window.addEventListener('keydown', handleGlobalEscape, true)
  } else {
    window.removeEventListener('keydown', handleGlobalEscape, true)
  }
})

const handleDocClick = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocClick)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalEscape, true)
  if (scrollTimer) clearTimeout(scrollTimer)
  document.removeEventListener('click', handleDocClick)
})
</script>

<template>
  <div ref="containerRef" class="relative w-full">
    <!-- Hybrid Input Trigger -->
    <div class="relative w-full">
      <input
        ref="inputRef"
        type="text"
        :value="inputValue"
        @input="handleInput"
        @blur="handleBlur"
        @focus="openPicker"
        @click="handleClick"
        @keydown="handleKeydown"
        :disabled="disabled"
        :placeholder="placeholder"
        maxlength="5"
        class="w-full h-9 pl-3 pr-8 text-xs rounded-xl bg-white border border-zinc-200 text-slate-800 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500 hover:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed shadow-2xs"
      />
      <!-- Trailing Clickable Icon -->
      <button
        type="button"
        tabindex="-1"
        @click="togglePicker"
        :disabled="disabled"
        class="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-slate-600 cursor-pointer disabled:cursor-not-allowed"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>

    <!-- Wheel Popover Modal (with @mousedown.prevent to preserve input focus) -->
    <div
      v-if="isOpen"
      @mousedown.prevent
      class="absolute z-50 mt-1 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 left-0 sm:left-auto sm:right-0 animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      <div class="flex items-center justify-between pb-2 border-b border-slate-100 px-1">
        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pilih Waktu (WIB)</span>
        <button
          type="button"
          @click="isOpen = false"
          class="text-xs text-sky-600 font-semibold hover:text-sky-700 cursor-pointer"
        >
          Selesai
        </button>
      </div>

      <!-- Wheel UI Fig 2b Mode Container -->
      <div class="relative mt-2 h-40 bg-slate-50/60 rounded-xl overflow-hidden border border-slate-100">
        <!-- Lens Center Highlight Bar -->
        <div class="absolute inset-x-2 top-1/2 -translate-y-1/2 h-9 rounded-lg bg-sky-500/10 border border-sky-400/30 pointer-events-none z-10" />

        <div class="grid grid-cols-2 h-full text-center divide-x divide-slate-100 relative">
          <!-- Hours Column -->
          <div
            ref="hoursRef"
            @scroll.passive="onHoursScroll"
            class="h-full overflow-y-auto py-16 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden snap-y snap-mandatory"
          >
            <div
              v-for="h in hours"
              :key="h"
              :data-hour="h"
              @click="selectHour(h)"
              :class="[
                'h-9 flex items-center justify-center text-sm snap-center cursor-pointer select-none transition-all',
                selectedHour === h
                  ? 'text-sky-600 font-bold scale-110'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              ]"
            >
              {{ h }}
            </div>
          </div>

          <!-- Minutes Column -->
          <div
            ref="minutesRef"
            @scroll.passive="onMinutesScroll"
            class="h-full overflow-y-auto py-16 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden snap-y snap-mandatory"
          >
            <div
              v-for="m in minutes"
              :key="m"
              :data-minute="m"
              @click="selectMinute(m)"
              :class="[
                'h-9 flex items-center justify-center text-sm snap-center cursor-pointer select-none transition-all',
                selectedMinute === m
                  ? 'text-sky-600 font-bold scale-110'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              ]"
            >
              {{ m }}
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between pt-2 px-1 text-[11px] text-slate-400">
        <span>Jam (00-23)</span>
        <span>Menit (↑/↓ 5m)</span>
      </div>
    </div>
  </div>
</template>
