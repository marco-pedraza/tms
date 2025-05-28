import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { SortBy } from '@/types/sort-by';

export type UrlState = {
  page: number;
  page_size: number;
  search: string;
  sorting: string;
  filters: string;
};

export type TableUrlState<SortFields extends object> = {
  pagination: {
    page: number;
    pageSize: number;
  };
  sorting: SortBy<SortFields>;
  filters: {
    [key: string]: string | number;
  };
  search: string;
};

/**
 * Example url state:
 *
 * const exampleUrlState: UrlState = {
 *   page: 1,
 *   page_size: 10,
 *   sorting: 'code:asc,name:desc',
 *   filters: 'country:12',
 *   search: '',
 * };
 */

const mapUrlStateToTableUrlState = <SortFields extends object>(
  urlState: UrlState,
): TableUrlState<SortFields> => {
  const pagination: TableUrlState<SortFields>['pagination'] = {
    page: Number(urlState.page),
    pageSize: Number(urlState.page_size),
  };
  const sorting: TableUrlState<SortFields>['sorting'] = [];
  const filters: TableUrlState<SortFields>['filters'] = {};
  const sortingKeys = urlState.sorting.split(',');
  const filtersKeys = urlState.filters.split(',');
  sortingKeys.forEach((key) => {
    const [field, order] = key.split(':');
    if (field) {
      sorting.push({
        field: field as keyof SortFields,
        direction: order as 'asc' | 'desc',
      });
    }
  });
  filtersKeys.forEach((key) => {
    const [field, value] = key.split(':');
    if (field) {
      filters[field] = value as string | number;
    }
  });

  return {
    pagination,
    sorting,
    filters,
    search: urlState.search as string,
  };
};

const mapTableUrlStateToUrlState = <SortFields extends object>(
  tableUrlState: TableUrlState<SortFields>,
): UrlState => {
  const sorting = tableUrlState.sorting
    .map((sort) => `${sort.field.toString()}:${sort.direction}`)
    .join(',');
  const filters = Object.entries(tableUrlState.filters)
    .map(([key, value]) => `${key}:${value}`)
    .join(',');
  const urlState: UrlState = {
    page: tableUrlState.pagination.page,
    page_size: tableUrlState.pagination.pageSize,
    search: tableUrlState.search,
    sorting,
    filters,
  };
  return urlState;
};

interface UseTableUrlStateResult<SortFields extends object> {
  paginationUrlState: TableUrlState<SortFields>['pagination'];
  setPaginationUrlState: (
    paginationUrlState: TableUrlState<SortFields>['pagination'],
  ) => void;
  sortingUrlState: TableUrlState<SortFields>['sorting'];
  setSortingUrlState: (
    sortingUrlState: TableUrlState<SortFields>['sorting'],
  ) => void;
  filtersUrlState: TableUrlState<SortFields>['filters'];
  setFiltersUrlState: (
    filtersUrlState: TableUrlState<SortFields>['filters'],
  ) => void;
}

export default function useTableUrlState<
  SortFields extends object,
>(): UseTableUrlStateResult<SortFields> {
  const [urlState, setUrl] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    page_size: parseAsInteger.withDefault(10),
    search: parseAsString.withDefault(''),
    sorting: parseAsString.withDefault(''),
    filters: parseAsString.withDefault(''),
  });
  const tableUrlState = mapUrlStateToTableUrlState(urlState);

  const setPaginationUrlState = (
    paginationUrlState: TableUrlState<SortFields>['pagination'],
  ) => {
    setUrl(
      mapTableUrlStateToUrlState({
        ...tableUrlState,
        pagination: paginationUrlState,
      }),
    );
  };

  const setSortingUrlState = (
    sortingUrlState: TableUrlState<SortFields>['sorting'],
  ) => {
    const newUrlState = mapTableUrlStateToUrlState({
      ...tableUrlState,
      sorting: sortingUrlState,
    });
    setUrl(newUrlState);
  };

  const setFiltersUrlState = (
    filtersUrlState: TableUrlState<SortFields>['filters'],
  ) => {
    setUrl(
      mapTableUrlStateToUrlState({
        ...tableUrlState,
        filters: filtersUrlState,
      }),
    );
  };

  return {
    paginationUrlState: tableUrlState.pagination,
    setPaginationUrlState,
    sortingUrlState: tableUrlState.sorting,
    setSortingUrlState,
    filtersUrlState: tableUrlState.filters,
    setFiltersUrlState,
  };
}
