'use client';

import { cn } from '@/lib/utils';
import { ComponentPropsWithRef } from 'react';
import FormField, { BaseFormFieldProps } from './form-field';

export type OptionProps = {
  value: string;
  label?: string;
  disabled?: boolean;
};

export interface SelectProps extends ComponentPropsWithRef<'select'>, BaseFormFieldProps {
  options: string[];
  placeholder?: string;
  error?: boolean;
  wrapperClassName?: string;
}

export default function Input({
  icon,
  label,
  className,
  options,
  placeholder,
  wrapperClassName,
  withFormField = true,
  ...rest
}: SelectProps) {
  return (
    <FormField icon={icon} label={label} className={cn(wrapperClassName)} withFormField={withFormField}>
      <select className={cn('input-field', className)} {...rest}>
        {!!placeholder && <option value="">{placeholder}</option>}
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </option>
        ))}
      </select>
    </FormField>
  );
}
