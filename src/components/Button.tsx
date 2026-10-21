import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'amber';
  size?: 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none';

  const sizeStyles = {
    md: 'min-h-[48px] px-4 py-2.5 text-base gap-2',
    lg: 'min-h-[56px] px-6 py-3.5 text-lg gap-3',
    xl: 'min-h-[64px] px-8 py-4 text-xl gap-3 shadow-thumb',
  };

  const variantStyles = {
    primary: 'bg-dukaan-green-700 hover:bg-dukaan-green-800 text-white focus:ring-dukaan-green-500 shadow-md',
    secondary: 'bg-stone-200 hover:bg-stone-300 text-ink focus:ring-stone-400',
    amber: 'bg-dukaan-amber-600 hover:bg-dukaan-amber-700 text-white focus:ring-dukaan-amber-500 shadow-md',
    danger: 'bg-dukaan-red-600 hover:bg-dukaan-red-700 text-white focus:ring-dukaan-red-500 shadow-md',
    outline: 'border-2 border-stone-300 bg-white hover:bg-stone-50 text-ink focus:ring-stone-300',
  };

  return (
    <button
      className={twMerge(
        clsx(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          fullWidth && 'w-full',
          className
        )
      )}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

