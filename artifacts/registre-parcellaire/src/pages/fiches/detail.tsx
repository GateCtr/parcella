import { useParams, Link } from 'wouter';
import { useGetFiche, useDecideFiche, useGeneratePlaque, getGetFicheQueryKey, type Fiche } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataSpinner } from '@/components/data-spinner';
import { Printer, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  typeOccupationOptions, usageParcelleOptions, plaqueExistanteOptions, paiementOptions,
  sensibilisationOptions, hygieneOptions, modeEliminationOptions, bacOrduresOptions, 
  dechetsVisiblesOptions, etatFacadeOptions, clotureOptions, emplacementOptions, 
  visibiliteOptions, canalisationOptions, risqueOptions, activitesOptions, 
  avisGlobalOptions, prioriteOptions, suiviOptions, getLabel 
} from '@/components/fiche/constants';

const DetailRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
  <div className="flex flex-col mb-4">
    <dt className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</dt>
    <dd className="font-medium text-foreground">{value || <span className="text-muted-foreground italic font-normal">Non renseigné</span>}</dd>
  </div>
);

export default function FicheDetail({ exampleFiche }: { exampleFiche?: Fiche }) {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isExample = Boolean(exampleFiche);

  const { data: savedFiche, isLoading, error } = useGetFiche(id ?? '', {
    query: { queryKey: getGetFicheQueryKey(id ?? ''), enabled: !isExample && Boolean(id) },
  });
  const fiche = exampleFiche ?? savedFiche;
  
  const decideFiche = useDecideFiche();
  const generatePlaque = useGeneratePlaque();

  if (!isExample && isLoading) return <DataSpinner label="Chargement de la fiche…" />;
  if ((!isExample && error) || !fiche) return <div className="p-8 text-center text-destructive font-semibold">Erreur: Impossible de charger la fiche.</div>;

  const handleDecision = (decision: 'validee' | 'rejetee') => {
    if (isExample) return;
    decideFiche.mutate({ id: fiche.id, data: { decision } }, {
      onSuccess: (updatedFiche) => {
        queryClient.setQueryData(getGetFicheQueryKey(fiche.id), updatedFiche);
        toast({ title: `Fiche ${decision}`, description: `La fiche a été ${decision} avec succès.` });
      },
      onError: () => {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Une erreur est survenue lors de la décision.' });
      }
    });
  };

  const handleGeneratePlaque = () => {
    if (isExample) return;
    generatePlaque.mutate({ id: fiche.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFicheQueryKey(fiche.id) });
        toast({ title: 'Plaque générée', description: 'Le design SVG de la plaque a été créé et ajouté à la file d\'impression.' });
      },
      onError: () => {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de générer la plaque.' });
      }
    });
  };

  const hygiene = (fiche.hygiene as Record<string, string>) || {};
  const dechets = (fiche.dechets as Record<string, string>) || {};
  const facade = (fiche.facade as Record<string, string>) || {};
  const drainage = (fiche.drainage as Record<string, string>) || {};
  const avis = (fiche.avis as any) || {};

  const dateProsp = new Date(fiche.dateProspection || fiche.createdAt);
  const quarter = Math.floor(dateProsp.getMonth() / 3) + 1;
  const year = dateProsp.getFullYear();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 print:pb-0">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between no-print border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href={isExample ? '/' : '/fiches'} aria-label={isExample ? "Retour à l'accueil" : "Retour au registre"} className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), "h-10 w-10 shrink-0")}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isExample ? 'Démonstration · Aucune donnée enregistrée' : 'Fiche enregistrée · Affichage et impression'}
            </p>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {isExample ? 'Exemple de fiche' : `Fiche N° ${fiche.ficheNo}`}
              {!isExample && fiche.statutFiche === 'validee' && <CheckCircle className="h-6 w-6 text-green-600" />}
              {!isExample && fiche.statutFiche === 'rejetee' && <XCircle className="h-6 w-6 text-destructive" />}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isExample ? 'Les informations ci-dessous sont fictives et servent uniquement à illustrer la fiche.' : `Soumise le ${format(new Date(fiche.createdAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {!isExample && fiche.statutFiche === 'soumise' && (
            <>
              <Button 
                variant="destructive" 
                onClick={() => handleDecision('rejetee')}
                disabled={decideFiche.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" /> Rejeter
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white" 
                onClick={() => handleDecision('validee')}
                disabled={decideFiche.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Valider
              </Button>
            </>
          )}

          {!isExample && fiche.statutFiche === 'validee' && fiche.statutPlaque === 'non_generee' && (
            <Button 
              onClick={handleGeneratePlaque}
              disabled={generatePlaque.isPending}
              className="bg-primary text-white"
            >
              <Printer className="mr-2 h-4 w-4" /> Générer Plaque
            </Button>
          )}

          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Imprimer
          </Button>

          {!isExample && fiche.statutPlaque === 'generee' && (
             <Badge variant="secondary" className="bg-primary/20 text-primary py-1.5 px-3">
               En file d'attente
             </Badge>
          )}
          {!isExample && fiche.statutPlaque === 'imprimee' && (
             <Badge variant="secondary" className="bg-green-600/20 text-green-700 py-1.5 px-3">
               <CheckCircle className="mr-1 h-3 w-3" /> Imprimée
             </Badge>
          )}
        </div>
      </div>

      {/* PAPER FORM DESIGN */}
      <div className="bg-white text-black p-6 md:p-12 border rounded-xl shadow-sm print:shadow-none print:border-none print:p-0 font-sans mx-auto max-w-4xl print-container">
        {isExample && (
          <div className="mb-6 border-2 border-dashed border-amber-700 bg-amber-50 px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-amber-900">
            Exemple fictif — ne constitue pas une fiche officielle
          </div>
        )}
        
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center text-center font-serif mb-6">
          <p className="font-bold text-sm tracking-wide">RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</p>
          <p className="font-bold text-sm tracking-wide">VILLE PROVINCE DE KINSHASA</p>
          <p className="font-bold text-sm tracking-wide uppercase">COMMUNE DE {fiche.commune}</p>
          
          <h1 className="text-xl md:text-2xl font-bold mt-6 mb-2 border-y-4 border-double border-black py-3 w-full max-w-2xl">
            FICHE DE PROSPECTION PARCELLAIRE
          </h1>
        </div>
        
        <div className="flex justify-between items-end mb-8 border-b-2 border-black pb-4">
          <div className="space-y-1">
            <p className="text-lg">N° Fiche: <strong className="text-xl">{fiche.ficheNo}</strong></p>
            <p>Date: <strong>{format(dateProsp, "dd/MM/yyyy")}</strong></p>
            <p>Trimestre: <strong>T{quarter} / {year}</strong></p>
          </div>
          
          <div className="w-28 h-28 border-2 border-dashed border-gray-400 flex flex-col items-center justify-center text-gray-400 text-xs text-center p-2 bg-gray-50/50 relative overflow-hidden">
            Espace réservé<br/>Code QR
          </div>
        </div>

        {/* 1. IDENTIFICATION */}
        <div className="mb-8">
          <h3 className="font-bold text-lg bg-black text-white px-3 py-1 mb-4 uppercase">1. Identification</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
            <DetailRow label="Quartier" value={fiche.quartier} />
            <DetailRow label="Avenue / Rue" value={fiche.avenue} />
            <DetailRow label="N° Parcelle" value={fiche.parcelleNo} />
            <DetailRow label="N° Plaque existante" value={fiche.plaqueNo} />
            
            <div className="col-span-2 md:col-span-4 border-t pt-3 mt-1"></div>
            
            <DetailRow label="Nom du propriétaire" value={fiche.proprietaireNom} />
            <DetailRow label="Téléphone" value={fiche.telephone} />
            <DetailRow label="Occupation" value={getLabel(fiche.typeOccupation, typeOccupationOptions)} />
            
            <div className="col-span-2 md:col-span-4 border-t pt-3 mt-1"></div>

            <DetailRow label="Superficie" value={fiche.superficie ? `${fiche.superficie} m²` : undefined} />
            <DetailRow label="Usage de la parcelle" value={getLabel(fiche.usageParcelle, usageParcelleOptions)} />
          </div>
        </div>

        {/* 2. ADRESSAGE */}
        <div className="mb-8 break-inside-avoid">
          <h3 className="font-bold text-lg bg-black text-white px-3 py-1 mb-4 uppercase">2. Adressage</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
            <DetailRow label="Plaque existante" value={getLabel(fiche.plaqueExistante, plaqueExistanteOptions)} />
            <DetailRow label="Statut paiement" value={getLabel(fiche.statutPaiement, paiementOptions)} />
            <DetailRow label="N° Reçu" value={fiche.recuNo} />
            <DetailRow label="Sensibilisation" value={getLabel(fiche.sensibilisation, sensibilisationOptions)} />
          </div>
        </div>

        {/* 3. HYGIÈNE */}
        <div className="mb-8 break-inside-avoid">
          <h3 className="font-bold text-lg bg-black text-white px-3 py-1 mb-4 uppercase">3. Hygiène</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-2">
            <DetailRow label="Propreté générale" value={getLabel(hygiene.proprete, hygieneOptions)} />
            <DetailRow label="Ordures ménagères" value={getLabel(hygiene.ordures, hygieneOptions)} />
            <DetailRow label="Végétation non entretenue" value={getLabel(hygiene.vegetation, hygieneOptions)} />
            <DetailRow label="Salubrité des latrines" value={getLabel(hygiene.latrines, hygieneOptions)} />
            <DetailRow label="Eaux stagnantes" value={getLabel(hygiene.eauxStagnantes, hygieneOptions)} />
            {hygiene.notes && <DetailRow label="Notes (anciennes données)" value={hygiene.notes} />}
          </div>
        </div>

        {/* 4. DÉCHETS */}
        <div className="mb-8 break-inside-avoid">
          <h3 className="font-bold text-lg bg-black text-white px-3 py-1 mb-4 uppercase">4. Déchets</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
            <DetailRow label="Mode d'élimination" value={getLabel(dechets.modeElimination, modeEliminationOptions)} />
            <DetailRow label="État du bac à ordures" value={getLabel(dechets.bacOrdures, bacOrduresOptions)} />
            <DetailRow label="Déchets visibles devant la parcelle" value={getLabel(dechets.visibles, dechetsVisiblesOptions)} />
            {dechets.notes && <DetailRow label="Notes (anciennes données)" value={dechets.notes} />}
          </div>
        </div>

        {/* 5. FAÇADE */}
        <div className="mb-8 break-inside-avoid">
          <h3 className="font-bold text-lg bg-black text-white px-3 py-1 mb-4 uppercase">5. Façade</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-2">
            <DetailRow label="État de la façade" value={getLabel(facade.etat, etatFacadeOptions)} />
            <DetailRow label="Type de clôture" value={getLabel(facade.cloture, clotureOptions)} />
            <DetailRow label="Visibilité" value={getLabel(facade.visibilite, visibiliteOptions)} />
            <div className="col-span-2 md:col-span-3">
              <DetailRow 
                label="Emplacement idéal plaque" 
                value={facade.emplacement === 'autre' ? `Autre: ${facade.emplacementAutre || 'Non précisé'}` : getLabel(facade.emplacement, emplacementOptions)} 
              />
            </div>
            {facade.notes && <DetailRow label="Notes (anciennes données)" value={facade.notes} />}
          </div>
        </div>

        {/* 6. DRAINAGE */}
        <div className="mb-8 break-inside-avoid">
          <h3 className="font-bold text-lg bg-black text-white px-3 py-1 mb-4 uppercase">6. Drainage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
            <DetailRow label="Canalisation" value={getLabel(drainage.canal, canalisationOptions)} />
            <DetailRow label="Risque (érosion/inondation)" value={getLabel(drainage.risque, risqueOptions)} />
            {drainage.notes && <DetailRow label="Notes (anciennes données)" value={drainage.notes} />}
          </div>
        </div>

        {/* 7. ACTIVITÉS */}
        <div className="mb-8 break-inside-avoid">
          <h3 className="font-bold text-lg bg-black text-white px-3 py-1 mb-4 uppercase">7. Activités</h3>
          <div className="px-2">
            {fiche.activites && fiche.activites.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 ml-2 font-medium">
                {fiche.activites.map((act, i) => (
                  <li key={i}>{getLabel(act, activitesOptions)}</li>
                ))}
              </ul>
            ) : (
              <span className="italic text-muted-foreground">Aucune activité renseignée</span>
            )}
          </div>
        </div>

        {/* 8. REMARQUES ET OBSERVATIONS DE L'AGENT */}
        <div className="mb-8 break-inside-avoid">
          <h3 className="font-bold text-lg bg-black text-white px-3 py-1 mb-4 uppercase">8. Remarques et observations de l'agent</h3>
          <div className="px-2">
            <div className="bg-gray-50 border p-4 min-h-[80px]">
              <p className="font-medium whitespace-pre-wrap">{fiche.remarques || <span className="italic text-gray-400">Aucune remarque</span>}</p>
            </div>
          </div>
        </div>

        {/* 9. AVIS DE L'AGENT DE PROSPECTION */}
        <div className="mb-4 break-inside-avoid">
          <h3 className="font-bold text-lg bg-black text-white px-3 py-1 mb-4 uppercase">9. Avis de l'agent de prospection</h3>
          <div className="px-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DetailRow label="Avis global" value={getLabel(avis.global, avisGlobalOptions)} />
              <DetailRow label="Priorité d'intervention" value={getLabel(avis.priorite, prioriteOptions)} />
              <div>
                <dt className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Actions de suivi</dt>
                <dd className="font-medium">
                  {avis.suivi && avis.suivi.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {avis.suivi.map((s: string, i: number) => <li key={i}>{getLabel(s, suiviOptions)}</li>)}
                    </ul>
                  ) : <span className="italic text-muted-foreground font-normal">Aucune</span>}
                </dd>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-4">
              <DetailRow label="Agent recenseur (Matricule)" value={fiche.agentMatricule} />
              <DetailRow label="Date de prospection" value={fiche.dateProspection ? format(new Date(fiche.dateProspection), "dd/MM/yyyy") : undefined} />
              <DetailRow label="Chef de rue (Témoin)" value={fiche.chefRueNom} />
              <DetailRow label="Avenue du Chef de rue" value={fiche.chefRueAvenue} />
            </div>

            <div className="bg-gray-100 p-4 border border-gray-300 rounded mb-8">
              <div className="flex gap-3">
                <div className="mt-1">
                  {avis.attestation ? (
                    <CheckCircle className="h-6 w-6 text-black" />
                  ) : (
                    <div className="h-5 w-5 border-2 border-black rounded-sm" />
                  )}
                </div>
                <p className="text-sm font-medium leading-relaxed text-black">
                  L'agent soussigné certifie sur l'honneur que les informations recueillies dans cette fiche sont exactes et ont été formellement constatées lors de la visite sur le terrain.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-8 mt-12 px-2 text-center text-sm font-bold h-32">
              <div className="border-t border-black pt-2 flex flex-col justify-between">
                <span>Le Propriétaire / L'Occupant</span>
                <span className="text-xs text-muted-foreground font-normal">{fiche.proprietaireNom}</span>
              </div>
              <div className="border-t border-black pt-2 flex flex-col justify-between">
                <span>Le Chef de rue</span>
                <span className="text-xs text-muted-foreground font-normal">{fiche.chefRueNom || "_____________________"}</span>
              </div>
              <div className="border-t border-black pt-2 flex flex-col justify-between">
                <span>L'Agent Recenseur</span>
                <span className="text-xs text-muted-foreground font-normal">{fiche.agentMatricule || "_____________________"}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
