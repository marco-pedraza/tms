export type SortBy<Fields extends object> = {
  field: keyof Fields;
  direction: 'asc' | 'desc';
}[];
