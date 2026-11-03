import { cva, type VariantProps } from 'class-variance-authority'

export { default as Label } from './Label.vue'

export const labelVariants = cva(
  'text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      variant: {
        default: 'text-zinc-700',
        muted: 'text-zinc-500',
        error: 'text-rose-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export type LabelVariants = VariantProps<typeof labelVariants>
