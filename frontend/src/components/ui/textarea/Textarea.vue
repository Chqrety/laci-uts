<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { type TextareaVariants, textareaVariants } from '.'
import { cn } from '@/lib/utils'

const props = defineProps<{
  variant?: TextareaVariants['variant']
  class?: HTMLAttributes['class']
  defaultValue?: string | number
  modelValue?: string | number
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()
</script>

<template>
  <textarea
    :value="props.modelValue ?? props.defaultValue"
    :class="cn(textareaVariants({ variant }), props.class)"
    @input="emits('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
