<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { type InputVariants, inputVariants } from '.'
import { cn } from '@/lib/utils'

interface Props {
  variant?: InputVariants['variant']
  size?: InputVariants['size']
  defaultValue?: string | number
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const modelValue = defineModel<string | number>()
</script>

<template>
  <input
    v-model="modelValue"
    :class="cn(inputVariants({ variant, size }), props.class)"
  />
</template>
