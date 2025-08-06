'use client';

import { cn } from '@/lib/utils';
import { ComponentPropsWithRef } from 'react';

type ButtonVariant = 'default' | 'primary';

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant;
}

export default function Button({ type = 'button', variant = 'default', className, ...rest }: ButtonProps) {
  return <button type={type} className={cn(className)} {...rest} />;
}
