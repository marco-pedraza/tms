import { useTranslations } from 'next-intl';
import FormLayout from '@/components/form/form-layout';
import { Label } from '@/components/ui/label';
import { withForm } from '@/hooks/use-form';
import { DaysOfWeek, Hours, Minutes } from '@/types/time';
import { cn } from '@/utils/cn';
import terminalFormOptions from './terminal-form-options';

export default withForm({
  ...terminalFormOptions,
  render: function OperatingHoursTerminalFormSection({ form }) {
    const tTerminals = useTranslations('terminals');

    return (
      <FormLayout title={tTerminals('fields.operatingHours')}>
        <div className="space-y-12">
          {Object.values(DaysOfWeek).map((day) => (
            <div
              className="grid grid-cols-[1fr_3fr] gap-4 items-start"
              key={day}
            >
              <Label className="capitalize pt-2">{day}</Label>
              <div className="space-y-4">
                {/* Special state switches */}
                <div className="flex items-center space-x-8">
                  <form.AppField
                    name={`operatingHours.${day}.is24Hours`}
                    listeners={{
                      onChange: ({ value: checked }: { value: boolean }) => {
                        if (checked) {
                          form.setFieldValue(
                            `operatingHours.${day}.isClosed`,
                            false,
                          );
                          form.setFieldValue(`operatingHours.${day}.open`, {
                            hour: Hours._00,
                            minute: Minutes._00,
                          });
                          form.setFieldValue(`operatingHours.${day}.close`, {
                            hour: Hours._23,
                            minute: Minutes._59,
                          });
                        }
                      },
                    }}
                  >
                    {/** @ts-expect-error - field not inferred correctly because of an issue with tanstack-form */}
                    {(field) => (
                      <field.SwitchInput
                        label={tTerminals('operatingHours.open24hours')}
                      />
                    )}
                  </form.AppField>

                  <form.AppField
                    name={`operatingHours.${day}.isClosed`}
                    listeners={{
                      onChange: ({ value: checked }: { value: boolean }) => {
                        if (checked) {
                          form.setFieldValue(
                            `operatingHours.${day}.is24Hours`,
                            false,
                          );
                          form.setFieldValue(`operatingHours.${day}.open`, {
                            hour: Hours._00,
                            minute: Minutes._00,
                          });
                          form.setFieldValue(`operatingHours.${day}.close`, {
                            hour: Hours._00,
                            minute: Minutes._00,
                          });
                        }
                      },
                    }}
                  >
                    {/** @ts-expect-error - field not inferred correctly because of an issue with tanstack-form */}
                    {(field) => (
                      <field.SwitchInput
                        label={tTerminals('operatingHours.closed')}
                      />
                    )}
                  </form.AppField>
                </div>

                {/* Time selectors */}
                <div className={cn('grid grid-cols-2 gap-2')}>
                  <form.Subscribe
                    // @ts-expect-error - field not inferred correctly because of an issue with tanstack-form
                    selector={(state) => [
                      state.values.operatingHours[day].isClosed,
                      state.values.operatingHours[day].is24Hours,
                    ]}
                  >
                    {([isClosed, is24Hours]: [boolean, boolean]) => (
                      <form.AppField name={`operatingHours.${day}.open`}>
                        {/** @ts-expect-error - field not inferred correctly because of an issue with tanstack-form */}
                        {(field) => (
                          <field.TimeSelectInput
                            label={tTerminals('operatingHours.openingTime')}
                            disabled={isClosed || is24Hours}
                          />
                        )}
                      </form.AppField>
                    )}
                  </form.Subscribe>
                  <form.Subscribe
                    // @ts-expect-error - field not inferred correctly because of an issue with tanstack-form
                    selector={(state) => [
                      state.values.operatingHours[day].isClosed,
                      state.values.operatingHours[day].is24Hours,
                    ]}
                  >
                    {([isClosed, is24Hours]: [boolean, boolean]) => (
                      <form.AppField name={`operatingHours.${day}.close`}>
                        {/** @ts-expect-error - field not inferred correctly because of an issue with tanstack-form */}
                        {(field) => (
                          <field.TimeSelectInput
                            label={tTerminals('operatingHours.closingTime')}
                            disabled={isClosed || is24Hours}
                          />
                        )}
                      </form.AppField>
                    )}
                  </form.Subscribe>
                </div>
              </div>
            </div>
          ))}
        </div>
      </FormLayout>
    );
  },
});
