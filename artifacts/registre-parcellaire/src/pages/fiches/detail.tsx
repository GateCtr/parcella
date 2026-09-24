import { useParams, Link } from 'wouter';
import { useGetFiche, useDecideFiche, useGeneratePlaque, getGetFicheQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataSpinner } from '@/components/data-spinner';
import { MapPin, User, Phone, CheckCircle, XCircle, Printer, ArrowLeft, Home, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function FicheDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fiche, isLoading, error } = useGetFiche(id!);
  
  const decideFiche = useDecideFiche();
  const generatePlaque = useGeneratePlaque();

  if (isLoading) return <DataSpinner label="Chargement de la fiche…" />;
  if (error || !fiche) return <div className="p-8 text-center text-destructive">Erreur: Impossible de charger la fiche.</div>;

  const handleDecision = (decision: 'validee' | 'rejetee') => {
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
    generatePlaque.mutate({ id: fiche.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFicheQueryKey(fiche.id) });
        toast({ title: 'Plaque générée', description: 'Le design SVG de la plaque a été créé et ajouté à la file.' });
      },
      onError: () => {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de générer la plaque.' });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/fiches" className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), "h-8 w-8")}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Fiche N° {fiche.ficheNo}
              {fiche.statutFiche === 'validee' && <CheckCircle className="h-5 w-5 text-green-600" />}
            </h2>
            <p className="text-muted-foreground text-sm">
              Enregistrée le {format(new Date(fiche.createdAt), "dd MMMM yyyy", { locale: fr })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {fiche.statutFiche === 'soumise' && (
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
                <CheckCircle className="mr-2 h-4 w-4" /> Valider la fiche
              </Button>
            </>
          )}

          {fiche.statutFiche === 'validee' && fiche.statutPlaque === 'non_generee' && (
            <Button 
              onClick={handleGeneratePlaque}
              disabled={generatePlaque.isPending}
            >
              <Printer className="mr-2 h-4 w-4" /> Générer la plaque
            </Button>
          )}

          {fiche.statutPlaque === 'generee' && (
             <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 py-1.5 px-3">
               Plaque en file d'attente
             </Badge>
          )}
          {fiche.statutPlaque === 'imprimee' && (
             <Badge variant="secondary" className="bg-green-600/20 text-green-700 hover:bg-green-600/30 py-1.5 px-3">
               <Printer className="mr-1 h-3 w-3" /> Plaque imprimée
             </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Identification Parcellaire
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Commune</dt>
                <dd className="mt-1 font-semibold">{fiche.commune}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Quartier</dt>
                <dd className="mt-1 font-semibold">{fiche.quartier}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Avenue</dt>
                <dd className="mt-1 font-semibold">{fiche.avenue}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Numéro Parcelle</dt>
                <dd className="mt-1 font-semibold text-lg">{fiche.parcelleNo}</dd>
              </div>
              {fiche.plaqueNo && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Numéro Plaque Attribué</dt>
                  <dd className="mt-1 font-bold text-primary">{fiche.plaqueNo}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Propriétaire
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Nom complet</dt>
                <dd className="mt-1 font-semibold">{fiche.proprietaireNom}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Téléphone</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${fiche.telephone}`} className="text-primary hover:underline">{fiche.telephone}</a>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Type d'occupation</dt>
                <dd className="mt-1 capitalize">{fiche.typeOccupation}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              Caractéristiques
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Usage principal</dt>
                <dd className="mt-1 capitalize">{fiche.usageParcelle}</dd>
              </div>
              {fiche.superficie && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Superficie estimée</dt>
                  <dd className="mt-1">{fiche.superficie} m²</dd>
                </div>
              )}
              {fiche.activites && fiche.activites.length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Activités recensées</dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {fiche.activites.map(act => (
                      <Badge key={act} variant="outline">{act}</Badge>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Administration
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Agent recenseur</dt>
                <dd className="mt-1 font-mono text-sm">{fiche.agentMatricule || 'Non spécifié'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Date de prospection</dt>
                <dd className="mt-1">{format(new Date(fiche.dateProspection), "dd/MM/yyyy")}</dd>
              </div>
              {fiche.remarques && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Remarques de l'agent</dt>
                  <dd className="mt-1 text-sm italic border-l-2 pl-3 py-1 bg-muted/30">{fiche.remarques}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
