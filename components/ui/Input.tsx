'use client';

import { cn } from '@/lib/utils';
import { ComponentPropsWithRef } from 'react';
import FormField, { BaseFormFieldProps } from './form-field';

// Input component should be used only for the folloring input types
export type InputType = 'text' | 'email' | 'password' | 'tel' | 'number' | 'file';

export interface InputProps extends ComponentPropsWithRef<'input'>, BaseFormFieldProps {
  error?: boolean;
  type?: InputType;
  wrapperClassName?: string;
}

export default function Input({
  icon,
  type = 'text',
  label,
  className,
  wrapperClassName,
  withFormField = true,
  ...rest
}: InputProps) {
  return (
    <FormField icon={icon} label={label} className={cn(wrapperClassName)} withFormField={withFormField}>
      <input type={type} className={cn('input-field', className)} {...rest} />
    </FormField>
  );
}
