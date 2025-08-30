import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  gradient?: boolean;
  glow?: boolean;
  pulse?: boolean;
  className?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  rounded = 'xl',
  shadow = 'md',
  gradient = true,
  glow = false,
  pulse = false,
  disabled = false,
  className,
  type = 'button',
  ...props
}, ref) => {
  const baseClasses = [
    // Base styles
    'btn',
    'relative',
    'inline-flex',
    'items-center',
    'justify-center',
    'font-semibold',
    'transition-all',
    'duration-300',
    'ease-out',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'dark:focus:ring-offset-secondary-800',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'disabled:transform-none',
    'touch-manipulation',
    'select-none',
    'overflow-hidden',
    
    // Accessibility
    'motion-safe:transform',
    'motion-safe:hover:scale-105',
    'motion-safe:active:scale-95',
    'motion-reduce:transform-none',
    'motion-reduce:transition-none',
  ];

  // Size variants
  const sizeClasses = {
    xs: ['btn-xs', 'px-2', 'py-1', 'text-xs', 'min-h-[32px]', 'gap-1'],
    sm: ['btn-sm', 'px-3', 'py-2', 'text-sm', 'min-h-[40px]', 'gap-1.5'],
    md: ['btn-md', 'px-4', 'py-2.5', 'text-base', 'min-h-[44px]', 'gap-2'],
    lg: ['btn-lg', 'px-6', 'py-3', 'text-lg', 'min-h-[48px]', 'gap-2.5'],
    xl: ['btn-xl', 'px-8', 'py-4', 'text-xl', 'min-h-[52px]', 'gap-3'],
  };

  // Variant styles
  const variantClasses = {
    primary: [
      gradient
        ? 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800'
        : 'bg-primary-600 hover:bg-primary-700',
      'text-white',
      'border-transparent',
      'focus:ring-primary-500',
      shadow !== 'none' && `shadow-${shadow}`,
      'hover:shadow-lg',
      glow && 'hover:shadow-glow hover:shadow-primary-500/25',
    ],
    secondary: [
      gradient
        ? 'bg-gradient-to-r from-secondary-100 to-secondary-200 hover:from-secondary-200 hover:to-secondary-300 dark:from-secondary-700 dark:to-secondary-800 dark:hover:from-secondary-600 dark:hover:to-secondary-700'
        : 'bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:hover:bg-secondary-600',
      'text-secondary-900 dark:text-secondary-100',
      'border-transparent',
      'focus:ring-secondary-500',
      shadow !== 'none' && `shadow-${shadow}`,
      'hover:shadow-lg',
    ],
    success: [
      gradient
        ? 'bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700'
        : 'bg-success-500 hover:bg-success-600',
      'text-white',
      'border-transparent',
      'focus:ring-success-500',
      shadow !== 'none' && `shadow-${shadow}`,
      'hover:shadow-lg',
      glow && 'hover:shadow-glow hover:shadow-success-500/25',
    ],
    warning: [
      gradient
        ? 'bg-gradient-to-r from-warning-500 to-warning-600 hover:from-warning-600 hover:to-warning-700'
        : 'bg-warning-500 hover:bg-warning-600',
      'text-white',
      'border-transparent',
      'focus:ring-warning-500',
      shadow !== 'none' && `shadow-${shadow}`,
      'hover:shadow-lg',
      glow && 'hover:shadow-glow hover:shadow-warning-500/25',
    ],
    error: [
      gradient
        ? 'bg-gradient-to-r from-error-500 to-error-600 hover:from-error-600 hover:to-error-700'
        : 'bg-error-500 hover:bg-error-600',
      'text-white',
      'border-transparent',
      'focus:ring-error-500',
      shadow !== 'none' && `shadow-${shadow}`,
      'hover:shadow-lg',
      glow && 'hover:shadow-glow hover:shadow-error-500/25',
    ],
    ghost: [
      'bg-transparent',
      'hover:bg-secondary-100 dark:hover:bg-secondary-800',
      'text-secondary-700 dark:text-secondary-300',
      'border border-secondary-300 dark:border-secondary-600',
      'hover:border-secondary-400 dark:hover:border-secondary-500',
      'focus:ring-secondary-500',
      shadow !== 'none' && `shadow-${shadow}`,
    ],
    outline: [
      'bg-transparent',
      'border-2',
      'border-current',
      'hover:bg-current',
      'hover:text-white',
      'focus:ring-offset-2',
      shadow !== 'none' && `shadow-${shadow}`,
    ],
  };

  // Rounded variants
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  // Additional effects
  const effectClasses = [
    fullWidth && 'w-full',
    pulse && 'animate-pulse-soft',
    loading && 'cursor-wait',
  ];

  // Combine all classes
  const buttonClasses = cn(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    roundedClasses[rounded],
    effectClasses,
    className
  );

  // Icon sizing based on button size
  const iconSize = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  }[size];

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={buttonClasses}
      {...props}
    >
      {/* Shimmer effect overlay */}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full transition-transform duration-700 group-hover:translate-x-full" />
      
      {/* Loading spinner */}
      {loading && (
        <Loader2 className={cn('animate-spin', iconSize, leftIcon || rightIcon ? 'mr-2' : '')} />
      )}
      
      {/* Left icon */}
      {leftIcon && !loading && (
        <span className={cn(iconSize, 'flex-shrink-0')}>
          {leftIcon}
        </span>
      )}
      
      {/* Button content */}
      <span className={cn(
        'relative z-10 flex items-center justify-center',
        (leftIcon || loading) && 'ml-2',
        rightIcon && 'mr-2'
      )}>
        {children}
      </span>
      
      {/* Right icon */}
      {rightIcon && !loading && (
        <span className={cn(iconSize, 'flex-shrink-0')}>
          {rightIcon}
        </span>
      )}
      
      {/* Ripple effect container */}
      <span className="absolute inset-0 overflow-hidden rounded-inherit">
        <span className="absolute inset-0 bg-white/20 transform scale-0 rounded-full transition-transform duration-300 group-active:scale-100" />
      </span>
    </button>
  );
});

Button.displayName = 'Button';

export default Button;