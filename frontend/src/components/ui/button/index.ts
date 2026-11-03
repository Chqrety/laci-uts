import { cva, type VariantProps } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84DC]/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-sky-600 text-white hover:bg-sky-700 shadow-xs',
        orange: 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm hover:shadow',
        'orange-outline': 'border border-orange-200/90 bg-orange-50/80 text-orange-800 hover:bg-orange-100/90 shadow-2xs',
        destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-xs',
        outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200/80',
        ghost: 'hover:bg-slate-100 text-slate-700',
        link: 'text-sky-600 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-5 py-2.5 rounded-full',
        sm: 'h-8 px-3.5 py-1.5 rounded-full text-xs font-medium',
        xs: 'h-6 px-2.5 text-[10px] rounded-full font-semibold',
        lg: 'h-11 px-8 py-3.5 rounded-full text-sm font-bold',
        icon: 'h-9 w-9 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
