import { useParams, Link } from 'wouter';
import { useGetFiche, useListPlaques, useGeneratePlaque, useMarkPlaquePrinted, getListPlaquesQueryKey, getGetFicheQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, buttonVariants } from '@/components/ui/button';
import { DataSpinner } from '@/components/data-spinner';
import { Printer, ArrowLeft, AlertCircle, CheckCircle, Download, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PlaquePreview } from '@/components/plaque-preview';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LocaliteEditor } from '@/components/localite-editor';
import { useAuth } from '@/hooks/use-auth';

export default function FichePlaque() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const canGenerate = user?.role === 'admin_principal' || user?.role === 'validateur';

  const { data: fiche, isLoading: isLoadingFiche, error: errorFiche } = useGetFiche(id ?? '', {
    query: { queryKey: getGetFicheQueryKey(id ?? ''), enabled: Boolean(id) },
  });

  const { data: plaques, isLoading: isLoadingPlaques } = useListPlaques({ ficheId: id ?? '' }, {
    query: { enabled: Boolean(id) }
  });

  const generatePlaque = useGeneratePlaque();
  const markPrinted = useMarkPlaquePrinted();

  if (isLoadingFiche || isLoadingPlaques) return <DataSpinner label="Chargement de la plaque…" />;
  if (errorFiche || !fiche) return <div className="p-8 text-center text-destructive font-semibold">Erreur: Impossible de charger la fiche.</div>;

  const fichePlaques = plaques?.filter(p => p.ficheId === id).sort((a, b) => b.version - a.version);
  const latestPlaque = fichePlaques?.[0];
  const hasSvg = Boolean(latestPlaque?.svg);
  const qrReady = Boolean(latestPlaque?.verificationUrl);
  const addressKey = encodeURIComponent(JSON.stringify([
    fiche.parcelleNo, fiche.avenue, fiche.localite ?? '', fiche.quartier, fiche.commune,
  ])).replace(/'/g, '%27');
  const legacyPlaque = Boolean(hasSvg && latestPlaque && (
    !latestPlaque.svg.includes('id="plaque-layout-v8"')
    || !latestPlaque.svg.includes(`data-address-key="${addressKey}"`)
  ));

  const handleGenerate = () => {
    generatePlaque.mutate({ id: fiche.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPlaquesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFicheQueryKey(fiche.id) });
        toast({ title: 'Plaque générée', description: 'Le design SVG de la plaque a été créé avec succès.' });
      },
      onError: () => {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de générer la plaque.' });
      }
    });
  };

  const handleMarkPrinted = () => {
    if (!latestPlaque) return;
    markPrinted.mutate({ id: latestPlaque.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPlaquesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFicheQueryKey(fiche.id) });
        toast({ title: 'Statut mis à jour', description: 'La plaque a été marquée comme imprimée.' });
      },
      onError: () => {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le statut.' });
      }
    });
  };

  const handleDownload = () => {
    if (!latestPlaque || legacyPlaque) return;
    const url = URL.createObjectURL(new Blob([latestPlaque.svg], { type: 'image/svg+xml' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `plaque-${fiche.ficheNo.replace(/[^a-zA-Z0-9_-]/g, '-')}-v${latestPlaque.version}.svg`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="plaque-page-shell space-y-6 max-w-5xl mx-auto pb-20 font-sans">
      <style>{'@media print { @page { size: A4 landscape; margin: 0; } }'}</style>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between no-print border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href={`/fiches/${fiche.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), "h-10 w-10 shrink-0")}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Plaque N° {fiche.parcelleNo}</h2>
            <p className="text-muted-foreground text-sm">
              {latestPlaque ? `Fiche N° ${fiche.ficheNo} · Plaque (v${latestPlaque.version})` : `Fiche N° ${fiche.ficheNo} · Prévisualisation avant génération`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {fiche.statutFiche !== 'validee' ? (
             <Alert variant="destructive" className="py-2 h-10 flex items-center mb-0">
               <AlertCircle className="h-4 w-4 mr-2" />
               <AlertDescription className="text-xs font-medium">Validation requise avant impression</AlertDescription>
             </Alert>
           ) : (!hasSvg || legacyPlaque) && canGenerate ? (
            <Button
              onClick={handleGenerate}
              disabled={generatePlaque.isPending}
              className="bg-primary text-white"
            >
               <ImageIcon className="mr-2 h-4 w-4" /> {legacyPlaque ? 'Actualiser le modèle' : 'Générer la plaque'}
            </Button>
          ) : (
            <>
              {qrReady && latestPlaque?.statut !== 'imprimee' && canGenerate && (
                <Button
                  onClick={handleMarkPrinted}
                  disabled={markPrinted.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                   <CheckCircle className="mr-2 h-4 w-4" /> Confirmer impression
                </Button>
              )}
              <Button variant="outline" onClick={() => window.print()} disabled={!qrReady}>
                <Printer className="mr-2 h-4 w-4" /> Imprimer / PDF
              </Button>
              {!legacyPlaque && (
                <Button variant="outline" onClick={handleDownload} disabled={!qrReady} data-testid="button-download-plaque">
                  <Download className="mr-2 h-4 w-4" /> Télécharger SVG vectoriel
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <LocaliteEditor fiche={fiche} />

      {hasSvg && !qrReady && (
        <Alert variant="destructive" className="no-print">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>QR non prêt pour l'impression</AlertTitle>
          <AlertDescription>Choisissez et configurez d'abord un domaine public permanent, puis actualisez les QR des plaques enregistrées. L'impression et le téléchargement restent désactivés.</AlertDescription>
        </Alert>
      )}

      {fiche.statutFiche === 'validee' && hasSvg && !legacyPlaque && (
        <p className="no-print text-sm text-muted-foreground">
          PDF : choisissez « Enregistrer au format PDF » dans la fenêtre d’impression. Pour une imprimerie ou un grand format, téléchargez le SVG vectoriel, qui reste net à toute taille.
        </p>
      )}

       {legacyPlaque && fiche.statutFiche === 'validee' && (
         <Alert className="no-print">
           <AlertCircle className="h-4 w-4" />
           <AlertTitle>Ancien modèle de plaque</AlertTitle>
            <AlertDescription>Cette plaque utilise un ancien dessin ou une ancienne adresse. {canGenerate && "Actualisez-la pour créer une nouvelle version avec la localité et la taille de texte corrigées."}</AlertDescription>
         </Alert>
       )}
       {!hasSvg && fiche.statutFiche === 'validee' && (
        <Alert className="bg-blue-50 text-blue-900 border-blue-200 no-print">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900 font-semibold">Prévisualisation</AlertTitle>
          <AlertDescription className="text-blue-800">
            Ceci est un aperçu HTML du rendu final. {canGenerate ? 'Veuillez cliquer sur "Générer la plaque" pour figer le QR code, créer le SVG officiel, et l\'ajouter à la file d\'impression.' : 'En attente de génération par un validateur.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="print-center-wrapper">
        {hasSvg && latestPlaque ? (
          <div className="w-full flex justify-center py-4 print:py-0">
            <img
              src={`data:image/svg+xml,${encodeURIComponent(latestPlaque.svg)}`}
              alt={`Plaque ${latestPlaque.plaqueNo}`}
              className="w-full max-w-[900px] h-auto shadow-2xl print:shadow-none print:max-w-[277mm] print:max-h-[190mm] print:w-auto print:h-auto print-unscale"
            />
          </div>
        ) : (
          <PlaquePreview
            parcelleNo={fiche.parcelleNo}
            avenue={fiche.avenue}
            localite={fiche.localite}
            quartier={fiche.quartier}
            commune={fiche.commune}
            isFictive={false}
          />
        )}
      </div>
    </div>
  );
}
