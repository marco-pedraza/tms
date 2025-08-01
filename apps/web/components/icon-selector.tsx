'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
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

// Popular amenity icons for initial display
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
  'heart',
  'info',
  'lamp',
  'lock',
  'mail',
  'map-pin',
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
 * Provides a searchable dropdown of Lucide icons with preview functionality
 */
export default function IconSelector({
  value,
  onValueChange,
  placeholder,
  className,
}: IconSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const tCommon = useTranslations('common');

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
          />
          <CommandList>
            <CommandEmpty>{tCommon('table.not_results')}</CommandEmpty>
            <CommandGroup>
              {POPULAR_AMENITY_ICONS.map((icon) => (
                <CommandItem
                  key={icon}
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
