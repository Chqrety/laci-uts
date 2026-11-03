<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { SelectIcon, SelectTrigger, type SelectTriggerProps, useForwardProps } from 'radix-vue'
import { type SelectTriggerVariants, selectTriggerVariants } from '.'
import { cn } from '@/lib/utils'

interface Props extends /* @vue-ignore */ SelectTriggerProps {
  variant?: SelectTriggerVariants['variant']
  size?: SelectTriggerVariants['size']
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
const forwarded = useForwardProps(props)
</script>

<template>
  <SelectTrigger
    v-bind="forwarded"
    :class="cn(selectTriggerVariants({ variant, size }), props.class)"
  >
    <slot />
    <SelectIcon as-child>
      <svg class="h-4 w-4 opacity-50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </SelectIcon>
  </SelectTrigger>
</template>
