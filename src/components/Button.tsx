import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

const variants = {
  primary: 'bg-brand-orange text-white hover:bg-orange-600',
  secondary: 'bg-white text-brand-black ring-1 ring-gray-200 hover:bg-gray-50',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-brand-black',
  danger: 'bg-red-50 text-red-700 hover:bg-red-100',
};

export function Button({ children, className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
