'use client';

import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import DepartmentNotFound from '../components/department-not-found';

export default function DepartmentDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isValidId } = useCollectionItemDetailsParams();

  if (!isValidId) {
    return <DepartmentNotFound />;
  }

  return <>{children}</>;
}
