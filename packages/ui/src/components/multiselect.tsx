import {
  type ComponentType,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { Chip } from './chip';
import { Text } from './text';

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  className?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  leftIcon?: ComponentType<{ className?: string }>;
  label?: string;
  staticLabel?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  feedback?: string;
}

/**
 * MultiSelect component for selecting multiple options with chips display
 */
function MultiSelect({
  className,
  options,
  value,
  onChange,
  placeholder,
  disabled,
  leftIcon: LeftIcon,
  label,
  staticLabel = false,
  searchable = false,
  searchPlaceholder = 'Buscar...',
  feedback,
  ...props
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Calculate if floating label should be visible (no state needed)
  const shouldShowFloatingLabel =
    label && (staticLabel || isOpen || value.length > 0);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      if (searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, searchable]);

  function handleOptionClick(optionValue: string) {
    const newValues = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValues);
  }

  function handleClear() {
    onChange([]);
  }

  function handleRemoveValue(valueToRemove: string) {
    const newValues = value.filter((v) => v !== valueToRemove);
    onChange(newValues);
  }

  function toggleDropdown() {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (isOpen) {
        setSearchQuery('');
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleDropdown();
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }

  const selectedOptions = options.filter((option) =>
    value.includes(option.value),
  );
  const hasSelection = value.length > 0;

  const filteredOptions =
    searchable && searchQuery
      ? options.filter((option) =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : options;

  const floatingLabelElement = label && (
    <label
      className={cn(
        'absolute -top-3 left-3 bg-white px-1 text-sm font-medium transition-all duration-200',
        disabled ? 'text-gray-400' : 'text-gray-500',
        shouldShowFloatingLabel ? 'opacity-100' : 'opacity-0',
      )}
    >
      {label}
    </label>
  );

  return (
    <div
      ref={selectRef}
      className={cn('relative w-full', className)}
      {...props}
    >
      {floatingLabelElement}
      <div
        className={cn(
          'flex items-center justify-between border border-gray-100 rounded-lg shadow-md focus:!outline-none focus:!ring-0 focus:!border-accent text-sm text-gray-600 cursor-pointer',
          'px-3 py-2 min-h-[36px]',
          LeftIcon && 'pl-10',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {LeftIcon && (
          <div className="absolute left-3 flex h-4 w-4 items-center justify-center text-gray-300">
            <LeftIcon className="h-4 w-4" />
          </div>
        )}

        <div className="flex-1 pr-2 flex items-center gap-2">
          <Text variant="sm" italic textColor="gray400">
            {placeholder}
          </Text>
          {selectedOptions.length > 0 && (
            <div className="flex items-center justify-center bg-gray-100 rounded-full px-2 py-1 text-sm text-gray-700 min-w-[20px] h-5">
              {selectedOptions.length}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <div
            className={cn(
              'transition-all duration-200 overflow-hidden',
              hasSelection ? 'w-4 opacity-100' : 'w-0 opacity-0',
            )}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="flex h-4 w-4 items-center justify-center rounded-sm text-gray-400 hover:text-gray-600 transition-colors duration-150"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ChevronDown
            className={cn(
              'h-4 w-4 text-gray-400 transition-transform duration-200',
              isOpen && 'rotate-180',
            )}
          />
        </div>
      </div>

      {/* Chips section for multiple select */}
      {selectedOptions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selectedOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              variant="accent"
              onRemove={() => handleRemoveValue(option.value)}
            />
          ))}
        </div>
      )}

      <div
        className={cn(
          'absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-200',
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible',
        )}
      >
        {searchable && (
          <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              />
            </div>
          </div>
        )}
        <div className="max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                className={cn(
                  'px-3 py-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors duration-150 flex items-center justify-between',
                  value.includes(option.value) && 'bg-accent/10 font-medium',
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOptionClick(option.value);
                }}
              >
                <Text variant="sm">{option.label}</Text>
                {value.includes(option.value) && (
                  <div className="flex h-4 w-4 items-center justify-center rounded-sm text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors duration-150">
                    <X className="h-3.5 w-3.5 stroke-2" />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-3 py-6 text-center">
              <Text variant="sm" textColor="gray400">
                No se encontraron resultados
              </Text>
            </div>
          )}
        </div>
      </div>
      {feedback && (
        <Text variant="sm" italic textColor="destructive" className="mt-2">
          * {feedback}
        </Text>
      )}
    </div>
  );
}

export { MultiSelect };
