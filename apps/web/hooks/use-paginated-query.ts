import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

interface UsePaginatedQueryProps<T> {
  queryKey: (string | number)[];
  queryFn: (pageIndex: number, pageSize: number) => Promise<T>;
  initialPageIndex?: number;
  initialPageSize?: number;
  getTotalPagesCount: (data: T) => number;
}

const usePaginatedQuery = <T>({
  queryKey,
  queryFn,
  initialPageIndex = 0,
  initialPageSize = 10,
  getTotalPagesCount,
}: UsePaginatedQueryProps<T>) => {
  const [pageIndex, setPageIndex] = useState(initialPageIndex);
  const [pageSize] = useState(initialPageSize);
  const { data, isLoading, error, refetch } = useQuery<T>({
    queryKey: [...queryKey, pageIndex, pageSize],
    queryFn: () => queryFn(pageIndex, pageSize),
    placeholderData: keepPreviousData,
  });

  const onPreviousPage = () => {
    setPageIndex(pageIndex - 1);
  };

  const onNextPage = () => {
    setPageIndex(pageIndex + 1);
  };

  const onLastPage = () => {
    setPageIndex(getTotalPagesCount(data!) - 1);
  };

  const onFirstPage = () => {
    setPageIndex(0);
  };

  return {
    data,
    isLoading,
    error,
    refetch,
    onPreviousPage,
    onNextPage,
    pageIndex,
    pageSize,
    onLastPage,
    onFirstPage,
  };
};

export default usePaginatedQuery;
