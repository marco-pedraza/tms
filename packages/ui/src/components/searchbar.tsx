import { type ChangeEvent, type KeyboardEvent, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

export interface SearchBarProps {
  className?: string;
  placeholder?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSearch?: (value: string) => void;
  disabled?: boolean;
  label?: string;
  staticLabel?: boolean;
}

/**
 * SearchBar component with input field and search icon
 */
function SearchBar({
  className,
  placeholder,
  value,
  onChange,
  onSearch,
  disabled,
  label,
  staticLabel = false,
  ...props
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Calculate if floating label should be visible (no state needed)
  const shouldShowFloatingLabel =
    label && (staticLabel || isFocused || value.length > 0);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e);
  };

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      onSearch?.(value);
    }
  }

  function handleSearchClick() {
    onSearch?.(value);
  }

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
      className={cn(
        'relative flex items-center',
        label ? 'mb-2' : '',
        className,
      )}
      {...props}
    >
      {floatingLabelElement}
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="w-full h-10 px-3 pr-10 border border-gray-100 rounded-lg shadow-md placeholder:text-gray-400 placeholder:text-sm placeholder:italic focus:outline-none focus:ring-0 focus:border-accent text-sm text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <button
        type="button"
        onClick={handleSearchClick}
        disabled={disabled}
        className="absolute right-2 flex h-6 w-6 items-center justify-center rounded-sm text-gray-300 hover:text-primary disabled:pointer-events-none disabled:opacity-50"
      >
        <Search className="h-4 w-4" />
      </button>
    </div>
  );
}

export { SearchBar };
