import { cva, type VariantProps } from 'class-variance-authority'

export { default as Input } from './Input.vue'

export const inputVariants = cva(
  'flex w-full rounded-2xl bg-zinc-50 border text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A84DC]/30 focus:border-[#0A84DC] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-180 file:border-0 file:bg-transparent file:text-xs file:font-medium',
  {
    variants: {
      variant: {
        default: 'border-zinc-200',
        error: 'border-rose-400 focus:ring-rose-200 focus:border-rose-500',
      },
      size: {
        default: 'px-3.5 py-2.5 text-xs',
        sm: 'px-3 py-1.5 text-[11px]',
        lg: 'px-4 py-3 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type InputVariants = VariantProps<typeof inputVariants>
