import {
  OnChangeFn,
  PaginationState,
  SortingState,
} from '@tanstack/react-table';
import type { TableUrlState } from '@/hooks/use-table-url-state';

interface ServerTableEventsProps<SortFields extends object> {
  paginationUrlState: TableUrlState<SortFields>['pagination'];
  sortingUrlState: TableUrlState<SortFields>['sorting'];
  setPaginationUrlState: (
    paginationUrlState: TableUrlState<SortFields>['pagination'],
  ) => void;
  setSortingUrlState: (
    sortingUrlState: TableUrlState<SortFields>['sorting'],
  ) => void;
}

export default function useServerTableEvents<SortFields extends object>({
  paginationUrlState,
  sortingUrlState,
  setPaginationUrlState,
  setSortingUrlState,
}: ServerTableEventsProps<SortFields>) {
  const onPaginationChange: OnChangeFn<PaginationState> = (
    paginationUpdater,
  ) => {
    const pagination =
      typeof paginationUpdater === 'function'
        ? paginationUpdater({
            pageIndex: paginationUrlState.page - 1,
            pageSize: paginationUrlState.pageSize,
          })
        : paginationUpdater;
    setPaginationUrlState({
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
    });
  };

  const onSortingChange: OnChangeFn<SortingState> = (sortingUpdater) => {
    const sorting =
      typeof sortingUpdater === 'function'
        ? sortingUpdater(
            sortingUrlState.map((sort) => ({
              id: sort.field.toString(),
              desc: sort.direction === 'desc',
            })),
          )
        : sortingUpdater;
    setSortingUrlState(
      sorting.reduce(
        (acc, curr) => {
          acc.push({
            field: curr.id as keyof SortFields,
            direction: curr.desc ? 'desc' : 'asc',
          });
          return acc;
        },
        [] as TableUrlState<SortFields>['sorting'],
      ),
    );
  };

  return {
    onSortingChange,
    onPaginationChange,
  };
}
