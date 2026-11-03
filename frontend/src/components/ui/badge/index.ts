import { cva, type VariantProps } from 'class-variance-authority'

export { default as Badge } from './Badge.vue'

export const badgeVariants = cva(
  'inline-flex items-center gap-1 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A84DC]/30',
  {
    variants: {
      variant: {
        default: 'bg-sky-50 text-sky-700 border border-sky-200/80',
        info: 'bg-sky-50 text-sky-700 border border-sky-200/80',
        orange: 'bg-orange-50 text-orange-700 border border-orange-200',
        amber: 'bg-amber-50 text-amber-700 border border-amber-200',
        warning: 'bg-amber-50 text-amber-700 border border-amber-200',
        purple: 'bg-purple-50 text-purple-700 border border-purple-200',
        emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        destructive: 'bg-rose-50 text-rose-700 border border-rose-200',
        secondary: 'bg-zinc-100 text-zinc-700 border border-zinc-200',
        outline: 'border border-slate-200 text-slate-700 bg-white',
        muted: 'font-normal text-slate-500 bg-slate-100/70 border-slate-200/80',
        mono: 'font-mono text-zinc-700 bg-black/[0.04] border border-black/5',
      },
      size: {
        default: 'px-2.5 py-1 text-xs rounded-xl',
        sm: 'px-2 py-0.5 text-[11px] rounded-lg',
        xs: 'px-1.5 py-0.5 text-[10px] rounded-md',
        pill: 'px-2.5 py-0.5 text-[11px] rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type BadgeVariants = VariantProps<typeof badgeVariants>
