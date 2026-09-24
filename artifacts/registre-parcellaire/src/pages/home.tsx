import { Link } from 'wouter';
import { buttonVariants } from '@/components/ui/button';
import { Map, ShieldCheck, FileText, Printer } from 'lucide-react';
import { Show } from '@clerk/react';
import { cn } from '@/lib/utils';

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="px-6 h-16 flex items-center border-b">
        <div className="flex items-center gap-2 font-bold text-primary text-xl">
          <Map className="h-6 w-6" />
          <span>Registre Parcellaire</span>
        </div>
        <div className="ml-auto">
          <Show when="signed-in">
            <Link href="/dashboard" className={buttonVariants({ variant: 'default' })}>
              Aller au Tableau de bord
            </Link>
          </Show>
          <Show when="signed-out">
            <Link href="/sign-in" className={buttonVariants({ variant: 'default' })}>
              Connexion
            </Link>
          </Show>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 md:py-32 px-6 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
            L'outil officiel de recensement des parcelles de Kinshasa
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Une plateforme moderne conçue pour les agents communaux afin d'identifier, recenser et attribuer les plaques parcellaires dans les 24 communes de la capitale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Show when="signed-in">
              <Link href="/dashboard" className={cn(buttonVariants({ variant: 'default', size: 'lg' }), "h-12 px-8 text-base")}>
                Accéder à mon espace
              </Link>
            </Show>
            <Show when="signed-out">
              <Link href="/sign-in" className={cn(buttonVariants({ variant: 'default', size: 'lg' }), "h-12 px-8 text-base")}>
                Connexion Agent
              </Link>
            </Show>
            <Link href="/fiches/exemple" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), "h-12 px-8 text-base")}>
              Voir une fiche d’exemple
            </Link>
          </div>
        </section>

        <section className="py-20 bg-muted/50 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-xl border shadow-sm">
              <div className="h-12 w-12 bg-primary/10 text-primary flex items-center justify-center rounded-lg mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Recensement Numérique</h3>
              <p className="text-muted-foreground">
                Saisissez les informations parcellaires sur le terrain avec un formulaire détaillé couvrant 9 sections officielles.
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-xl border shadow-sm">
              <div className="h-12 w-12 bg-primary/10 text-primary flex items-center justify-center rounded-lg mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Validation Hiérarchique</h3>
              <p className="text-muted-foreground">
                Contrôle et validation des fiches parcellaires pour garantir l'exactitude des données de la ville.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border shadow-sm">
              <div className="h-12 w-12 bg-primary/10 text-primary flex items-center justify-center rounded-lg mb-4">
                <Printer className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Génération de Plaques</h3>
              <p className="text-muted-foreground">
                Création automatique du design des plaques SVG et gestion de la file d'impression pour une délivrance rapide.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-6 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} Ville Province de Kinshasa. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
