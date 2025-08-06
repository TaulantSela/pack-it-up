'use client';

import { IconI, LabelI } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ComponentPropsWithRef } from 'react';

export interface InputProps extends ComponentPropsWithRef<'input'> {
  icon?: IconI;
  label: LabelI;
  error?: boolean;
  wrapperClassName?: string;
}

export default function Input({ label, className, children, icon, ...rest }: InputProps) {
  const Icon = icon?.name;

  return (
    <label className="flex cursor-pointer items-center space-x-2">
      <input type="checkbox" className="text-primary-600 focus:ring-primary-500 rounded border-gray-300" {...rest} />
      {Icon && <Icon className={cn('h-4 w-4', icon?.className)} />}
      <span className={cn('text-sm text-gray-700', label.className)}>{label.name}</span>
    </label>
  );
}
