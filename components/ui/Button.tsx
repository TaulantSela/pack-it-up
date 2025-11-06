'use client';

import { cn } from '@/lib/utils';
import { ComponentPropsWithRef } from 'react';

export type ButtonProps = ComponentPropsWithRef<'button'>;

export default function Button({ type = 'button', className, ...rest }: ButtonProps) {
  return <button type={type} className={cn(className)} {...rest} />;
}
