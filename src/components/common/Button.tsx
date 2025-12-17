import { ReactNode, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-400',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-primary-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200',
    ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-primary-400 dark:hover:bg-gray-800 dark:text-gray-200',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-3 py-2 text-sm gap-1.5 lg:px-4 lg:py-2 lg:gap-2', // More compact on mobile
    lg: 'px-4 py-2.5 text-sm gap-2 lg:px-6 lg:py-3 lg:text-base lg:gap-2' // More compact on mobile
  };

  const widthClass = fullWidth ? 'w-full' : '';

  // Check if flex-row-reverse is in className to determine RTL
  const isRTL = className.includes('flex-row-reverse');
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : isRTL && icon ? (
        <>
          {children}
          {icon}
        </>
      ) : icon ? (
        <>
          {icon}
          {children}
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}