import Link from 'next/link';

interface SidebarLinkProps {
  href: string;
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
  label: string;
}

export default function SidebarLink({
  href,
  icon: Icon,
  label,
}: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
    >
      <Icon className="mr-2 h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}
