import { Search } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '@/components/ui/input';

interface SearchFieldProps {
  initialValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchField({
  initialValue,
  onChange,
  placeholder,
}: SearchFieldProps) {
  const debouncedOnChange = useDebouncedCallback((value: string) => {
    onChange(value);
  }, 800);

  return (
    <div className="relative flex-1 max-w-xs">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        className="pl-8"
        defaultValue={initialValue}
        onChange={(e) => debouncedOnChange(e.target.value)}
      />
    </div>
  );
}
