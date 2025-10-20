'use client';

import Link from 'next/link';
import { ShieldX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Access denied page with modern design following project standards
 *
 * Uses the project's design system with proper color tokens and components
 * instead of hardcoded colors like red and blue
 */
export default function AccessDeniedPage() {
  const tAuth = useTranslations('auth');

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-lg pt-20">
        <Card className="text-center">
          <CardHeader className="pb-6">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <ShieldX className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle className="text-3xl font-semibold text-foreground">
              {tAuth('accessDenied.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <p className="text-lg text-muted-foreground leading-relaxed">
              {tAuth('accessDenied.message')}
            </p>

            <Button asChild variant="default" size="lg" className="w-full">
              <Link href="/">{tAuth('accessDenied.goHome')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
