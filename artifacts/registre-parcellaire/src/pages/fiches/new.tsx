import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLocation } from 'wouter';
import { useCreateFiche, useListCommunes, checkFicheDuplicate } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { DataSpinner } from '@/components/data-spinner';
import { MapPin, User, Home, Sparkles, Trash2, LayoutTemplate, Waves, ClipboardCheck, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { FicheInput } from '@workspace/api-client-react';

const ficheSchema = z.object({
  commune: z.string().min(1, 'Requis'),
  quartier: z.string().min(1, 'Requis'),
  avenue: z.string().min(1, 'Requis'),
  parcelleNo: z.string().min(1, 'Requis'),
  
  proprietaireNom: z.string().min(1, 'Requis'),
  telephone: z.string().min(1, 'Requis'),
  typeOccupation: z.string().min(1, 'Requis'),
  
  usageParcelle: z.string().min(1, 'Requis'),
  superficie: z.coerce.number().optional(),
  activites: z.string().optional(), // We'll split this by comma later
  
  // JSON sections (using text inputs for simplicity in this frontend)
  hygieneNote: z.string().optional(),
  dechetsNote: z.string().optional(),
  facadeNote: z.string().optional(),
  drainageNote: z.string().optional(),
  
  agentMatricule: z.string().optional(),
  chefRueNom: z.string().optional(),
  dateProspection: z.string().min(1, 'Requis'),
  remarques: z.string().optional(),
});

type FicheFormValues = z.infer<typeof ficheSchema>;

const STEPS = [
  { id: 0, title: 'Localisation', icon: MapPin },
  { id: 1, title: 'Propriétaire', icon: User },
  { id: 2, title: 'Parcelle', icon: Home },
  { id: 3, title: 'Hygiène', icon: Sparkles },
  { id: 4, title: 'Déchets', icon: Trash2 },
  { id: 5, title: 'Façade', icon: LayoutTemplate },
  { id: 6, title: 'Drainage', icon: Waves },
  { id: 7, title: 'Administration', icon: ClipboardCheck },
  { id: 8, title: 'Récapitulatif', icon: CheckCircle2 },
];

export default function FicheNew() {
  const [step, setStep] = useState(0);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: communes, isLoading: loadingCommunes, isError: communesError } = useListCommunes();
  const createFiche = useCreateFiche();

  const form = useForm<FicheFormValues>({
    resolver: zodResolver(ficheSchema),
    defaultValues: {
      commune: '', quartier: '', avenue: '', parcelleNo: '',
      proprietaireNom: '', telephone: '', typeOccupation: 'proprietaire',
      usageParcelle: 'residentiel',
      dateProspection: new Date().toISOString().split('T')[0],
      activites: '',
      hygieneNote: '', dechetsNote: '', facadeNote: '', drainageNote: '',
      agentMatricule: '', chefRueNom: '', remarques: ''
    },
    mode: 'onChange'
  });

  const nextStep = async () => {
    // Validate current step fields
    let fieldsToValidate: any[] = [];
    if (step === 0) fieldsToValidate = ['commune', 'quartier', 'avenue', 'parcelleNo'];
    if (step === 1) fieldsToValidate = ['proprietaireNom', 'telephone', 'typeOccupation'];
    if (step === 2) fieldsToValidate = ['usageParcelle'];
    if (step === 7) fieldsToValidate = ['dateProspection'];

    const isValid = await form.trigger(fieldsToValidate as any);
    if (!isValid) return;

    // Check duplicate on step 0
    if (step === 0) {
      const values = form.getValues();
      try {
        const res = await checkFicheDuplicate({
          commune: values.commune,
          quartier: values.quartier,
          avenue: values.avenue,
          parcelleNo: values.parcelleNo
        });
        if (res.duplicate) {
          toast({
            variant: 'destructive',
            title: 'Doublon détecté',
            description: `Une fiche existe déjà pour cette adresse. N° Fiche: ${res.fiche?.ficheNo}`,
          });
          return;
        }
      } catch (err) {
        // Just proceed if error
      }
    }

    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = (data: FicheFormValues) => {
    const input: FicheInput = {
      commune: data.commune,
      quartier: data.quartier,
      avenue: data.avenue,
      parcelleNo: data.parcelleNo,
      proprietaireNom: data.proprietaireNom,
      telephone: data.telephone,
      typeOccupation: data.typeOccupation,
      usageParcelle: data.usageParcelle,
      superficie: data.superficie,
      dateProspection: new Date(data.dateProspection).toISOString(),
      agentMatricule: data.agentMatricule,
      chefRueNom: data.chefRueNom,
      remarques: data.remarques,
      activites: data.activites ? data.activites.split(',').map(s => s.trim()) : [],
      hygiene: data.hygieneNote ? { notes: data.hygieneNote } : undefined,
      dechets: data.dechetsNote ? { notes: data.dechetsNote } : undefined,
      facade: data.facadeNote ? { notes: data.facadeNote } : undefined,
      drainage: data.drainageNote ? { notes: data.drainageNote } : undefined,
    };

    createFiche.mutate({ data: input }, {
      onSuccess: (res) => {
        toast({ title: 'Succès', description: 'La fiche a été enregistrée avec succès.' });
        setLocation(`/fiches/${res.id}`);
      },
      onError: () => {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de créer la fiche.' });
      }
    });
  };

  const StepIcon = STEPS[step].icon;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Nouvelle fiche de recensement</h2>
          <p className="text-muted-foreground text-sm">Étape {step + 1} sur {STEPS.length}: {STEPS[step].title}</p>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {STEPS.map((s, i) => (
          <div 
            key={s.id} 
            className={`h-2 flex-1 min-w-[30px] rounded-full transition-colors ${
              i < step ? 'bg-primary' : i === step ? 'bg-primary/50' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      <Card className="border-t-4" style={{ borderTopColor: 'hsl(var(--primary))' }}>
        <CardContent className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b">
            <div className="bg-primary/10 text-primary p-2 rounded-lg">
              <StepIcon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold">{STEPS[step].title}</h3>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* ÉTAPE 0: Localisation */}
              <div className={step === 0 ? 'block space-y-4' : 'hidden'}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="commune" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commune</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingCommunes || communesError}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {communes?.map(c => (
                            <SelectItem key={c.nom} value={c.nom}>{c.nom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {loadingCommunes && <DataSpinner compact label="Chargement des communes…" />}
                      {communesError && <p role="alert" className="text-sm text-destructive">Impossible de charger les communes.</p>}
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="quartier" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quartier</FormLabel>
                      <FormControl><Input placeholder="Nom du quartier" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="avenue" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avenue / Rue</FormLabel>
                      <FormControl><Input placeholder="Nom de l'avenue" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="parcelleNo" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de parcelle</FormLabel>
                      <FormControl><Input placeholder="N°" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* ÉTAPE 1: Propriétaire */}
              <div className={step === 1 ? 'block space-y-4' : 'hidden'}>
                <FormField control={form.control} name="proprietaireNom" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet du propriétaire</FormLabel>
                    <FormControl><Input placeholder="Nom, Post-nom, Prénom" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="telephone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone de contact</FormLabel>
                      <FormControl><Input placeholder="+243..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="typeOccupation" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type d'occupation</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="proprietaire">Propriétaire résident</SelectItem>
                          <SelectItem value="locataire">Locataire</SelectItem>
                          <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* ÉTAPE 2: Parcelle */}
              <div className={step === 2 ? 'block space-y-4' : 'hidden'}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="usageParcelle" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usage principal</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="residentiel">Résidentiel</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="mixte">Mixte (Résidentiel + Commercial)</SelectItem>
                          <SelectItem value="industriel">Industriel</SelectItem>
                          <SelectItem value="institutionnel">Institutionnel (École, Église...)</SelectItem>
                          <SelectItem value="vide">Parcelle vide</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="superficie" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Superficie estimée (m²)</FormLabel>
                      <FormControl><Input type="number" placeholder="Ex: 500" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="activites" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activités commerciales (séparées par virgule)</FormLabel>
                    <FormControl><Input placeholder="Boutique, Pharmacie, Terrasse..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* ÉTAPES 3-6: Environnement (simplifiées avec Textarea) */}
              <div className={step === 3 ? 'block space-y-4' : 'hidden'}>
                <FormField control={form.control} name="hygieneNote" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observations sur l'hygiène</FormLabel>
                    <FormControl><Textarea placeholder="Présence de latrines, état de propreté..." rows={5} {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <div className={step === 4 ? 'block space-y-4' : 'hidden'}>
                <FormField control={form.control} name="dechetsNote" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gestion des déchets</FormLabel>
                    <FormControl><Textarea placeholder="Mode d'évacuation, abonnement service poubelle..." rows={5} {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <div className={step === 5 ? 'block space-y-4' : 'hidden'}>
                <FormField control={form.control} name="facadeNote" render={({ field }) => (
                  <FormItem>
                    <FormLabel>État de la façade et clôture</FormLabel>
                    <FormControl><Textarea placeholder="Peinture, type de clôture, empiètement..." rows={5} {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <div className={step === 6 ? 'block space-y-4' : 'hidden'}>
                <FormField control={form.control} name="drainageNote" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Système de drainage</FormLabel>
                    <FormControl><Textarea placeholder="Caniveaux, stagnation d'eau..." rows={5} {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>

              {/* ÉTAPE 7: Administration */}
              <div className={step === 7 ? 'block space-y-4' : 'hidden'}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="agentMatricule" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matricule de l'agent</FormLabel>
                      <FormControl><Input placeholder="AGT-XXX" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="dateProspection" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de la visite</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="chefRueNom" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du Chef de rue (Témoin)</FormLabel>
                    <FormControl><Input placeholder="Nom du témoin" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="remarques" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarques générales</FormLabel>
                    <FormControl><Textarea placeholder="Note supplémentaire pour l'administration..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* ÉTAPE 8: Récapitulatif */}
              <div className={step === 8 ? 'block space-y-4' : 'hidden'}>
                <div className="bg-muted/30 p-4 rounded-lg space-y-4 text-sm">
                  <h4 className="font-semibold text-base border-b pb-2">Veuillez vérifier les informations</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground block mb-1">Localisation</span>
                      <p className="font-medium">{form.getValues('commune')}, {form.getValues('quartier')}</p>
                      <p>Av. {form.getValues('avenue')}, N° {form.getValues('parcelleNo')}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">Propriétaire</span>
                      <p className="font-medium">{form.getValues('proprietaireNom')}</p>
                      <p>{form.getValues('telephone')}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">Usage</span>
                      <p className="capitalize">{form.getValues('usageParcelle')}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">Date visite</span>
                      <p>{form.getValues('dateProspection')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={prevStep} 
                  disabled={step === 0}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Précédent
                </Button>
                
                {step < STEPS.length - 1 ? (
                  <Button type="button" onClick={nextStep} disabled={step === 0 && (loadingCommunes || communesError)}>
                    Suivant <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    className="bg-green-600 hover:bg-green-700"
                    disabled={createFiche.isPending}
                  >
                    Soumettre la fiche <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
