import { IconI, LabelI } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { cloneElement, isValidElement, useId } from 'react';

export interface BaseFormFieldProps {
  withFormField?: boolean;
  icon?: IconI;
  label?: LabelI;
  className?: string;
  id?: string;
}

export interface FormFieldProps extends BaseFormFieldProps {
  children: ReactNode;
}

export default function FormField({ icon, label, className, withFormField = true, id, children }: FormFieldProps) {
  const Icon = icon?.name;
  const generatedId = useId();
  const fieldId = id || generatedId;

  // Clone the child element and add the id prop
  const childrenWithId = isValidElement(children)
    ? cloneElement(children as React.ReactElement<any>, { id: fieldId })
    : children;

  return withFormField ? (
    <div className={cn(className)}>
      {(Icon || label) && (
        <label
          htmlFor={fieldId}
          className={cn('mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-100', label?.className)}
        >
          {Icon && <Icon className={cn('mr-2 inline h-4 w-4', icon?.className)} />}
          {label?.name}
        </label>
      )}
      {childrenWithId}
    </div>
  ) : (
    children
  );
}
