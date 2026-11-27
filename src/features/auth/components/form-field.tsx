import type { ComponentProps } from 'react';
import { Field, FieldLabel } from '@/platform/ui/field';
import { Input } from '@/platform/ui/input';

export function FormField({ label, name, ...input }: ComponentProps<'input'> & { label: string, name: string }) {
  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input id={name} name={name} required {...input} />
    </Field>
  );
}
