<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    min?: string
    placeholder?: string
  }>(),
  {
    modelValue: '',
    min: '',
    placeholder: 'DD/MM/YYYY',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

// Current view month & year in calendar popover
const viewDate = ref(new Date())

// Convert YYYY-MM-DD -> DD/MM/YYYY for display/typing
const toDisplayFormat = (isoStr: string) => {
  if (!isoStr) return ''
  const parts = isoStr.split('-')
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`
  }
  return isoStr
}

// Convert DD/MM/YYYY -> YYYY-MM-DD for backend/models
const toIsoFormat = (displayStr: string) => {
  const parts = displayStr.split(/[/.-]/)
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    const d = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10)
    const y = parseInt(parts[2], 10)
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }
  }
  return ''
}

const inputValue = ref(toDisplayFormat(props.modelValue || ''))

watch(
  () => props.modelValue,
  (val) => {
    const disp = toDisplayFormat(val || '')
    if (disp !== inputValue.value) {
      inputValue.value = disp
    }
  }
)

const initViewDate = () => {
  if (props.modelValue) {
    const [y, m, d] = props.modelValue.split('-').map(Number)
    if (y && m && d) {
      viewDate.value = new Date(y, m - 1, 1)
      return
    }
  }
  viewDate.value = new Date()
}

const openCalendar = () => {
  isOpen.value = true
  initViewDate()
}

const toggleCalendar = () => {
  if (isOpen.value) {
    isOpen.value = false
  } else {
    openCalendar()
  }
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const currentMonthLabel = computed(() => {
  return `${MONTH_NAMES[viewDate.value.getMonth()]} ${viewDate.value.getFullYear()}`
})

const prevMonth = () => {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1)
}

// Calendar grid calculations
interface DayItem {
  dateStr: string
  dayNum: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  isDisabled: boolean
}

const calendarDays = computed(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()

  const firstDayIndex = new Date(year, month, 1).getDay()
  const startOffset = (firstDayIndex + 6) % 7

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const todayStr = new Date().toISOString().split('T')[0] || ''
  const days: DayItem[] = []

  // Prev month padding
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i
    const m = month === 0 ? 12 : month
    const y = month === 0 ? year - 1 : year
    const dStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({
      dateStr: dStr,
      dayNum: d,
      isCurrentMonth: false,
      isToday: dStr === todayStr,
      isSelected: dStr === props.modelValue,
      isDisabled: !!props.min && dStr < props.min,
    })
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({
      dateStr: dStr,
      dayNum: d,
      isCurrentMonth: true,
      isToday: dStr === todayStr,
      isSelected: dStr === props.modelValue,
      isDisabled: !!props.min && dStr < props.min,
    })
  }

  // Next month padding
  const remaining = (7 - (days.length % 7)) % 7
  for (let d = 1; d <= remaining; d++) {
    const m = month + 2 > 12 ? 1 : month + 2
    const y = month + 2 > 12 ? year + 1 : year
    const dStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({
      dateStr: dStr,
      dayNum: d,
      isCurrentMonth: false,
      isToday: dStr === todayStr,
      isSelected: dStr === props.modelValue,
      isDisabled: !!props.min && dStr < props.min,
    })
  }

  return days
})

const commitIsoDate = (isoStr: string) => {
  if (props.min && isoStr < props.min) return
  emit('update:modelValue', isoStr)
  inputValue.value = toDisplayFormat(isoStr)
  const [y, m] = isoStr.split('-').map(Number)
  if (y && m) {
    viewDate.value = new Date(y, m - 1, 1)
  }
}

const selectDate = (day: DayItem) => {
  if (day.isDisabled) return
  commitIsoDate(day.dateStr)
  isOpen.value = false
}

const selectToday = () => {
  const todayStr = new Date().toISOString().split('T')[0] || ''
  if (props.min && todayStr < props.min) return
  commitIsoDate(todayStr)
  isOpen.value = false
}

const clearDate = () => {
  emit('update:modelValue', '')
  inputValue.value = ''
  isOpen.value = false
}

// Manual Typing Handler
const handleInput = (e: Event) => {
  const el = e.target as HTMLInputElement
  let raw = el.value.replace(/[^\d/.-]/g, '')
  if (!raw.includes('/') && raw.length >= 8) {
    raw = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4, 8)}`
  }
  inputValue.value = raw

  const iso = toIsoFormat(raw)
  if (iso) {
    if (!props.min || iso >= props.min) {
      emit('update:modelValue', iso)
      const [y, m] = iso.split('-').map(Number)
      if (y && m) viewDate.value = new Date(y, m - 1, 1)
    }
  }
}

