interface FormFooterProps {
  children: React.ReactNode;
}

export default function FormFooter({ children }: FormFooterProps) {
  return <div className="flex justify-end space-x-2 pt-4">{children}</div>;
}
