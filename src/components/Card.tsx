import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'alert' | 'warning' | 'success';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white border-stone-200',
    alert: 'bg-dukaan-red-50 border-dukaan-red-200',
    warning: 'bg-dukaan-amber-50 border-dukaan-amber-200',
    success: 'bg-dukaan-green-50 border-dukaan-green-200',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl border p-4 shadow-card transition-all',
          variantStyles[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

