'use client';

import { useCallback, useMemo, useState } from 'react';
import { Check, ChevronsUpDown, icons } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import DynamicLucideIcon from '@/components/ui/dynamic-lucide-icon';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/utils/cn';

/**
 * Convert PascalCase to kebab-case for icon names
 * @example "AirVent" -> "air-vent", "Wifi" -> "wifi"
 */
function pascalToKebabCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

// Cache for all available Lucide icon names in kebab-case format
let cachedLucideIcons: string[] | null = null;

/**
 * Get all available Lucide icon names in kebab-case format
 * Uses caching to avoid recomputing the list on every call
 */
function getAllLucideIcons(): string[] {
  if (cachedLucideIcons === null) {
    // Compute once and cache the result
    cachedLucideIcons = Object.freeze(
      Object.keys(icons).map(pascalToKebabCase).sort(),
    ) as string[];
  }
  return cachedLucideIcons;
}

// Popular amenity icons for prioritized display
const POPULAR_AMENITY_ICONS = [
  'accessibility',
  'air-vent',
  'armchair',
  'bath',
  'battery',
  'bluetooth',
  'camera',
  'clock',
  'coffee',
  'credit-card',
  'eye',
  'globe',
  'headphones',
  'heart',
  'info',
  'lamp',
  'lock',
  'mail',
  'map-pin',
  'martini',
  'package',
  'phone',
  'settings',
  'shield',
  'star',
  'sun',
  'thermometer',
  'tv',
  'usb',
  'users',
  'video',
  'wifi',
  'zap',
] as const;

interface IconSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Icon selector component using shadcn/ui Combobox pattern
 *
 * Provides a searchable dropdown of all available Lucide icons with preview functionality.
 * Popular icons are shown first for better UX. Uses lazy loading for performance.
 */
export default function IconSelector({
  value,
  onValueChange,
  placeholder,
  className,
}: IconSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllIcons, setShowAllIcons] = useState(false);
  const tCommon = useTranslations('common');

  // Popular icons are always available
  const popularIcons = useMemo(() => [...POPULAR_AMENITY_ICONS], []);

  // Lazy load all icons only when needed
  const allIcons = useMemo(() => {
    if (!showAllIcons && !searchQuery) return [];
    return getAllLucideIcons();
  }, [showAllIcons, searchQuery]);

  // Filter icons based on search query
  const filteredPopularIcons = useMemo(() => {
    if (!searchQuery) return popularIcons;
    return popularIcons.filter((icon) =>
      icon.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [popularIcons, searchQuery]);

  const filteredOtherIcons = useMemo(() => {
    if (!searchQuery && !showAllIcons) return [];

    const otherIcons = allIcons.filter(
      (icon) =>
        !popularIcons.includes(icon as (typeof POPULAR_AMENITY_ICONS)[number]),
    );

    if (!searchQuery) return otherIcons.slice(0, 50); // Limit initial render

    return otherIcons.filter((icon) =>
      icon.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [allIcons, popularIcons, searchQuery, showAllIcons]);

  // Handle search input changes
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (query && !showAllIcons) {
        setShowAllIcons(true);
      }
    },
    [showAllIcons],
  );

  // Load more icons when user scrolls or clicks "Show More"
  const handleShowMore = useCallback(() => {
    setShowAllIcons(true);
  }, []);

  // Reset state when popover closes for better performance
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchQuery('');
      setShowAllIcons(false);
    }
  }, []);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <div className="flex items-center gap-2">
            {value ? (
              <>
                <DynamicLucideIcon name={value} className="h-4 w-4" />
                <span>{value}</span>
              </>
            ) : (
              <span>{placeholder ?? tCommon('iconSelector.selectIcon')}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={tCommon('iconSelector.searchPlaceholder')}
            className="h-9"
            onValueChange={handleSearch}
          />
          <CommandList>
            <CommandEmpty>{tCommon('table.not_results')}</CommandEmpty>

            {/* Popular Icons Group */}
            {filteredPopularIcons.length > 0 && (
              <CommandGroup heading={tCommon('iconSelector.popularIcons')}>
                {filteredPopularIcons.map((icon) => (
                  <CommandItem
                    key={`popular-${icon}`}
                    value={icon}
                    onSelect={(currentValue: string) => {
                      onValueChange(currentValue === value ? '' : currentValue);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <DynamicLucideIcon name={icon} className="h-4 w-4" />
                      <span>{icon}</span>
                    </div>
                    <Check
                      className={cn(
                        'h-4 w-4',
                        value === icon ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* All Other Icons Group */}
            {filteredOtherIcons.length > 0 && (
              <CommandGroup heading={tCommon('iconSelector.allIcons')}>
                {filteredOtherIcons.map((icon) => (
                  <CommandItem
                    key={`other-${icon}`}
                    value={icon}
                    onSelect={(currentValue: string) => {
                      onValueChange(currentValue === value ? '' : currentValue);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <DynamicLucideIcon name={icon} className="h-4 w-4" />
                      <span>{icon}</span>
                    </div>
                    <Check
                      className={cn(
                        'h-4 w-4',
                        value === icon ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Show More Button */}
            {!showAllIcons && !searchQuery && (
              <CommandGroup>
                <CommandItem
                  onSelect={handleShowMore}
                  className="justify-center text-muted-foreground hover:text-foreground"
                >
                  <span>{tCommon('iconSelector.showMore')}</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
