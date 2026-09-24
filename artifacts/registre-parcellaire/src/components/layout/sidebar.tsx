import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { FileText, LayoutDashboard, Printer, Map, LayoutTemplate, Settings2, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const getNavItems = (role: string) => {
  const items = [
    { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/fiches', label: 'Registre des fiches', icon: FileText },
    { href: '/imprimerie', label: 'File d\'impression', icon: Printer },
    { href: '/plaques/modele', label: 'Modèle de plaque', icon: LayoutTemplate },
  ];

  if (role === 'admin_principal' || role === 'validateur') {
    items.push({ href: '/parametres', label: 'Paramètres', icon: Settings2 });
  }

  if (role === 'admin_principal') {
    items.push({ href: '/utilisateurs', label: 'Utilisateurs', icon: Users });
  }

  return items;
};

export function SidebarNav({ className, onItemClick }: { className?: string, onItemClick?: () => void }) {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;
  const navItems = getNavItems(user.role);

  return (
    <nav className={cn('flex flex-col gap-2 p-4', className)}>
      {navItems.map((item) => {
        // match exact or sub-routes correctly
        const isActive = item.href === '/fiches'
          ? location.startsWith('/fiches')
          : location === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70'
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar() {
  return (
    <aside className="hidden h-full min-h-0 w-64 shrink-0 flex-col overflow-hidden border-r bg-sidebar md:flex">
      <Link href="/">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4 lg:h-16 gap-3 cursor-pointer">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
            <Map className="h-5 w-5" />
          </div>
          <span className="font-semibold text-sidebar-foreground uppercase tracking-wider text-sm">Registre Parcellaire</span>
        </div>
      </Link>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <SidebarNav />
      </div>
      <div className="mt-auto shrink-0 border-t border-sidebar-border p-4">
        <div className="text-xs text-sidebar-foreground/50">
          Ville de Kinshasa
          <br />
          Service de l'Urbanisme
        </div>
      </div>
    </aside>
  );
}
