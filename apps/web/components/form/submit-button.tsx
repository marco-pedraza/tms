import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFormContext } from '@/context/form-context';

interface SubmitButtonProps {
  children: React.ReactNode;
}

export default function SubmitButton({ children }: SubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe
      // @ts-expect-error - Form library expects FormState return but we need array destructuring pattern
      selector={(state) => [state.canSubmit, state.isSubmitting]}
    >
      {/* @ts-expect-error - Form library expects FormState parameter but we use array destructuring */}
      {([canSubmit, isSubmitting]: [boolean, boolean]) => (
        <Button type="submit" disabled={!canSubmit || isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {children}
        </Button>
      )}
    </form.Subscribe>
  );
}
