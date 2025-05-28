import FilterSelect, {
  FilterSelectOption,
  FilterSelectProps,
} from './filter-select';
import SearchField from './search-field';

export interface FilterConfig
  extends Omit<FilterSelectProps, 'onChange' | 'selectedValue'> {
  key: string;
}

interface DataTableHeaderProps {
  initialSearchValue: string;
  onSearchChange?: (value: string) => void;
  filtersConfig: FilterConfig[];
  filtersState: Record<string, FilterSelectOption['value']>;
  onFiltersChange: (value: Record<string, FilterSelectOption['value']>) => void;
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
      const newFilters = { ...filtersState, [key]: value };
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
      {filtersConfig.map((filter) => (
        <FilterSelect
          key={filter.key}
          name={filter.name}
          options={filter.options}
          selectedValue={filtersState[filter.key] ?? ''}
          onChange={(value) => onChange(filter.key, value)}
        />
      ))}
    </div>
  );
}
