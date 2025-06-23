import { useTranslations } from 'next-intl';
import type { cities } from '@repo/ims-client';
import useQueryAllCities from '@/cities/hooks/use-query-all-cities';
import FormLayout from '@/components/form/form-layout';
import { withForm } from '@/hooks/use-form';
import terminalFormOptions from './terminal-form-options';

export default withForm({
  ...terminalFormOptions,
  render: function BasicInfoTerminalFormSection({ form }) {
    const tTerminals = useTranslations('terminals');
    const tCommon = useTranslations('common');
    const { data: citiesData } = useQueryAllCities();

    return (
      <FormLayout title={tTerminals('form.basicInfo')}>
        {/* Name */}
        <form.AppField name="name">
          {/** @ts-expect-error - field not inferred correctly because of an issue with tanstack-form */}
          {(field) => (
            <field.TextInput
              label={tCommon('fields.name')}
              placeholder={tTerminals('form.placeholders.name')}
            />
          )}
        </form.AppField>

        {/* Code */}
        <div className="space-y-2">
          <form.AppField name="code">
            {/** @ts-expect-error - field not inferred correctly because of an issue with tanstack-form */}
            {(field) => (
              <field.TextInput
                label={tCommon('fields.code')}
                placeholder={tTerminals('form.placeholders.code')}
              />
            )}
          </form.AppField>
          <p className="text-sm text-muted-foreground">
            {tTerminals('form.helpText.code')}
          </p>
        </div>

        {/* Address */}
        <form.AppField name="address">
          {/** @ts-expect-error - field not inferred correctly because of an issue with tanstack-form */}
          {(field) => (
            <field.TextAreaInput
              label={tTerminals('fields.address')}
              placeholder={tTerminals('form.placeholders.address')}
            />
          )}
        </form.AppField>

        {/* Contact */}
        <form.AppField name="contactPhone">
          {/** @ts-expect-error - field not inferred correctly because of an issue with tanstack-form */}
          {(field) => (
            <field.TextInput
              label={tTerminals('fields.contactPhone')}
              placeholder={tTerminals('form.placeholders.contactPhone')}
            />
          )}
        </form.AppField>

        {/* City */}
        <form.AppField name="cityId">
          {/** @ts-expect-error - field not inferred correctly because of an issue with tanstack-form */}
          {(field) => (
            <field.SelectInput
              label={tTerminals('fields.city')}
              placeholder={tTerminals('form.placeholders.city')}
              items={
                citiesData?.data.map((city: cities.City) => ({
                  id: city.id.toString(),
                  name: city.name,
                })) ?? []
              }
            />
          )}
        </form.AppField>

        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-4">
          <form.AppField name="latitude">
            {/** @ts-expect-error - field not inferred correctly because of an issue with tanstack-form */}
            {(field) => (
              <field.TextInput
                label={tCommon('fields.latitude')}
                placeholder="e.g. 19.4326"
                inputMode="decimal"
              />
            )}
          </form.AppField>

          <form.AppField name="longitude">
            {/** @ts-expect-error - field not inferred correctly because of an issue with tanstack-form */}
            {(field) => (
              <field.TextInput
                label={tCommon('fields.longitude')}
                placeholder="e.g. -99.1332"
                inputMode="decimal"
              />
            )}
          </form.AppField>
        </div>

        {/* Active Status */}
        <form.AppField name="active">
          {/** @ts-expect-error - field not inferred correctly because of an issue with tanstack-form */}
          {(field) => <field.SwitchInput label={tCommon('fields.active')} />}
        </form.AppField>
      </FormLayout>
    );
  },
});
