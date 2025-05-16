import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FormLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function FormLayout({ children, title }: FormLayoutProps) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  );
}
