import { OnChangeFn, SortingState } from '@tanstack/react-table';
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
  totalPagesCount: number;
}

export default function useServerTableEvents<SortFields extends object>({
  paginationUrlState,
  sortingUrlState,
  setPaginationUrlState,
  setSortingUrlState,
  totalPagesCount,
}: ServerTableEventsProps<SortFields>) {
  const onPreviousPage = () => {
    setPaginationUrlState({
      page: paginationUrlState.page - 1,
      pageSize: paginationUrlState.pageSize,
    });
  };

  const onNextPage = () => {
    setPaginationUrlState({
      page: paginationUrlState.page + 1,
      pageSize: paginationUrlState.pageSize,
    });
  };

  const onLastPage = () => {
    setPaginationUrlState({
      page: totalPagesCount === 0 ? 1 : totalPagesCount,
      pageSize: paginationUrlState.pageSize,
    });
  };

  const onFirstPage = () => {
    setPaginationUrlState({
      page: 1,
      pageSize: paginationUrlState.pageSize,
    });
  };

  const setPageSize = (pageSize: number) => {
    setPaginationUrlState({
      page: paginationUrlState.page,
      pageSize,
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
    onPreviousPage,
    onNextPage,
    onLastPage,
    onFirstPage,
    setPageSize,
    onSortingChange,
  };
}
