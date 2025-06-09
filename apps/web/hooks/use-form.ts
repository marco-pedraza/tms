import { createFormHook } from '@tanstack/react-form';
import SelectInput from '@/components/form/select-input';
import SubmitButton from '@/components/form/submit-button';
import SwitchInput from '@/components/form/switch-input';
import TextAreaInput from '@/components/form/text-area-input';
import TextInput from '@/components/form/text-input';
import TimeSelectInput from '@/components/form/time-select-input';
import { fieldContext, formContext } from '@/context/form-context';

const { useAppForm: useForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextInput,
    SwitchInput,
    TextAreaInput,
    SelectInput,
    TimeSelectInput,
  },
  formComponents: {
    SubmitButton,
  },
});

export { withForm };
export default useForm;
