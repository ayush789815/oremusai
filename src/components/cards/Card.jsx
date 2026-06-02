'use client';

import { cn } from '../../utils/classNames.js';

export default function Card({ className = '', children, hover = false, ...rest }) {
  return (
    <div
      {...rest}
      className={cn(
        'bg-white dark:bg-navy-900 border border-navy-200/70 dark:border-navy-800 rounded-xl shadow-soft',
        hover && 'transition hover:shadow-card hover:-translate-y-0.5',
        className
      )}
    >
      {children}
    </div>
  );
}