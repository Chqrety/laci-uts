<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  type DialogContentEmits,
  type DialogContentProps,
  DialogPortal,
  useForwardPropsEmits,
} from 'radix-vue'
import { type DialogContentVariants, dialogContentVariants } from '.'
import { cn } from '@/lib/utils'

interface Props extends /* @vue-ignore */ DialogContentProps {
  size?: DialogContentVariants['size']
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
const emits = defineEmits<DialogContentEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      class="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs duration-200 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <DialogContent
      v-bind="forwarded"
      :class="cn(dialogContentVariants({ size }), props.class)"
    >
      <slot />

      <DialogClose
        class="absolute right-4 top-4 rounded-xl p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A84DC]/30 disabled:pointer-events-none cursor-pointer"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span class="sr-only">Tutup</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
