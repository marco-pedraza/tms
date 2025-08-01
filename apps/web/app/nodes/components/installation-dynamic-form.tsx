'use client';

import { useTranslations } from 'next-intl';
import FormLayout from '@/components/form/form-layout';
import DynamicFormField from '@/nodes/components/dynamic-form-field';
import { type InstallationSchema } from '@/types/installation-schemas';

interface InstallationDynamicFormProps {
  schemas: InstallationSchema[];
  submitButtonText?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
}

/**
 * Dynamic form component that renders fields based on installation type schema
 */
export default function InstallationDynamicForm({
  schemas,
  form,
}: InstallationDynamicFormProps) {
  const tNodes = useTranslations('nodes');
  return (
    <FormLayout title={tNodes('form.sections.customAttributes')}>
      <div className="space-y-6">
        {schemas.map((schema) => (
          <DynamicFormField key={schema.id} schema={schema} form={form} />
        ))}
      </div>
    </FormLayout>
  );
}
