import { ArrowLeft, Printer } from 'lucide-react';
import { Link } from 'wouter';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function PlaqueModele() {
  return (
    <div className="plaque-page-shell space-y-6 max-w-5xl mx-auto pb-20 font-sans">
      <style>{'@media print { @page { size: A4 landscape; margin: 10mm; } }'}</style>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between no-print border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/fiches" className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), "h-10 w-10 shrink-0")}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Modèle de Plaque Parcellaire</h2>
            <p className="text-muted-foreground text-sm">
              Aperçu fictif du modèle transmis pour les plaques d'adressage à Kinshasa.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Imprimer le modèle
        </Button>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden p-6 no-print">
        <p className="text-sm text-muted-foreground">
          Cet aperçu ne représente aucune parcelle enregistrée ; son QR indique seulement « exemple fictif ». Sur une vraie plaque générée après validation de la fiche, le code QR ouvre la fiche réservée aux agents connectés.
        </p>
      </div>

      <div className="print-center-wrapper">
        <img
          src={`${import.meta.env.BASE_URL}plaque-modele.svg`}
          alt="Modèle fictif de la plaque parcellaire, numéro 14, avenue Tshela, quartier Mama Yemo, commune de Mont-Ngafula"
          className="w-full max-w-[900px] h-auto shadow-2xl print:shadow-none print:max-w-[277mm] print:max-h-[190mm] print:w-auto print:h-auto"
        />
      </div>
    </div>
  );
}
