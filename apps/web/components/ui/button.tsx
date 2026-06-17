import { ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center rounded-lg text-sm font-medium px-4 py-2 transition-colors disabled:opacity-50 disabled:pointer-events-none',
        variant === 'primary' && 'bg-brand-600 text-white hover:bg-brand-800',
        variant === 'secondary' && 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50',
        variant === 'ghost' && 'text-gray-600 hover:bg-gray-100',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
