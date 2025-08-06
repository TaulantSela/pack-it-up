import { IconI, LabelI } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface BaseFormFieldProps {
  withFormField?: boolean;
  icon?: IconI;
  label?: LabelI;
  className?: string;
}

export interface FormFieldProps extends BaseFormFieldProps {
  children: ReactNode;
}

export default function FormField({ icon, label, className, withFormField = true, children }: FormFieldProps) {
  const Icon = icon?.name;

  return withFormField ? (
    <div className={cn(className)}>
      {(Icon || label) && (
        <label className={cn('mb-2 block text-sm font-medium text-gray-700', label?.className)}>
          {Icon && <Icon className={cn('mr-2 inline h-4 w-4', icon?.className)} />}
          {label?.name}
        </label>
      )}
      {children}
    </div>
  ) : (
    children
  );
}
