import { cn } from '@/utils/cn';

interface FormProps extends Omit<React.ComponentProps<'form'>, 'onSubmit'> {
  onSubmit: () => Promise<void> | void;
}

export default function Form({
  children,
  onSubmit,
  className,
  ...formProps
}: FormProps) {
  return (
    <form
      {...formProps}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSubmit();
      }}
      className={cn('max-w-2xl mx-auto w-full', className)}
    >
      {children}
    </form>
  );
}
