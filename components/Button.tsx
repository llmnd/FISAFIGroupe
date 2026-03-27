'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseClasses = 'font-light transition-all duration-300 rounded-lg cursor-pointer focus:outline-none';
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs tracking-widest uppercase',
    md: 'px-6 py-3 text-sm tracking-widest uppercase',
    lg: 'px-8 py-4 text-base tracking-widest uppercase min-h-12',
  };

  const variantClasses = {
    primary: 'bg-primary-700 dark:bg-accent-500 text-white hover:bg-primary-800 dark:hover:bg-accent-600 active:bg-primary-900 dark:active:bg-accent-700',
    secondary: 'border-2 border-primary-700 dark:border-accent-500 text-primary-700 dark:text-accent-400 hover:bg-primary-50 dark:hover:bg-neutral-800 active:bg-primary-100 dark:active:bg-neutral-700',
    ghost: 'text-primary-700 dark:text-neutral-300 hover:text-primary-800 dark:hover:text-accent-400',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
