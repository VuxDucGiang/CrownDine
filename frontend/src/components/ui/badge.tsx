'use client'

import * as React from 'react'
import clsx from 'clsx'

export type BadgeVariant = 'default' | 'outline' | 'success' | 'warning' | 'danger'

type BadgeProps = {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors',
        {
          // default
          'border border-gray-200 bg-gray-100 text-gray-800': variant === 'default',

          // outline
          'cursor-pointer border border-gray-300 bg-white text-gray-700 hover:bg-gray-100': variant === 'outline',

          // success (AVAILABLE)
          'border border-green-200 bg-green-100 text-green-700': variant === 'success',

          // warning (RESERVED)
          'border border-yellow-200 bg-yellow-100 text-yellow-800': variant === 'warning',

          // danger (OCCUPIED)
          'border border-red-200 bg-red-100 text-red-700': variant === 'danger'
        },
        className
      )}
    >
      {children}
    </span>
  )
}
