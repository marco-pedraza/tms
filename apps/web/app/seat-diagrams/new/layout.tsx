import { Suspense } from 'react';

/**
 * Layout component for new seat diagram pages
 *
 * Currently, it only wraps the children in a suspense component
 * This is necessary because the new seat diagram page uses Next's useSearchParams hook
 */
export default function NewSeatDiagramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense>{children}</Suspense>;
}
