import React, {
  ComponentType,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

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
  ...props
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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

  return (
    <div
      ref={selectRef}
      className={cn('relative w-full mb-2', className)}
      {...props}
    >
      {label && (
        <label className="absolute -top-3 left-3 bg-white px-1 text-sm text-gray-500 font-medium">
          {label}
        </label>
      )}
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
          <span className="text-gray-400 italic text-sm">{placeholder}</span>
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
            <div
              key={option.value}
              className="flex items-center gap-1 bg-accent/15 rounded-md px-2 py-1 text-sm text-gray-600"
            >
              <span>{option.label}</span>
              <button
                type="button"
                onClick={() => handleRemoveValue(option.value)}
                className="flex h-4 w-4 items-center justify-center rounded-sm text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors duration-150 cursor-pointer"
              >
                <X className="h-4 w-4 stroke-2" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        className={cn(
          'absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto transition-all duration-200',
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible',
        )}
      >
        {options.map((option) => (
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
            <span>{option.label}</span>
            {value.includes(option.value) && (
              <div className="flex h-4 w-4 items-center justify-center rounded-sm text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors duration-150">
                <X className="h-3.5 w-3.5 stroke-2" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export { MultiSelect };
