import { cva, type VariantProps } from 'class-variance-authority'

export { DialogRoot as Dialog } from 'radix-vue'
export { default as DialogContent } from './DialogContent.vue'
export { default as DialogDescription } from './DialogDescription.vue'
export { default as DialogFooter } from './DialogFooter.vue'
export { default as DialogHeader } from './DialogHeader.vue'
export { default as DialogTitle } from './DialogTitle.vue'

export const dialogContentVariants = cva(
  'fixed left-[50%] top-[50%] z-[100] grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 rounded-3xl border border-black/10 bg-white p-6 sm:p-7 shadow-xl duration-200 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        default: 'max-w-md',
        md: 'max-w-md',
        lg: 'max-w-lg',
        '2xl': 'sm:max-w-2xl',
        '3xl': 'sm:max-w-3xl',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
)

export type DialogContentVariants = VariantProps<typeof dialogContentVariants>
