<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

withDefaults(
  defineProps<{
    open: boolean
    title?: string
    description?: string
    confirmText?: string
    cancelText?: string
    loadingText?: string
    isLoading?: boolean
    variant?: 'destructive' | 'default' | 'outline' | 'secondary' | 'ghost' | 'link'
  }>(),
  {
    title: 'Konfirmasi Tindakan',
    description: '',
    confirmText: 'Ya, Lanjutkan',
    cancelText: 'Batal',
    loadingText: 'Memproses...',
    isLoading: false,
    variant: 'destructive',
  },
)

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const handleCancel = () => {
  emit('cancel')
  emit('update:open', false)
}

const handleConfirm = () => {
  emit('confirm')
}
</script>

<template>
  <Dialog :open="open" @update:open="(val: boolean) => emit('update:open', val)">
    <DialogContent size="sm" class="text-center">
      <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center border border-rose-100">
        <slot name="icon">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.8"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </slot>
      </div>

      <DialogHeader class="text-center sm:text-center">
        <DialogTitle class="text-center sm:text-center">
          <slot name="title">{{ title }}</slot>
        </DialogTitle>
        <DialogDescription class="text-center sm:text-center mt-1.5 leading-relaxed">
          <slot name="description">
            {{ description }}
          </slot>
        </DialogDescription>
      </DialogHeader>

      <DialogFooter class="flex sm:justify-center gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          class="flex-1"
          :disabled="isLoading"
          @click="handleCancel"
        >
          {{ cancelText }}
        </Button>
        <Button
          type="button"
          :variant="variant"
          size="sm"
          class="flex-1"
          :disabled="isLoading"
          @click="handleConfirm"
        >
          {{ isLoading ? loadingText : confirmText }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
