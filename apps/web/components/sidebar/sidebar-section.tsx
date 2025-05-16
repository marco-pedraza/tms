import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SidebarSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function SidebarSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
      >
        <div className="flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      <div className={cn('pl-4 space-y-1', isOpen ? 'block' : 'hidden')}>
        {children}
      </div>
    </div>
  );
}
