import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFormContext } from '@/context/form-context';

interface SubmitButtonProps {
  children: React.ReactNode;
}

export default function SubmitButton({ children }: SubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]: [boolean, boolean]) => (
        <Button type="submit" disabled={!canSubmit || isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {children}
        </Button>
      )}
    </form.Subscribe>
  );
}
