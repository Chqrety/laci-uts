import { cva, type VariantProps } from 'class-variance-authority'

export { default as Toaster } from './Toaster.vue'
export { toast, useToast } from './use-toast'

export const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-2xl border p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'border-slate-200/90 bg-white/95 text-slate-900 shadow-lg backdrop-blur-md',
        destructive: 'destructive group border-rose-200/90 bg-rose-50/95 text-rose-900 shadow-lg backdrop-blur-md',
        success: 'success group border-emerald-200/90 bg-emerald-50/95 text-emerald-900 shadow-lg backdrop-blur-md',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export type ToastVariants = VariantProps<typeof toastVariants>
