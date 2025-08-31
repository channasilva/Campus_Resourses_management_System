import React, { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Search, Calendar, Clock } from 'lucide-react';
import { cn } from '../utils/cn';

interface BaseInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'filled' | 'outlined' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  success?: boolean;
  floating?: boolean;
  fullWidth?: boolean;
}

interface InputProps extends BaseInputProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> {
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'time' | 'search' | 'tel' | 'url';
  onChange?: (value: string) => void;
}

interface SelectProps extends BaseInputProps, Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'onChange'> {
  type: 'select';
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

interface TextAreaProps extends BaseInputProps, Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size' | 'onChange'> {
  type: 'textarea';
  rows?: number;
  resize?: boolean;
  onChange?: (value: string) => void;
}

type CombinedInputProps = InputProps | SelectProps | TextAreaProps;

const Input = forwardRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, CombinedInputProps>(
  (props, ref) => {
    const {
      label,
      error,
      helperText,
      required = false,
      disabled = false,
      className,
      variant = 'default',
      size = 'md',
      leftIcon,
      rightIcon,
      loading = false,
      success = false,
      floating = false,
      fullWidth = true,
      type = 'text',
      onChange,
      ...restProps
    } = props;

    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputId = useId();
    const errorId = useId();
    const helperId = useId();

    // Base classes for all input types
    const baseClasses = [
      'transition-all',
      'duration-300',
      'ease-out',
      'focus:outline-none',
      'focus:ring-0',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      'disabled:bg-secondary-50',
      'dark:disabled:bg-secondary-800',
      'cursor-text',
      fullWidth && 'w-full',
    ];

    // Size variants
    const sizeClasses = {
      sm: ['px-3', 'py-2', 'text-sm', 'min-h-[40px]'],
      md: ['px-4', 'py-3', 'text-base', 'min-h-[44px]'],
      lg: ['px-5', 'py-4', 'text-lg', 'min-h-[48px]'],
    };

    // Variant styles
    const variantClasses = {
      default: [
        'bg-white/80',
        'dark:bg-secondary-800/80',
        'backdrop-blur-sm',
        'border-2',
        'border-secondary-300',
        'dark:border-secondary-600',
        'rounded-xl',
        'focus:border-primary-500',
        'focus:ring-2',
        'focus:ring-primary-500/20',
        'hover:border-secondary-400',
        'dark:hover:border-secondary-500',
      ],
      filled: [
        'bg-secondary-100',
        'dark:bg-secondary-800',
        'border-2',
        'border-transparent',
        'rounded-xl',
        'focus:border-primary-500',
        'focus:ring-2',
        'focus:ring-primary-500/20',
        'hover:bg-secondary-200',
        'dark:hover:bg-secondary-700',
      ],
      outlined: [
        'bg-transparent',
        'border-2',
        'border-secondary-300',
        'dark:border-secondary-600',
        'rounded-xl',
        'focus:border-primary-500',
        'focus:ring-2',
        'focus:ring-primary-500/20',
        'hover:border-secondary-400',
        'dark:hover:border-secondary-500',
      ],
      ghost: [
        'bg-transparent',
        'border-2',
        'border-transparent',
        'rounded-xl',
        'focus:border-primary-500',
        'focus:ring-2',
        'focus:ring-primary-500/20',
        'hover:bg-secondary-50',
        'dark:hover:bg-secondary-800',
      ],
    };

    // State-based styling
    const stateClasses = [
      error && [
        'border-error-500',
        'focus:border-error-500',
        'focus:ring-error-500/20',
        'text-error-900',
        'dark:text-error-100',
      ],
      success && [
        'border-success-500',
        'focus:border-success-500',
        'focus:ring-success-500/20',
      ],
      loading && 'animate-pulse',
    ];

    // Icon styling
    const getIconClasses = (position: 'left' | 'right') => {
      const baseIconClasses = [
        'absolute',
        'top-1/2',
        'transform',
        '-translate-y-1/2',
        'text-secondary-400',
        'dark:text-secondary-500',
        'transition-colors',
        'duration-200',
      ];

      const sizeIconClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
      };

      const positionClasses = {
        left: position === 'left' ? ['left-3'] : [],
        right: position === 'right' ? ['right-3'] : [],
      };

      return cn(baseIconClasses, sizeIconClasses[size], positionClasses[position]);
    };

    // Padding adjustments for icons
    const getPaddingClasses = () => {
      const basePadding = sizeClasses[size];
      const leftPadding = leftIcon ? (size === 'sm' ? 'pl-10' : size === 'md' ? 'pl-12' : 'pl-14') : '';
      const rightPadding = (rightIcon || type === 'password') ? (size === 'sm' ? 'pr-10' : size === 'md' ? 'pr-12' : 'pr-14') : '';
      
      return cn(basePadding, leftPadding, rightPadding);
    };

    // Get appropriate icon for input type
    const getTypeIcon = () => {
      switch (type) {
        case 'search':
          return <Search className={getIconClasses('left')} />;
        case 'date':
          return <Calendar className={getIconClasses('right')} />;
        case 'time':
          return <Clock className={getIconClasses('right')} />;
        default:
          return null;
      }
    };

    // Combine all classes
    const inputClasses = cn(
      baseClasses,
      getPaddingClasses(),
      variantClasses[variant],
      stateClasses,
      floating && 'placeholder-transparent',
      'text-secondary-900',
      'dark:text-secondary-100',
      'placeholder-secondary-400',
      'dark:placeholder-secondary-500',
      className
    );

    // Label classes
    const labelClasses = cn(
      'block',
      'text-sm',
      'font-medium',
      'text-secondary-700',
      'dark:text-secondary-300',
      'transition-all',
      'duration-200',
      floating && [
        'absolute',
        'left-4',
        'pointer-events-none',
        'transform',
        'origin-left',
        (isFocused || (props as any).value) && [
          '-translate-y-6',
          'scale-75',
          'text-primary-600',
          'dark:text-primary-400',
        ],
        !(isFocused || (props as any).value) && [
          'top-1/2',
          '-translate-y-1/2',
          'text-secondary-400',
        ],
      ],
      required && 'after:content-["*"] after:text-error-500 after:ml-1',
    );

    // Error/Helper text classes
    const messageClasses = cn(
      'text-sm',
      'mt-2',
      'flex',
      'items-center',
      'gap-1',
      error ? 'text-error-600 dark:text-error-400' : 'text-secondary-500 dark:text-secondary-400'
    );

    // Render different input types
    const renderInput = () => {
      if (type === 'select') {
        const selectProps = props as SelectProps;
        return (
          <select
            ref={ref as React.Ref<HTMLSelectElement>}
            id={inputId}
            disabled={disabled}
            className={inputClasses}
            value={selectProps.value || ''}
            onChange={(e) => {
              console.log(`Input onChange: ${type} = "${e.target.value}"`);
              onChange?.(e.target.value);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-describedby={cn(error && errorId, helperText && helperId)}
            aria-invalid={!!error}
            {...(restProps as any)}
          >
            {selectProps.placeholder && (
              <option value="" disabled>
                {selectProps.placeholder}
              </option>
            )}
            {selectProps.options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        );
      }

      if (type === 'textarea') {
        const textareaProps = props as TextAreaProps;
        return (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={inputId}
            disabled={disabled}
            className={cn(
              inputClasses,
              textareaProps.resize === false && 'resize-none',
              'min-h-[100px]'
            )}
            rows={textareaProps.rows || 4}
            onChange={(e) => onChange?.(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-describedby={cn(error && errorId, helperText && helperId)}
            aria-invalid={!!error}
            {...(restProps as any)}
          />
        );
      }

      // Regular input
      const inputProps = props as InputProps;
      return (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          id={inputId}
          type={type === 'password' && showPassword ? 'text' : type}
          disabled={disabled}
          className={inputClasses}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-describedby={cn(error && errorId, helperText && helperId)}
          aria-invalid={!!error}
          {...(restProps as any)}
        />
      );
    };

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={labelClasses}
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className={cn('relative', !floating && label && 'mt-2')}>
          {/* Left Icon */}
          {leftIcon && (
            <div className={getIconClasses('left')}>
              {leftIcon}
            </div>
          )}

          {/* Type-specific icons */}
          {!leftIcon && getTypeIcon()}

          {/* Input Element */}
          {renderInput()}

          {/* Right Icon or Password Toggle */}
          {type === 'password' ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn(
                getIconClasses('right'),
                'hover:text-secondary-600',
                'dark:hover:text-secondary-400',
                'focus:outline-none',
                'focus:text-primary-600',
                'dark:focus:text-primary-400',
                'min-h-touch',
                'min-w-touch',
                'flex',
                'items-center',
                'justify-center',
                'rounded-md'
              )}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          ) : rightIcon ? (
            <div className={getIconClasses('right')}>
              {rightIcon}
            </div>
          ) : null}

          {/* Status Icons */}
          {success && !error && (
            <div className={getIconClasses('right')}>
              <CheckCircle2 className="text-success-500" />
            </div>
          )}

          {/* Loading Spinner */}
          {loading && (
            <div className={getIconClasses('right')}>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent" />
            </div>
          )}

          {/* Focus Ring Effect */}
          <div
            className={cn(
              'absolute',
              'inset-0',
              'rounded-xl',
              'pointer-events-none',
              'transition-all',
              'duration-300',
              isFocused && !error && 'ring-2 ring-primary-500/20',
              error && isFocused && 'ring-2 ring-error-500/20'
            )}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div id={errorId} className={messageClasses} role="alert">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <div id={helperId} className={messageClasses}>
            <span>{helperText}</span>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;