const handleBlur = () => {
  const iso = toIsoFormat(inputValue.value)
  if (iso) {
    commitIsoDate(iso)
  } else if (!inputValue.value.trim()) {
    emit('update:modelValue', '')
  } else {
    inputValue.value = toDisplayFormat(props.modelValue || '')
  }
}

// Arrow Keys Navigation
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' || e.key === 'Enter') {
    isOpen.value = false
    inputRef.value?.blur()
    e.stopPropagation()
    return
  }

  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    e.preventDefault()
    if (!isOpen.value) openCalendar()

    let baseDate: Date
    if (props.modelValue) {
      const [y, m, d] = props.modelValue.split('-').map(Number)
      baseDate = (y && m && d) ? new Date(y, m - 1, d) : new Date()
    } else {
      baseDate = new Date()
    }

    let deltaDays = 0
    if (e.key === 'ArrowLeft') deltaDays = -1
    else if (e.key === 'ArrowRight') deltaDays = 1
    else if (e.key === 'ArrowUp') deltaDays = -7
    else if (e.key === 'ArrowDown') deltaDays = 7

    baseDate.setDate(baseDate.getDate() + deltaDays)

    const y = baseDate.getFullYear()
    const m = String(baseDate.getMonth() + 1).padStart(2, '0')
    const d = String(baseDate.getDate()).padStart(2, '0')
    const newIso = `${y}-${m}-${d}`

    commitIsoDate(newIso)
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
        @focus="openCalendar"
        @keydown="handleKeydown"
        :placeholder="placeholder"
        maxlength="10"
        class="w-full h-9 pl-3 pr-8 text-xs rounded-xl bg-white border border-zinc-200 text-slate-800 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500 hover:border-slate-300 shadow-2xs"
      />
      <!-- Trailing Clickable Icon -->
      <button
        type="button"
        tabindex="-1"
        @click="toggleCalendar"
        class="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-slate-600 cursor-pointer"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
    </div>

    <!-- Calendar Popover Modal -->
    <div
      v-if="isOpen"
      class="absolute z-50 mt-1 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-3.5 left-0 sm:left-auto sm:right-0 animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Header Navigation -->
      <div class="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <button
          type="button"
          @click="prevMonth"
          class="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
          title="Bulan Sebelumnya"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span class="text-xs font-bold text-slate-800">
          {{ currentMonthLabel }}
        </span>

        <button
          type="button"
          @click="nextMonth"
          class="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
          title="Bulan Berikutnya"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Days of Week Header -->
      <div class="grid grid-cols-7 text-center pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
        <span>Sn</span>
        <span>Sl</span>
        <span>Rb</span>
        <span>Km</span>
        <span>Jm</span>
        <span class="text-rose-500">Sb</span>
        <span class="text-rose-500">Mg</span>
      </div>

      <!-- Days Grid -->
      <div class="grid grid-cols-7 gap-1 text-center py-1">
        <button
          v-for="(day, idx) in calendarDays"
          :key="idx"
          type="button"
          @click="selectDate(day)"
          :disabled="day.isDisabled"
          :class="[
            'h-7 w-7 mx-auto rounded-lg text-xs flex items-center justify-center font-medium transition-all select-none cursor-pointer',
            day.isSelected
              ? 'bg-sky-600 text-white font-bold shadow-xs'
              : day.isToday
              ? 'border border-sky-500 text-sky-600 font-bold'
              : day.isCurrentMonth
              ? 'text-slate-700 hover:bg-slate-100'
              : 'text-slate-300 hover:bg-slate-50',
            day.isDisabled ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : ''
          ]"
        >
          {{ day.dayNum }}
        </button>
      </div>

      <!-- Footer Quick Action Buttons -->
      <div class="flex items-center justify-between pt-2.5 mt-1 border-t border-slate-100 text-[11px]">
        <button
          type="button"
          @click="clearDate"
          class="text-slate-400 hover:text-rose-600 font-medium cursor-pointer"
        >
          Hapus
        </button>
        <button
          type="button"
          @click="selectToday"
          class="text-sky-600 hover:text-sky-700 font-semibold cursor-pointer"
        >
          Hari Ini
        </button>
      </div>
    </div>
  </div>
</template>
