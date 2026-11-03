import { cva, type VariantProps } from 'class-variance-authority'

export { SelectRoot as Select, SelectValue } from 'radix-vue'
export { default as SelectContent } from './SelectContent.vue'
export { default as SelectItem } from './SelectItem.vue'
export { default as SelectTrigger } from './SelectTrigger.vue'

export const selectTriggerVariants = cva(
  'flex w-full items-center justify-between rounded-2xl border text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A84DC]/30 focus:border-[#0A84DC] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-180 [&>span]:truncate',
  {
    variants: {
      variant: {
        default: 'bg-zinc-50 border-zinc-200',
        white: 'bg-white border-zinc-200 shadow-2xs',
      },
      size: {
        default: 'px-3.5 py-2.5',
        sm: 'h-8 px-3 py-1.5 text-xs rounded-xl',
        lg: 'h-10 px-3.5 py-2 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type SelectTriggerVariants = VariantProps<typeof selectTriggerVariants>
