<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { Label, type LabelProps } from 'radix-vue'
import { type LabelVariants, labelVariants } from '.'
import { cn } from '@/lib/utils'

interface Props extends /* @vue-ignore */ LabelProps {
  variant?: LabelVariants['variant']
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const delegatedProps = computed(() => {
  const { class: _, variant: __, ...delegated } = props
  return delegated
})
</script>

<template>
  <Label
    v-bind="delegatedProps"
    :class="cn(labelVariants({ variant }), props.class)"
  >
    <slot />
  </Label>
</template>
