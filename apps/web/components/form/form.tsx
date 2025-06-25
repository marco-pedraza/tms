interface FormProps extends Omit<React.ComponentProps<'form'>, 'onSubmit'> {
  onSubmit: () => Promise<void>;
}

export default function Form({ children, onSubmit, ...formProps }: FormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSubmit();
      }}
      {...formProps}
    >
      {children}
    </form>
  );
}
