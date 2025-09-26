import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, departments } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

export default function useQueryAllDepartments(): UseQueryResult<
  departments.Departments,
  APIError
> {
  return useQuery<departments.Departments, APIError>({
    queryKey: ['allDepartments'],
    queryFn: () =>
      imsClient.users.listDepartments({
        // orderBy: [
        //   {
        //     field: 'name',
        //     direction: 'asc',
        //   },
        // ],
        // filters: {
        //   active: true,
        // },
      }),
  });
}
