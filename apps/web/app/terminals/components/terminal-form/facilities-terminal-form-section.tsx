import { useTranslations } from 'next-intl';
import type { facilities } from '@repo/ims-client';
import FormLayout from '@/components/form/form-layout';
import { CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { withForm } from '@/hooks/use-form';
import useQueryAllFacilities from '../../hooks/use-query-all-facilities';
import terminalFormOptions from './terminal-form-options';

export default withForm({
  ...terminalFormOptions,
  render: function FacilitiesTerminalFormSection({ form }) {
    const tTerminals = useTranslations('terminals');
    const { data: facilities } = useQueryAllFacilities();

    return (
      <FormLayout title={tTerminals('fields.facilities')}>
        <CardContent>
          <form.Field name="facilities">
            {/** @ts-expect-error - field not inferred correctly because of an issue with tanstack-form */}
            {(field) => (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {facilities?.facilities?.map((facility) => {
                  const isChecked = (field.state.value || []).some(
                    (f: facilities.Facility) => f.name === facility.name,
                  );
                  return (
                    <div
                      key={facility.name}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={facility.name}
                        checked={isChecked}
                        onCheckedChange={(checked: boolean) => {
                          let newFacilities = [...(field.state.value || [])];
                          if (checked === true && !isChecked) {
                            newFacilities.push(facility);
                          } else if (checked === false && isChecked) {
                            newFacilities = newFacilities.filter(
                              (f) => f.name !== facility.name,
                            );
                          }
                          field.handleChange(newFacilities);
                        }}
                      />
                      <Label htmlFor={facility.name}>{facility.name}</Label>
                    </div>
                  );
                })}
              </div>
            )}
          </form.Field>
        </CardContent>
      </FormLayout>
    );
  },
});
