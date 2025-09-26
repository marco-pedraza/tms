import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils/cn';

interface FormLayoutProps {
  children: React.ReactNode;
  title: string;
  className?: string;
}

export default function FormLayout({
  children,
  title,
  className,
}: FormLayoutProps) {
  return (
    <Card className={cn('max-w-2xl mx-auto', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  );
}
