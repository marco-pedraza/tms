interface FormProps
  extends Omit<React.ComponentProps<'form'>, 'onSubmit' | 'className'> {
  onSubmit: () => Promise<void>;
}

export default function Form({ children, onSubmit, ...formProps }: FormProps) {
  return (
    <form
      {...formProps}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSubmit();
      }}
      className="max-w-2xl mx-auto w-full"
    >
      {children}
    </form>
  );
}
