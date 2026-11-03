<script setup lang="ts">
import {
  ToastProvider,
  ToastViewport,
  ToastRoot,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from 'radix-vue'
import { useToast } from './use-toast'
import { toastVariants } from '.'

const { toasts, dismiss } = useToast()
</script>

<template>
  <ToastProvider>
    <ToastRoot
      v-for="t in toasts"
      :key="t.id"
      :class="toastVariants({ variant: t.variant })"
      :open="t.open"
      :duration="t.duration ?? 4000"
      @update:open="(val: boolean) => {
        if (!val) {
          dismiss(t.id)
        }
      }"
    >
      <div class="flex items-start gap-3 w-full pr-2">
        <!-- Visual Icon Cue -->
        <div
          v-if="t.variant === 'success'"
          class="shrink-0 w-6 h-6 rounded-full bg-emerald-100/90 text-emerald-700 flex items-center justify-center mt-0.5"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div
          v-else-if="t.variant === 'destructive'"
          class="shrink-0 w-6 h-6 rounded-full bg-rose-100/90 text-rose-700 flex items-center justify-center mt-0.5"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <div
          v-else
          class="shrink-0 w-6 h-6 rounded-full bg-sky-100/90 text-sky-700 flex items-center justify-center mt-0.5"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div class="grid gap-0.5 flex-1 min-w-0">
          <ToastTitle v-if="t.title" class="text-xs font-semibold leading-snug">
            {{ t.title }}
          </ToastTitle>
          <ToastDescription v-if="t.description" class="text-[11px] opacity-90 mt-0.5 leading-relaxed">
            {{ t.description }}
          </ToastDescription>
        </div>
      </div>

      <ToastClose
        aria-label="Tutup notifikasi"
        class="absolute right-2 top-2 rounded-xl p-1 text-zinc-400 opacity-70 transition-opacity hover:text-zinc-900 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0A84DC]/30 cursor-pointer"
        @click="dismiss(t.id)"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </ToastClose>
    </ToastRoot>

    <ToastViewport class="fixed top-0 z-[110] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]" />
  </ToastProvider>
</template>
