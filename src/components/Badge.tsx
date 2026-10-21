import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'danger' | 'warning' | 'success' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className,
  ...props
}) => {
  const variantStyles = {
    danger: 'bg-dukaan-red-100 text-dukaan-red-700 border border-dukaan-red-200',
    warning: 'bg-dukaan-amber-100 text-dukaan-amber-800 border border-dukaan-amber-200',
    success: 'bg-dukaan-green-100 text-dukaan-green-800 border border-dukaan-green-200',
    neutral: 'bg-stone-100 text-stone-700 border border-stone-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-semibold rounded-md',
    md: 'px-2.5 py-1 text-sm font-bold rounded-lg',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5',
          sizeStyles[size],
          variantStyles[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
};

