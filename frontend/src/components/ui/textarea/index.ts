import { cva, type VariantProps } from 'class-variance-authority'

export { default as Textarea } from './Textarea.vue'

export const textareaVariants = cva(
  'flex min-h-[60px] w-full rounded-2xl border bg-zinc-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A84DC]/30 focus:border-[#0A84DC] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-180 resize-none',
  {
    variants: {
      variant: {
        default: 'border-zinc-200',
        error: 'border-rose-400 focus:ring-rose-200 focus:border-rose-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export type TextareaVariants = VariantProps<typeof textareaVariants>
