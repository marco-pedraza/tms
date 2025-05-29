import { createFormHook } from '@tanstack/react-form';
import SubmitButton from '@/components/form/submit-button';
import SwitchInput from '@/components/form/switch-input';
import TextInput from '@/components/form/text-input';
import { fieldContext, formContext } from '@/context/form-context';

const { useAppForm: useForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextInput,
    SwitchInput,
  },
  formComponents: {
    SubmitButton,
  },
});

export default useForm;
