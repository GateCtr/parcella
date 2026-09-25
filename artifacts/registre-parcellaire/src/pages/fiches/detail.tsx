import { useParams, Link } from 'wouter';
import { useGetFiche, useGetRubriqueSettings, useListPlaques, useDecideFiche, useGeneratePlaque, getGetFicheQueryKey, getGetRubriqueSettingsQueryKey, getListPlaquesQueryKey, type Fiche } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataSpinner } from '@/components/data-spinner';
import { Printer, ArrowLeft, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/hooks/use-auth';

// Identical star geometry to the flag in the generated plaque SVG.
const plaqueFlagStarPoints = Array.from({ length: 10 }, (_, i) => {
  const angle = -Math.PI / 2 + i * Math.PI / 5;
  const radius = i % 2 === 0 ? 134 : 54;
  return `${175 + radius * Math.cos(angle)},${190 + radius * Math.sin(angle)}`;
}).join(' ');

const Checkbox = ({ checked, label, className }: { checked: boolean, label: React.ReactNode, className?: string }) => (
  <div className={cn("flex items-start gap-1.5", className)}>
    <div className="w-3 h-3 mt-[1px] border border-black flex-shrink-0 flex items-center justify-center bg-white">
      {checked && (
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-2.5 h-2.5 text-black">
          <path d="M2 2l10 10m0-10L2 12" />
        </svg>
      )}
    </div>
    {label && <span className="text-[11px] leading-tight text-black">{label}</span>}
  </div>
);

const SectionHeader = ({ num, title }: { num: string, title: string }) => (
  <div className="flex items-stretch mt-3 mb-1 break-after-avoid">
    <div className="bg-[#184490] text-white font-bold text-[14px] w-6 flex items-center justify-center flex-shrink-0">
      {num}
    </div>
    <div className="bg-[#eaf1f8] text-[#184490] font-bold text-[11px] flex-1 flex items-center px-2 uppercase tracking-wide">
      {title}
    </div>
  </div>
);

export default function FicheDetail({ exampleFiche }: { exampleFiche?: Fiche }) {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isExample = Boolean(exampleFiche);

  const canValidate = user?.role === 'admin_principal' || user?.role === 'validateur';

  const { data: savedFiche, isLoading, error } = useGetFiche(id ?? '', {
    query: { queryKey: getGetFicheQueryKey(id ?? ''), enabled: !isExample && Boolean(id) },
  });
  const { data: rubriqueSettings, isLoading: isRubriqueSettingsLoading, error: rubriqueSettingsError } = useGetRubriqueSettings({
    query: { queryKey: getGetRubriqueSettingsQueryKey(), enabled: !isExample, refetchInterval: 30_000 },
  });
  const { data: plaques } = useListPlaques({ ficheId: id ?? '' }, {
    query: { enabled: !isExample && Boolean(id) && savedFiche?.statutFiche === 'validee' },
  });
  const fiche = exampleFiche ?? savedFiche;

  const decideFiche = useDecideFiche();
  const generatePlaque = useGeneratePlaque();

  if (!isExample && isLoading) return <DataSpinner label="Chargement de la fiche…" />;
  if ((!isExample && error) || !fiche) return <div className="p-8 text-center text-destructive font-semibold">Erreur: Impossible de charger la fiche.</div>;
  if (!isExample && isRubriqueSettingsLoading) return <DataSpinner label="Chargement des paramètres d’affichage…" />;
  if (!isExample && (rubriqueSettingsError || !rubriqueSettings)) return <div className="p-8 text-center text-destructive font-semibold">Erreur: Impossible de charger les paramètres d’affichage des rubriques.</div>;

  const visibleSections = isExample
    ? { adressage: true, hygiene: true, dechets: true, facade: true, drainage: true, activites: true, remarques: true, avis: true }
    : rubriqueSettings!;
  const hasPageTwoSections = visibleSections.facade || visibleSections.drainage || visibleSections.activites || visibleSections.remarques || visibleSections.avis;

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
        queryClient.invalidateQueries({ queryKey: getListPlaquesQueryKey() });
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
  const activites = fiche.activites || [];

  const dateProsp = new Date(fiche.dateProspection || fiche.createdAt);
  const quarter = Math.floor(dateProsp.getMonth() / 3) + 1;
  const year = dateProsp.getFullYear();
  const yearShort = year.toString().slice(2);
  const ficheUrl = !isExample && fiche.statutFiche === 'validee'
    ? plaques?.filter(p => p.ficheId === fiche.id).sort((a, b) => b.version - a.version)[0]?.verificationUrl
    : null;

  const tdClass = "border border-black p-1 text-black";
  const thClass = "border border-black bg-[#eaf1f8] font-bold p-1 text-black text-left";

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 print:pb-0 print:space-y-0 font-sans">
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
            <p className="mt-2 text-xs text-muted-foreground sm:hidden">
              Faites glisser la fiche vers la gauche pour voir toutes ses colonnes.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isExample && fiche.statutFiche === 'soumise' && canValidate && (
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

          {!isExample && fiche.statutFiche === 'validee' && fiche.statutPlaque === 'non_generee' && canValidate && (
            <Button
              onClick={handleGeneratePlaque}
              disabled={generatePlaque.isPending}
              className="bg-primary text-white"
            >
              <Printer className="mr-2 h-4 w-4" /> Générer Plaque
            </Button>
          )}

          {!isExample && canValidate && (
            <Link
              href={`/fiches/${fiche.id}/plaque`}
              className={buttonVariants({ variant: 'secondary' })}
            >
              <ImageIcon className="mr-2 h-4 w-4" /> Plaque
            </Link>
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

      {/* PAPER FORM DESIGN - 21cm width equivalent for A4 aspect */}
      <div className="overflow-x-auto pb-4 print:overflow-visible print:pb-0">
        <div className="bg-white mx-auto print-container shadow-sm print:shadow-none min-w-[21cm]" style={{ maxWidth: '21cm' }}>

        {/* Page 1 Wrap */}
        <div className="px-4 py-6 md:p-8 print:p-0 min-h-[277mm] flex flex-col">
          {isExample && (
            <div className="mb-4 border-2 border-dashed border-amber-700 bg-amber-50 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-amber-900 print:border-black print:text-black print:bg-white">
              Exemple fictif — ne constitue pas une fiche officielle
            </div>
          )}

          {/* Header Section */}
          <div className="mb-4">
            <div className="grid grid-cols-[100px_minmax(0,1fr)_100px] items-start min-h-[70px]">
              <div className="flex justify-center">
                <img src={`${import.meta.env.BASE_URL}kinshasa-seal.png`} className="w-[70px] h-[70px] object-contain" alt="Sceau Kinshasa" />
              </div>
              <div className="text-center leading-tight">
                <div className="font-bold text-[11px] text-black">REPUBLIQUE DEMOCRATIQUE<br/>DU CONGO</div>
                <div className="text-[10px] text-gray-700 mt-1">VILLE PROVINCE DE KINSHASA</div>
                <div className="text-[9px] text-gray-500 italic">Justice - Paix - Travail</div>
              </div>
              <div className="flex justify-center">
                <svg viewBox="0 0 960 640" className="w-[70px] h-auto" role="img" aria-label="Drapeau de la République démocratique du Congo">
                  <rect width="960" height="640" fill="#007fff" />
                  <path d="M0 565 850 0 H960 V87 L110 640 H0Z" fill="#f7d116" />
                  <path d="M0 604 909 0 H960 V47 L51 640 H0Z" fill="#ce1126" />
                  <polygon points={plaqueFlagStarPoints} fill="#f7d116" />
                </svg>
              </div>
            </div>

            <div className="bg-[#eaf1f8] w-full py-1.5 px-4 text-center border-b border-white">
              <div className="text-[#184490] font-bold text-[12px] uppercase">COMMUNE DE {fiche.commune}</div>
              <div className="text-[#a31a1a] font-bold text-[16px] leading-tight uppercase my-0.5">
                FICHE DE PROSPECTION<br/>PARCELLAIRE
              </div>
              <div className="text-[#184490] italic text-[10px]">
                Identification et Adressage Parcellaire - Quartier {fiche.quartier || '_________________'}
              </div>
            </div>
          </div>

           <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end mb-2 text-[11px] font-bold text-[#184490]">
              <div className="grid grid-cols-[4rem_max-content] items-baseline gap-x-1 gap-y-2 pb-1">
                <span>N° Fiche :</span>
                <span className="border-b border-black min-w-24 text-center text-[10px] text-black font-normal">{fiche.ficheNo}</span>
                <span>Date :</span>
                <span className="border-b border-black min-w-24 text-center text-black font-normal">{format(dateProsp, "dd/MM/yyyy")}</span>
              </div>

             <div className="flex">
              <div className="border border-black flex flex-col w-[12rem] h-[6.5rem]">
              <div className="text-center font-bold text-[#184490] border-b border-black bg-[#eaf1f8] text-[9px] py-0.5 uppercase tracking-wide">PÉRIODE :</div>
               <div className="bg-[#eaf1f8] p-1 pb-1.5 flex flex-1 flex-col justify-center text-[9px] font-normal text-black">
                 <div className="flex justify-between px-1">
                   <Checkbox checked={quarter === 1} label="Trimestre 1" />
                   <Checkbox checked={quarter === 2} label="Trimestre 2" />
                 </div>
                 <div className="flex justify-between px-1 mt-1">
                   <Checkbox checked={quarter === 3} label="Trimestre 3" />
                   <Checkbox checked={quarter === 4} label="Trimestre 4" />
                 </div>
                 <div className="text-center mt-1 font-medium">Année : 20<span className="border-b border-black inline-block w-6 text-center">{yearShort}</span></div>
              </div>
            </div>

              <div className="border border-l-0 border-black w-[6.5rem] h-[6.5rem] flex flex-col items-center justify-center bg-white text-center text-[9px] text-gray-500">
               {ficheUrl ? (
                 <>
                   <QRCodeSVG
                     value={ficheUrl}
                     size={76}
                     level="M"
                     bgColor="#ffffff"
                     fgColor="#000000"
                      title={`Informations publiques sur la plaque ${fiche.ficheNo}`}
                   />
                    <span className="text-[7px] leading-none mt-1 text-black">Informations publiques</span>
                 </>
               ) : (
                  <span className="italic">{isExample ? 'Exemple — sans QR' : 'QR après génération de la plaque'}</span>
               )}
            </div>
             </div>
          </div>

          {/* 1. IDENTIFICATION */}
          <SectionHeader num="1" title="IDENTIFICATION DE LA PARCELLE" />
          <table className="w-full text-[11px] border-collapse border border-black mb-1">
            <tbody>
              <tr>
                <td className={`${thClass} w-[22%]`}>Quartier :</td>
                <td className={`${tdClass} w-[28%]`}>{fiche.quartier}</td>
                <td className={`${thClass} w-[22%]`}>Avenue / Rue :</td>
                <td className={`${tdClass} w-[28%]`}>{fiche.avenue}</td>
              </tr>
              <tr>
                <td className={thClass}>N° de la Parcelle :</td>
                <td className={tdClass}>{fiche.parcelleNo}</td>
                <td className={thClass}>Localité :</td>
                <td className={tdClass}>{fiche.localite || '—'}</td>
              </tr>
              <tr>
                <td className={thClass}>Nom du Propriétaire :</td>
                <td className={tdClass} colSpan={3}>{fiche.proprietaireNom}</td>
              </tr>
              <tr>
                <td className={thClass}>Téléphone :</td>
                <td className={tdClass}>{fiche.telephone}</td>
                <td className={thClass}>Type d'occupation :</td>
                <td className={tdClass}>
                  <div className="flex gap-2 flex-wrap">
                    <Checkbox checked={fiche.typeOccupation === 'proprietaire'} label="Propriétaire" />
                    <Checkbox checked={fiche.typeOccupation === 'locataire'} label="Locataire" />
                    <Checkbox checked={fiche.typeOccupation === 'autre'} label="Autre" />
                  </div>
                </td>
              </tr>
              <tr>
                <td className={thClass}>Superficie estimée :</td>
                <td className={tdClass}>{fiche.superficie ? `${fiche.superficie} m²` : ''}</td>
                <td className={thClass}>Usage de la parcelle :</td>
                <td className={tdClass}>
                  <div className="flex gap-2 flex-wrap">
                    <Checkbox checked={fiche.usageParcelle === 'residentiel'} label="Résidentiel" />
                    <Checkbox checked={fiche.usageParcelle === 'commercial'} label="Commercial" />
                    <Checkbox checked={fiche.usageParcelle === 'mixte'} label="Mixte" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {visibleSections.adressage && (<>
          {/* 2. ADRESSAGE */}
          <SectionHeader num="2" title="ÉTAT DE L'ADRESSAGE PARCELLAIRE" />
          <table className="w-full text-[11px] border-collapse border border-black mb-1">
            <tbody>
              <tr>
                <td className={`${thClass} w-[44%]`}>La parcelle dispose-t-elle déjà d'une plaque d'identification ?</td>
                <td className={`${tdClass} w-[56%]`}>
                  <div className="flex gap-3 flex-wrap">
                    <Checkbox checked={fiche.plaqueExistante === 'ancienne'} label="Oui - ancienne plaque" />
                    <Checkbox checked={fiche.plaqueExistante === 'premiere'} label="Non - première plaque" />
                    <Checkbox checked={fiche.plaqueExistante === 'endommagee'} label="Plaque endommagée" />
                  </div>
                </td>
              </tr>
              <tr>
                <td className={thClass}>Statut du paiement de la plaque :</td>
                <td className={tdClass}>
                  <div className="flex gap-3 flex-wrap">
                    <Checkbox checked={fiche.statutPaiement === 'paye_15000'} label="Payé (15 000 FC)" />
                    <Checkbox checked={fiche.statutPaiement === 'acompte_7500'} label="Acompte 50% (7 500 FC)" />
                    <Checkbox checked={fiche.statutPaiement === 'non_paye'} label="Non payé" />
                  </div>
                </td>
              </tr>
              <tr>
                <td className={thClass}>N° du reçu de paiement :</td>
                <td className={tdClass}>{fiche.recuNo || ''}</td>
              </tr>
              <tr>
                <td className={thClass}>Ménage sensibilisé au projet :</td>
                <td className={tdClass}>
                  <div className="flex gap-3 flex-wrap">
                    <Checkbox checked={fiche.sensibilisation === 'adhere'} label="Oui - adhère au projet" />
                    <Checkbox checked={fiche.sensibilisation === 'a_relancer'} label="Non - à relancer" />
                    <Checkbox checked={fiche.sensibilisation === 'reticent'} label="Réticent" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          </>)}

          {visibleSections.hygiene && (<>
          {/* 3. HYGIÈNE */}
          <SectionHeader num="3" title="HYGIÈNE ET SALUBRITÉ DE LA PARCELLE" />
          <table className="w-full text-[11px] border-collapse border border-black text-center mb-1">
            <thead>
              <tr>
                <th className="border border-black bg-[#184490] text-white font-bold p-1 text-left w-1/2">Critère d'évaluation</th>
                <th className="border border-black bg-[#184490] text-white font-bold p-1 w-1/6">Bon</th>
                <th className="border border-black bg-[#184490] text-white font-bold p-1 w-1/6">Moyen</th>
                <th className="border border-black bg-[#184490] text-white font-bold p-1 w-1/6">Mauvais</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Propreté générale de la parcelle", val: hygiene.proprete },
                { label: "Gestion des ordures ménagères", val: hygiene.ordures },
                { label: "Présence de végétation non entretenue", val: hygiene.vegetation },
                { label: "État sanitaire des latrines / toilettes", val: hygiene.latrines },
                { label: "Présence d'eaux stagnantes", val: hygiene.eauxStagnantes },
              ].map((row, idx) => (
                <tr key={idx} className="bg-white">
                  <td className="border border-black p-1 text-left text-black">{row.label}</td>
                  <td className="border border-black p-1"><div className="flex justify-center"><Checkbox checked={row.val === 'bon'} label=""/></div></td>
                  <td className="border border-black p-1"><div className="flex justify-center"><Checkbox checked={row.val === 'moyen'} label=""/></div></td>
                  <td className="border border-black p-1"><div className="flex justify-center"><Checkbox checked={row.val === 'mauvais'} label=""/></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          </>)}

          {visibleSections.dechets && (<>
          {/* 4. DÉCHETS */}
          <SectionHeader num="4" title="GESTION DES DÉCHETS" />
          <table className="w-full text-[11px] border-collapse border border-black mb-1">
            <tbody>
              <tr>
                <td className={`${thClass} w-[44%]`}>Mode d'élimination des déchets :</td>
                <td className={`${tdClass} w-[56%]`}>
                  <div className="flex gap-2 flex-wrap">
                    <Checkbox checked={dechets.modeElimination === 'collecte_municipale'} label="Collecte municipale" />
                    <Checkbox checked={dechets.modeElimination === 'incineration'} label="Brûlage" />
                    <Checkbox checked={dechets.modeElimination === 'decharge_sauvage'} label="Dépôt sauvage" />
                    <Checkbox checked={dechets.modeElimination === 'fosse'} label="Fosse" />
                  </div>
                </td>
              </tr>
              <tr>
                <td className={thClass}>Présence d'un bac à ordures :</td>
                <td className={tdClass}>
                  <div className="flex gap-3 flex-wrap">
                    <Checkbox checked={dechets.bacOrdures === 'bon'} label="Oui - en bon état" />
                    <Checkbox checked={dechets.bacOrdures === 'endommage'} label="Oui - dégradé" />
                    <Checkbox checked={dechets.bacOrdures === 'aucun'} label="Non" />
                  </div>
                </td>
              </tr>
              <tr>
                <td className={thClass}>Déchets visibles devant la parcelle :</td>
                <td className={tdClass}>
                  <div className="flex gap-3 flex-wrap">
                    <Checkbox checked={dechets.visibles === 'aucun'} label="Aucun" />
                    <Checkbox checked={dechets.visibles === 'peu'} label="Peu" />
                    <Checkbox checked={dechets.visibles === 'beaucoup'} label="Beaucoup" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          </>)}

          <div className="flex-1"></div> {/* Spacer to preserve page-one layout */}

        </div>

        {hasPageTwoSections && (<>
        {/* Page Break for Print */}
        <div className="no-print h-4 bg-gray-100 border-y border-dashed border-gray-300 w-full mb-4 mt-2"></div>

        {/* Page 2 Wrap */}
        <div className="px-4 py-6 md:p-8 print:p-0 print:break-before-page min-h-[277mm] flex flex-col">
          {isExample && (
            <div className="mb-2 border-b border-dashed border-black pb-1 text-center text-[9px] font-bold uppercase tracking-wide text-black">
              Exemple fictif — document non officiel
            </div>
          )}

          {/* 5. FAÇADE */}
          {visibleSections.facade && (
          <div className="break-inside-avoid">
            <SectionHeader num="5" title="ÉTAT DE LA FAÇADE ET DE LA CLÔTURE" />
            <table className="w-full text-[11px] border-collapse border border-black mb-1">
              <tbody>
                <tr>
                  <td className={`${thClass} w-[40%]`}>État de la façade de la parcelle :</td>
                  <td className={`${tdClass} w-[60%]`}>
                    <div className="flex gap-3 flex-wrap">
                      <Checkbox checked={facade.etat === 'bonne'} label="Bon état" />
                      <Checkbox checked={facade.etat === 'degradee'} label="Dégradée" />
                      <Checkbox checked={facade.etat === 'en_construction'} label="En construction" />
                      <Checkbox checked={facade.etat === 'inexistante'} label="Inexistante" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={thClass}>Type de clôture :</td>
                  <td className={tdClass}>
                    <div className="flex gap-3 flex-wrap">
                      <Checkbox checked={facade.cloture === 'mur'} label="Mur en dur" />
                      <Checkbox checked={facade.cloture === 'palissade'} label="Palissade" />
                      <Checkbox checked={facade.cloture === 'haie'} label="Haie vive" />
                      <Checkbox checked={facade.cloture === 'aucune'} label="Aucune clôture" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={thClass}>Emplacement idéal pour la plaque :</td>
                  <td className={tdClass}>
                    <div className="flex gap-2 items-center flex-wrap">
                      <Checkbox checked={facade.emplacement === 'portail'} label="Portail" />
                      <Checkbox checked={facade.emplacement === 'mur_facade'} label="Mur façade" />
                      <Checkbox checked={facade.emplacement === 'poteau'} label="Poteau" />
                      <Checkbox checked={facade.emplacement === 'autre'} label="Autre :" />
                      {facade.emplacement === 'autre' ? (
                        <span className="border-b border-black flex-1 min-w-[50px] inline-block">{facade.emplacementAutre || ''}</span>
                      ) : (
                        <span className="border-b border-black w-16 inline-block"></span>
                      )}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={thClass}>Visibilité de la plaque depuis la rue :</td>
                  <td className={tdClass}>
                    <div className="flex gap-3 flex-wrap">
                      <Checkbox checked={facade.visibilite === 'excellente'} label="Excellente" />
                      <Checkbox checked={facade.visibilite === 'bonne'} label="Bonne" />
                      <Checkbox checked={facade.visibilite === 'difficile'} label="Difficile - obstacle signalé" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          )}

          {/* 6. DRAINAGE */}
          {visibleSections.drainage && (
          <div className="break-inside-avoid">
            <SectionHeader num="6" title="PRÉSENCE ET ÉTAT DES CANAUX DE DRAINAGE" />
            <table className="w-full text-[11px] border-collapse border border-black mb-1">
              <tbody>
                <tr>
                  <td className={`${thClass} w-[40%]`}>Canal de drainage devant la parcelle :</td>
                  <td className={`${tdClass} w-[60%]`}>
                    <div className="flex gap-3 flex-wrap">
                      <Checkbox checked={drainage.canal === 'present_fonctionnel'} label="Présent et fonctionnel" />
                      <Checkbox checked={drainage.canal === 'present_obstrue'} label="Présent mais obstrué" />
                      <Checkbox checked={drainage.canal === 'absent'} label="Absent" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={thClass}>Risque d'érosion ou d'inondation :</td>
                  <td className={tdClass}>
                    <div className="flex gap-3 flex-wrap">
                      <Checkbox checked={drainage.risque === 'aucun'} label="Aucun risque" />
                      <Checkbox checked={drainage.risque === 'modere'} label="Risque modéré" />
                      <Checkbox checked={drainage.risque === 'eleve'} label="Risque élevé" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          )}

          {/* 7. ACTIVITÉS */}
          {visibleSections.activites && (
          <div className="break-inside-avoid">
            <SectionHeader num="7" title="TYPES D'ACTIVITÉS EXERCÉES SUR LA PARCELLE" />
            <table className="w-full text-[11px] border-collapse border border-black mb-1 bg-white">
              <tbody>
                <tr>
                  <td className={`${tdClass} w-1/4`}><Checkbox checked={activites.includes('maison_familiale')} label="Habitation familiale" /></td>
                  <td className={`${tdClass} w-1/4`}><Checkbox checked={activites.includes('boutique_magasin')} label="Commerce / Boutique" /></td>
                  <td className={`${tdClass} w-1/4`}><Checkbox checked={activites.includes('atelier')} label="Atelier / Artisanat" /></td>
                  <td className={`${tdClass} w-1/4`}><Checkbox checked={activites.includes('restaurant_bar')} label="Restaurant / Alimentation" /></td>
                </tr>
                <tr>
                  <td className={tdClass}><Checkbox checked={activites.includes('ecole')} label="École / Formation" /></td>
                  <td className={tdClass}><Checkbox checked={activites.includes('eglise')} label="Église / Lieu de culte" /></td>
                  <td className={tdClass}><Checkbox checked={activites.includes('sante_pharmacie')} label="Santé / Pharmacie" /></td>
                  <td className={tdClass}><Checkbox checked={activites.includes('agriculture_elevage')} label="Agriculture / Élevage" /></td>
                </tr>
                <tr>
                  <td className={tdClass}><Checkbox checked={activites.includes('entrepot')} label="Entrepôt / Stockage" /></td>
                  <td className={tdClass}><Checkbox checked={activites.includes('terrain_vide')} label="Terrain vague / Inoccupé" /></td>
                  <td className={`${tdClass} font-bold`} colSpan={2}>
                    <div className="flex items-center gap-1">
                      <span className="text-[#184490]">Autre activité :</span>
                      <span className="border-b border-black flex-1 inline-block h-3 font-normal">{/* Autre not stored as string in schema, but we leave line */}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          )}

          {/* 8. REMARQUES */}
          {visibleSections.remarques && (
          <div className="break-inside-avoid">
            <SectionHeader num="8" title="REMARQUES ET OBSERVATIONS DE L'AGENT" />
            <div className="border border-black min-h-[70px] p-2 text-[11px] text-black bg-white whitespace-pre-wrap">
              {fiche.remarques}
            </div>
          </div>
          )}

          {/* 9. AVIS DE L'AGENT */}
          {visibleSections.avis && (
          <div className="break-inside-avoid">
            <SectionHeader num="9" title="AVIS DE L'AGENT DE PROSPECTION" />
            <table className="w-full text-[11px] border-collapse border border-black mb-2">
              <tbody>
                <tr>
                  <td className={`${thClass} w-[40%]`}>Avis global sur la parcelle :</td>
                  <td className={`${tdClass} w-[60%]`}>
                    <div className="flex gap-3 flex-wrap">
                      <Checkbox checked={avis.global === 'conforme'} label="Conforme - plaque à poser" />
                      <Checkbox checked={avis.global === 'non_conforme'} label="Non conforme - signalement requis" />
                      <Checkbox checked={avis.global === 'en_attente'} label="En attente" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={thClass}>Priorité de traitement :</td>
                  <td className={tdClass}>
                    <div className="flex gap-3 flex-wrap">
                      <Checkbox checked={avis.priorite === 'urgente'} label="Urgente (cette semaine)" />
                      <Checkbox checked={avis.priorite === 'normale'} label="Normale (ce mois)" />
                      <Checkbox checked={avis.priorite === 'differee'} label="Différée" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={thClass}>Suivi requis :</td>
                  <td className={tdClass}>
                    <div className="flex gap-3 flex-wrap">
                      <Checkbox checked={avis.suivi?.includes('rappel_paiement')} label="Relance paiement" />
                      <Checkbox checked={avis.suivi?.includes('sensibilisation_supplementaire')} label="Sensibilisation complémentaire" />
                      <Checkbox checked={avis.suivi?.includes('signalement_incident')} label="Signalement incident" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="bg-[#eaf1f8] border border-black mt-3 p-1.5 px-3 text-center text-[10px] italic text-black font-medium leading-tight shadow-sm">
              Je soussigné(e), certifie avoir effectué la prospection de la parcelle susmentionnée et que les informations ci-dessus sont exactes et conformes à la réalité constatée sur le terrain.
            </div>

            <table className="w-full text-[11px] border-collapse border border-black mt-2">
              <thead>
                <tr>
                  <th className="border border-black bg-[#eaf1f8] font-bold p-1 w-1/3 text-black">Propriétaire / Occupant</th>
                  <th className="border border-black bg-[#eaf1f8] font-bold p-1 w-1/3 text-black">Agent de Prospection</th>
                  <th className="border border-black bg-[#eaf1f8] font-bold p-1 w-1/3 text-black">Chef de Rue Accompagnateur</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-2 align-top h-[90px] relative text-black bg-white">
                    <div className="flex flex-col gap-2">
                      <div className="flex"><span>Nom : </span><span className="ml-1 border-b border-black flex-1 truncate">{fiche.proprietaireNom}</span></div>
                      <div className="flex"><span>Signature : </span><span className="ml-1 flex-1"></span></div>
                      <div className="absolute bottom-2 left-2 right-2 flex">
                        <span>Date : </span><span className="ml-1 border-b border-black flex-1 text-center">{format(dateProsp, "dd/MM/yyyy")}</span>
                      </div>
                    </div>
                  </td>
                  <td className="border border-black p-2 align-top h-[90px] text-black bg-white">
                    <div className="flex flex-col gap-2">
                      <div className="flex"><span>Nom : </span><span className="ml-1 border-b border-black flex-1"></span></div>
                      <div className="flex"><span>Matricule : </span><span className="ml-1 border-b border-black flex-1 truncate">{fiche.agentMatricule}</span></div>
                      <div className="flex"><span>Signature : </span><span className="ml-1 flex-1"></span></div>
                    </div>
                  </td>
                  <td className="border border-black p-2 align-top h-[90px] text-black bg-white">
                    <div className="flex flex-col gap-2">
                      <div className="flex"><span>Nom : </span><span className="ml-1 border-b border-black flex-1 truncate">{fiche.chefRueNom}</span></div>
                      <div className="flex"><span>Avenue / Rue : </span><span className="ml-1 border-b border-black flex-1 truncate">{fiche.chefRueAvenue}</span></div>
                      <div className="flex"><span>Signature : </span><span className="ml-1 flex-1"></span></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          )}

          {visibleSections.avis && <div className="flex-1"></div>} {/* Spacer */}

          {visibleSections.avis && (
            <div className="text-center mt-6 text-[#184490] font-bold text-[10px] uppercase">
              COMMUNE DE {fiche.commune} - MAISON COMMUNALE
            </div>
          )}

        </div>
        </>)}
      </div>
      </div>

      {/* Legacy Notes */}
      {((visibleSections.hygiene && hygiene.notes) || (visibleSections.dechets && dechets.notes) || (visibleSections.facade && facade.notes) || (visibleSections.drainage && drainage.notes)) && (
        <div className="max-w-5xl mx-auto mt-8 p-4 bg-muted/50 rounded-lg print:break-before-page print:bg-white print:mt-0">
          <h4 className="font-bold text-sm mb-2 text-muted-foreground">Notes supplémentaires (anciennes données)</h4>
          <ul className="text-xs space-y-1">
            {visibleSections.hygiene && hygiene.notes && <li><strong>Hygiène:</strong> {hygiene.notes}</li>}
            {visibleSections.dechets && dechets.notes && <li><strong>Déchets:</strong> {dechets.notes}</li>}
            {visibleSections.facade && facade.notes && <li><strong>Façade:</strong> {facade.notes}</li>}
            {visibleSections.drainage && drainage.notes && <li><strong>Drainage:</strong> {drainage.notes}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
