'use client';

import { type ComponentProps, useEffect, useRef } from 'react';
import {
  DayButton,
  DayPicker,
  type WeekNumberProps,
  getDefaultClassNames,
} from 'react-day-picker';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

export type CalendarProps = ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'dropdown',
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn(
        'bg-background group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent',
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      formatters={{
        formatMonthDropdown: (date: Date) =>
          date.toLocaleString('default', { month: 'short' }),
        ...props.formatters,
      }}
      classNames={{
        root: cn('w-3xs', defaultClassNames.root),
        months: cn(
          'relative flex flex-col gap-4 md:flex-row',
          defaultClassNames.months,
        ),
        month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
        nav: cn(
          'absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1',
          defaultClassNames.nav,
        ),
        button_previous: cn(
          'h-10 w-10 select-none p-0 aria-disabled:opacity-50 bg-transparent hover:bg-gray-100 flex items-center justify-center',
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          'h-10 w-10 select-none p-0 aria-disabled:opacity-50 bg-transparent hover:bg-gray-100 flex items-center justify-center',
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          'flex h-10 w-full items-center justify-center px-[--cell-size] relative z-10',
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          'flex h-10 w-full items-center justify-center gap-1.5 text-sm font-medium',
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          'has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border',
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn('absolute inset-0 opacity-0', defaultClassNames.dropdown),
        caption_label: cn(
          'select-none font-medium',
          captionLayout === 'label'
            ? 'text-sm'
            : '[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5',
          defaultClassNames.caption_label,
        ),
        table: 'w-full border-collapse',
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-normal',
          defaultClassNames.weekday,
        ),
        week: cn('mt-2 flex w-full', defaultClassNames.week),
        week_number_header: cn(
          'w-[--cell-size] select-none',
          defaultClassNames.week_number_header,
        ),
        week_number: cn(
          'text-muted-foreground select-none text-[0.8rem]',
          defaultClassNames.week_number,
        ),
        day: cn(
          'group/day relative aspect-square h-full w-full select-none p-0 text-center flex items-center justify-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md',
          defaultClassNames.day,
        ),
        range_start: cn(
          'bg-accent rounded-l-md',
          defaultClassNames.range_start,
        ),
        range_middle: cn('rounded-none', defaultClassNames.range_middle),
        range_end: cn('bg-accent rounded-r-md', defaultClassNames.range_end),
        today: cn('border border-accent rounded-sm', defaultClassNames.today),
        outside: cn(
          'text-muted-foreground aria-selected:text-muted-foreground',
          defaultClassNames.outside,
        ),
        disabled: cn(
          'text-muted-foreground opacity-50',
          defaultClassNames.disabled,
        ),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({
          className,
          rootRef,
          ...props
        }: {
          className?: string;
          rootRef?: ComponentProps<'div'>['ref'];
        }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        Chevron: ({
          className,
          orientation,
          ...props
        }: {
          className?: string;
          orientation?: 'left' | 'right' | 'up' | 'down';
        }) => {
          if (orientation === 'left') {
            return (
              <ChevronLeftIcon className={cn('size-4', className)} {...props} />
            );
          }

          if (orientation === 'right') {
            return (
              <ChevronRightIcon
                className={cn('size-4', className)}
                {...props}
              />
            );
          }

          return (
            <ChevronDownIcon className={cn('size-4', className)} {...props} />
          );
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }: WeekNumberProps) => {
          return (
            <td {...props}>
              <div className="flex size-[--cell-size] items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...props.components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <button
      ref={ref}
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        'data-[selected-single=true]:bg-accent data-[selected-single=true]:text-accent-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-accent data-[range-start=true]:text-accent-foreground data-[range-end=true]:bg-accent data-[range-end=true]:text-accent-foreground group-data-[focused=true]/day:border-accent-strong group-data-[focused=true]/day:ring-accent-strong/50 flex aspect-square h-auto w-full min-w-[--cell-size] items-center justify-center font-normal leading-none hover:bg-gray-100 rounded-sm group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] [&>span]:text-xs [&>span]:opacity-70',
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
