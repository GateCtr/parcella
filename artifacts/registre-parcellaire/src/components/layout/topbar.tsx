import { Menu, Map, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SidebarNav } from './sidebar';
import { useLocation, Link } from 'wouter';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function Topbar() {
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  const getPageTitle = () => {
    if (location === '/dashboard') return 'Tableau de bord';
    if (location.startsWith('/fiches/nouvelle')) return 'Nouvelle fiche';
    if (location.startsWith('/fiches/')) return 'Détail de la fiche';
    if (location.startsWith('/fiches')) return 'Registre des fiches';
    if (location.startsWith('/imprimerie')) return 'File d\'impression';
    if (location === '/parametres') return 'Paramètres';
    if (location === '/utilisateurs') return 'Utilisateurs';
    if (location === '/plaques/modele') return 'Modèle de plaque';
    return '';
  };

  const handleLogout = async () => {
    await logout();
    setLocation('/sign-in');
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'admin_principal': return 'Administrateur Principal';
      case 'validateur': return 'Validateur';
      case 'agent': return 'Agent Terrain';
      default: return role;
    }
  };

  return (
    <header className="z-10 flex h-14 shrink-0 items-center gap-4 border-b bg-card px-4 md:px-6 lg:h-16">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar border-r-0">
          <Link href="/" onClick={() => setOpen(false)}>
            <div className="flex h-14 items-center border-b border-sidebar-border px-4 lg:h-16 gap-3 cursor-pointer">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
                <Map className="h-5 w-5" />
              </div>
              <span className="font-semibold text-sidebar-foreground uppercase tracking-wider text-sm">Registre Parcellaire</span>
            </div>
          </Link>
          <SidebarNav onItemClick={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-semibold text-card-foreground">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {formatRole(user.role)}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Se déconnecter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
