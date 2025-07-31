import FilterSelect, {
  FilterSelectOption,
  FilterSelectProps,
} from './filter-select';
import SearchField from './search-field';

export interface FilterConfig
  extends Omit<FilterSelectProps, 'onChange' | 'selectedValue'> {
  key: string;
  /** If true, the filter value will be sent as an array even for single selections */
  multipleValues?: boolean;
}

interface DataTableHeaderProps {
  initialSearchValue: string;
  onSearchChange?: (value: string) => void;
  filtersConfig: FilterConfig[];
  filtersState: Record<
    string,
    FilterSelectOption['value'] | FilterSelectOption['value'][]
  >;
  onFiltersChange: (
    value: Record<
      string,
      FilterSelectOption['value'] | FilterSelectOption['value'][]
    >,
  ) => void;
}

export default function DataTableHeader({
  initialSearchValue,
  onSearchChange,
  filtersConfig,
  filtersState,
  onFiltersChange,
}: DataTableHeaderProps) {
  const onChange = (key: string, value: FilterSelectOption['value']) => {
    if (value || value === false) {
      const newFilters: Record<
        string,
        FilterSelectOption['value'] | FilterSelectOption['value'][]
      > = { ...filtersState };
      // Find the filter configuration to check if it should handle multiple values
      const filterConfig = filtersConfig.find((config) => config.key === key);

      if (filterConfig?.multipleValues) {
        newFilters[key] = [value];
      } else {
        newFilters[key] = value;
      }
      onFiltersChange(newFilters);
    } else {
      /**
       * Remove empty filter from state.
       * We need to disable the eslint rule because we are using the destructuring assignment
       * to remove the key from the object.
       */
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [key]: _, ...rest } = filtersState;
      onFiltersChange(rest);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {onSearchChange && (
        <SearchField
          initialValue={initialSearchValue}
          onChange={onSearchChange}
          placeholder="Buscar"
        />
      )}
      {filtersConfig.map((filter) => {
        // Handle multiple values - get first value for display
        const filterValue = filtersState[filter.key];
        const selectedValue: FilterSelectOption['value'] =
          filter.multipleValues && Array.isArray(filterValue)
            ? (filterValue[0] ?? '')
            : ((filterValue as FilterSelectOption['value']) ?? '');

        return (
          <FilterSelect
            key={filter.key}
            name={filter.name}
            options={filter.options}
            selectedValue={selectedValue}
            onChange={(value) => {
              onChange(filter.key, value);
            }}
          />
        );
      })}
    </div>
  );
}
