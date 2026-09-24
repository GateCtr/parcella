import { UserButton } from '@clerk/react';
import { Menu, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SidebarNav } from './sidebar';
import { useLocation, Link } from 'wouter';
import { useState } from 'react';

export default function Topbar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  
  const getPageTitle = () => {
    if (location === '/dashboard') return 'Tableau de bord';
    if (location.startsWith('/fiches/nouvelle')) return 'Nouvelle fiche';
    if (location.startsWith('/fiches/')) return 'Détail de la fiche';
    if (location.startsWith('/fiches')) return 'Registre des fiches';
    if (location.startsWith('/imprimerie')) return 'File d\'impression';
    if (location === '/parametres') return 'Paramètres';
    if (location === '/plaques/modele') return 'Modèle de plaque';
    return '';
  };

  return (
    <header className="flex h-14 lg:h-16 items-center gap-4 border-b bg-card px-4 md:px-6 z-10 sticky top-0">
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
      
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-card-foreground">
          {getPageTitle()}
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-9 w-9 ring-2 ring-background"
            }
          }}
        />
      </div>
    </header>
  );
}
