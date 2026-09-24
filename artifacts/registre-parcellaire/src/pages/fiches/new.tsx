import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useLocation } from 'wouter';
import { useCreateFiche, useListCommunes, useGetRubriqueSettings, getGetRubriqueSettingsQueryKey, checkFicheDuplicate, FicheInput } from '@workspace/api-client-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { DataSpinner } from '@/components/data-spinner';
import { MapPin, Info, Sparkles, Trash2, LayoutTemplate, Waves, Briefcase, FileText, ClipboardCheck, ChevronRight, ChevronLeft, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { 
  typeOccupationOptions, usageParcelleOptions, plaqueExistanteOptions, paiementOptions,
  sensibilisationOptions, hygieneOptions, modeEliminationOptions, bacOrduresOptions, 
  dechetsVisiblesOptions, etatFacadeOptions, clotureOptions, emplacementOptions, 
  visibiliteOptions, canalisationOptions, risqueOptions, activitesOptions, 
  avisGlobalOptions, prioriteOptions, suiviOptions 
} from '@/components/fiche/constants';
import { CustomRadioGroup, CustomMultiSelect, CustomSelect } from '@/components/fiche/form-helpers';
import { RUBRIQUES, type RubriqueKey } from '@/lib/rubriques';

const ficheSchema = z.object({
  commune: z.string().min(1, 'Requis'),
  quartier: z.string().min(1, 'Requis'),
  localite: z.string().max(120, '120 caractères maximum').optional(),
  avenue: z.string().min(1, 'Requis'),
  parcelleNo: z.string().min(1, 'Requis'),
  
  proprietaireNom: z.string().min(1, 'Requis'),
  telephone: z.string().min(1, 'Requis'),
  typeOccupation: z.string().min(1, 'Requis'),
  
  superficie: z.union([
    z.string().transform(v => (v === '' ? undefined : Number(v))),
    z.number()
  ]).refine(val => val === undefined || (!isNaN(val) && val > 0), "Doit être > 0").optional(),
  
  usageParcelle: z.string().min(1, 'Requis'),

  plaqueExistante: z.string(),
  statutPaiement: z.string(),
  recuNo: z.string().optional(),
  sensibilisation: z.string(),

  hygiene_proprete: z.string(),
  hygiene_ordures: z.string(),
  hygiene_vegetation: z.string(),
  hygiene_latrines: z.string(),
  hygiene_eauxStagnantes: z.string(),

  dechets_modeElimination: z.string(),
  dechets_bacOrdures: z.string(),
  dechets_visibles: z.string(),

  facade_etat: z.string(),
  facade_cloture: z.string(),
  facade_emplacement: z.string(),
  facade_emplacementAutre: z.string().optional(),
  facade_visibilite: z.string(),

  drainage_canal: z.string(),
  drainage_risque: z.string(),

  activites: z.array(z.string()).optional(),
  activites_autres: z.string().optional(),

  remarques: z.string().optional(),

  avis_global: z.string(),
  avis_priorite: z.string(),
  avis_suivi: z.array(z.string()).optional(),
  avis_attestation: z.boolean(),

  agentMatricule: z.string().optional(),
  chefRueNom: z.string().optional(),
  chefRueAvenue: z.string().optional(),
  dateProspection: z.string().min(1, 'Requis'),
});

type FicheFormValues = z.infer<typeof ficheSchema>;

const REQUIRED_BY_RUBRIQUE = {
  adressage: ['plaqueExistante', 'statutPaiement', 'sensibilisation'],
  hygiene: ['hygiene_proprete', 'hygiene_ordures', 'hygiene_vegetation', 'hygiene_latrines', 'hygiene_eauxStagnantes'],
  dechets: ['dechets_modeElimination', 'dechets_bacOrdures', 'dechets_visibles'],
  facade: ['facade_etat', 'facade_cloture', 'facade_emplacement', 'facade_visibilite'],
  drainage: ['drainage_canal', 'drainage_risque'],
  activites: [],
  remarques: [],
  avis: ['avis_global', 'avis_priorite'],
} as const satisfies Record<RubriqueKey, readonly (keyof FicheFormValues)[]>;

const STEPS = [
  { id: 0, title: 'Localisation', icon: MapPin },
  { id: 1, title: 'Parcelle et propriétaire', icon: FileText },
  { id: 2, title: 'Adressage', icon: Info },
  { id: 3, title: 'Hygiène', icon: Sparkles },
  { id: 4, title: 'Déchets', icon: Trash2 },
  { id: 5, title: 'Façade', icon: LayoutTemplate },
  { id: 6, title: 'Drainage', icon: Waves },
  { id: 7, title: 'Activités', icon: Briefcase },
  { id: 8, title: 'Remarques', icon: FileText },
  { id: 9, title: 'Avis & Admin.', icon: ClipboardCheck },
];

export default function FicheNew() {
  const [step, setStep] = useState(0);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: communes, isLoading: loadingCommunes, isError: communesError } = useListCommunes();
  const { data: settings, isLoading: loadingSettings, isError: settingsError } = useGetRubriqueSettings({
    query: { queryKey: getGetRubriqueSettingsQueryKey(), refetchInterval: 30_000 },
  });
  const createFiche = useCreateFiche();
  const activeSteps = useMemo(
    () => STEPS.filter((item) => item.id < 2 || settings?.[RUBRIQUES[item.id - 2].key] === true),
    [settings],
  );
  const activeIndex = activeSteps.findIndex((item) => item.id === step);
  const validationSchema = useMemo(() => ficheSchema.superRefine((data, ctx) => {
    if (!settings) return;
    for (const { key } of RUBRIQUES) {
      if (!settings[key]) continue;
      for (const field of REQUIRED_BY_RUBRIQUE[key]) {
        if (!String(data[field] ?? '').trim()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Requis', path: [field] });
        }
      }
    }
    if (settings.facade && data.facade_emplacement === 'autre' && !data.facade_emplacementAutre?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Veuillez préciser l'emplacement", path: ['facade_emplacementAutre'] });
    }
    if (settings.avis && !data.avis_attestation) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La certification est requise pour enregistrer.', path: ['avis_attestation'] });
    }
  }), [settings]);

  const form = useForm<FicheFormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      commune: '', quartier: '', localite: '', avenue: '', parcelleNo: '',
      proprietaireNom: '', telephone: '', typeOccupation: '', usageParcelle: '',
      superficie: '' as any,
      plaqueExistante: '', statutPaiement: '', recuNo: '', sensibilisation: '',
      hygiene_proprete: '', hygiene_ordures: '', hygiene_vegetation: '', hygiene_latrines: '', hygiene_eauxStagnantes: '',
      dechets_modeElimination: '', dechets_bacOrdures: '', dechets_visibles: '',
      facade_etat: '', facade_cloture: '', facade_emplacement: '', facade_emplacementAutre: '', facade_visibilite: '',
      drainage_canal: '', drainage_risque: '',
      activites: [], activites_autres: '',
      remarques: '',
      avis_global: '', avis_priorite: '', avis_suivi: [],
      avis_attestation: false,
      agentMatricule: '', chefRueNom: '', chefRueAvenue: '',
      dateProspection: new Date().toISOString().split('T')[0]
    },
    mode: 'onChange'
  });

  useEffect(() => {
    if (settings && activeIndex < 0) {
      setStep(activeSteps.find((item) => item.id > step)?.id ?? activeSteps[activeSteps.length - 1].id);
    }
  }, [settings, activeIndex, activeSteps, step]);

  useEffect(() => {
    const main = pageRef.current?.closest('main');
    if (main) main.scrollTop = 0;
  }, [step]);

  const checkAddress = async (values: FicheFormValues): Promise<boolean> => {
    setIsCheckingDuplicate(true);
    try {
      const res = await checkFicheDuplicate({
        commune: values.commune,
        quartier: values.quartier,
        avenue: values.avenue,
        parcelleNo: values.parcelleNo,
      });
      if (res.duplicate) {
        toast({
          variant: 'destructive',
          title: 'Doublon détecté',
          description: `Une fiche existe déjà pour cette adresse. N° Fiche: ${res.fiche?.ficheNo}`,
        });
        return false;
      }
      return true;
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erreur de vérification',
        description: 'Impossible de vérifier les doublons. Veuillez réessayer.',
      });
      return false;
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  const nextStep = async () => {
    if (isCheckingDuplicate || activeIndex < 0) return;
    let fieldsToValidate: (keyof FicheFormValues)[] = [];
    if (step === 0) fieldsToValidate = ['commune', 'quartier', 'localite', 'avenue', 'parcelleNo'];
    if (step === 1) fieldsToValidate = ['proprietaireNom', 'telephone', 'typeOccupation', 'usageParcelle', 'superficie', 'dateProspection'];
    if (step === 2) fieldsToValidate = ['plaqueExistante', 'statutPaiement', 'recuNo', 'sensibilisation'];
    if (step === 3) fieldsToValidate = ['hygiene_proprete', 'hygiene_ordures', 'hygiene_vegetation', 'hygiene_latrines', 'hygiene_eauxStagnantes'];
    if (step === 4) fieldsToValidate = ['dechets_modeElimination', 'dechets_bacOrdures', 'dechets_visibles'];
    if (step === 5) fieldsToValidate = ['facade_etat', 'facade_cloture', 'facade_emplacement', 'facade_emplacementAutre', 'facade_visibilite'];
    if (step === 6) fieldsToValidate = ['drainage_canal', 'drainage_risque'];
    if (step === 7) fieldsToValidate = ['activites', 'activites_autres'];
    if (step === 8) fieldsToValidate = ['remarques'];

    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate);
      if (!isValid) return;
    }
    if (step === 5 && form.getValues('facade_emplacement') === 'autre' && !form.getValues('facade_emplacementAutre')?.trim()) {
      form.setError('facade_emplacementAutre', { message: "Veuillez préciser l'emplacement" });
      return;
    }

    if (step === 0 && !(await checkAddress(form.getValues()))) return;
    setStep(activeSteps[activeIndex + 1].id);
  };

  const prevStep = () => {
    if (activeIndex > 0) setStep(activeSteps[activeIndex - 1].id);
  };

  const onInvalid = (errors: FieldErrors<FicheFormValues>) => {
    const fieldsByStep: (keyof FicheFormValues)[][] = [
      ['commune', 'quartier', 'localite', 'avenue', 'parcelleNo'],
      ['proprietaireNom', 'telephone', 'typeOccupation', 'usageParcelle', 'superficie', 'dateProspection'],
      ['plaqueExistante', 'statutPaiement', 'sensibilisation'],
      ['hygiene_proprete', 'hygiene_ordures', 'hygiene_vegetation', 'hygiene_latrines', 'hygiene_eauxStagnantes'],
      ['dechets_modeElimination', 'dechets_bacOrdures', 'dechets_visibles'],
      ['facade_etat', 'facade_cloture', 'facade_emplacement', 'facade_emplacementAutre', 'facade_visibilite'],
      ['drainage_canal', 'drainage_risque'],
      [],
      [],
      ['avis_global', 'avis_priorite', 'avis_attestation'],
    ];
    const firstInvalidStep = fieldsByStep.findIndex(fields => fields.some(field => errors[field]));
    if (firstInvalidStep >= 0) setStep(firstInvalidStep);
    toast({ variant: 'destructive', title: 'Fiche incomplète', description: 'Vérifiez les champs indiqués avant l’enregistrement.' });
  };

  const onSubmit = async (data: FicheFormValues) => {
    if (!settings || isCheckingDuplicate) return;
    const input: FicheInput = {
      commune: data.commune,
      quartier: data.quartier,
      localite: data.localite?.trim() || null,
      avenue: data.avenue,
      parcelleNo: data.parcelleNo,
      proprietaireNom: data.proprietaireNom,
      telephone: data.telephone,
      typeOccupation: data.typeOccupation,
      superficie: typeof data.superficie === 'number' ? data.superficie : undefined,
      usageParcelle: data.usageParcelle,
      
      ...(settings.adressage ? {
        plaqueExistante: data.plaqueExistante,
        statutPaiement: data.statutPaiement,
        recuNo: data.recuNo,
        sensibilisation: data.sensibilisation,
      } : {}),
      
      hygiene: settings.hygiene ? {
        proprete: data.hygiene_proprete,
        ordures: data.hygiene_ordures,
        vegetation: data.hygiene_vegetation,
        latrines: data.hygiene_latrines,
        eauxStagnantes: data.hygiene_eauxStagnantes,
      } : {},
      
      dechets: settings.dechets ? {
        modeElimination: data.dechets_modeElimination,
        bacOrdures: data.dechets_bacOrdures,
        visibles: data.dechets_visibles,
      } : {},
      
      facade: settings.facade ? {
        etat: data.facade_etat,
        cloture: data.facade_cloture,
        emplacement: data.facade_emplacement,
        emplacementAutre: data.facade_emplacementAutre,
        visibilite: data.facade_visibilite,
      } : {},
      
      drainage: settings.drainage ? {
        canal: data.drainage_canal,
        risque: data.drainage_risque,
      } : {},
      
      activites: settings.activites ? [
        ...(data.activites || []),
        ...(data.activites_autres ? [data.activites_autres] : [])
      ] : [],
      
      remarques: settings.remarques ? data.remarques : undefined,
      
      avis: settings.avis ? {
        global: data.avis_global,
        priorite: data.avis_priorite,
        suivi: data.avis_suivi,
        attestation: data.avis_attestation,
      } : {},
      
      agentMatricule: settings.avis ? data.agentMatricule : undefined,
      chefRueNom: settings.avis ? data.chefRueNom : undefined,
      chefRueAvenue: settings.avis ? data.chefRueAvenue : undefined,
      dateProspection: new Date(data.dateProspection).toISOString(),
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
  const communeOptions = communes?.map(c => ({ label: c.nom, value: c.nom })) || [];

  if (loadingSettings) return <DataSpinner label="Chargement des rubriques actives…" />;
  if (settingsError || !settings) return <p role="alert" className="text-destructive">Impossible de charger les paramètres des rubriques. Réessayez avant de créer une fiche.</p>;

  return (
    <div ref={pageRef} className="mx-auto max-w-3xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouvelle prospection</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Remplissez le formulaire ci-dessous. La fiche complète s’affichera sur une autre page après l’enregistrement.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link href="/fiches/exemple" target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline' })}>
            Voir un exemple
          </Link>
          <Link href="/fiches" className={buttonVariants({ variant: 'outline' })}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Registre des fiches
          </Link>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {activeSteps.map((s, i) => (
          <div 
            key={s.id} 
            className={`h-2 flex-1 min-w-[30px] rounded-full transition-colors ${
              i < activeIndex ? 'bg-primary' : i === activeIndex ? 'bg-primary/50' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      <Card className="border-t-4 shadow-md" style={{ borderTopColor: 'hsl(var(--primary))' }}>
        <CardContent className="p-4 sm:p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3 border-b pb-4">
            <div className="bg-primary/10 text-primary p-2 rounded-lg">
              <StepIcon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-tight">{step + 1}. {STEPS[step].title}</h3>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
              
              {/* ÉTAPE 0: Localisation */}
              <div className={step === 0 ? 'block space-y-6' : 'hidden'}>
                <div className="space-y-4 bg-muted/20 p-4 rounded-lg border">
                  <h4 className="font-semibold border-b pb-2">Localisation</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      {loadingCommunes ? (
                        <DataSpinner compact label="Chargement..." />
                      ) : (
                        <CustomSelect form={form} name="commune" label="Commune *" options={communeOptions} />
                      )}
                      {communesError && <p className="text-sm text-destructive mt-1">Erreur de chargement</p>}
                    </div>
                    <FormField control={form.control} name="quartier" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Quartier *</FormLabel>
                        <FormControl><Input className="h-12" placeholder="Nom du quartier" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="avenue" render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-base font-semibold">Avenue / Rue *</FormLabel>
                        <FormControl><Input className="h-12" placeholder="Nom de l'avenue" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="parcelleNo" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">N° Parcelle *</FormLabel>
                        <FormControl><Input className="h-12" placeholder="N°" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="localite" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Localité</FormLabel>
                      <FormControl><Input className="h-12" placeholder="Ex. Foire Agricole — ne pas répéter le quartier" maxLength={120} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* ÉTAPE 1: Parcelle et propriétaire */}
              <div className={step === 1 ? 'block space-y-6' : 'hidden'}>
                <div className="space-y-4 bg-muted/20 p-4 rounded-lg border">
                  <h4 className="font-semibold border-b pb-2">Propriétaire et Parcelle</h4>
                  <FormField control={form.control} name="proprietaireNom" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Nom du propriétaire *</FormLabel>
                      <FormControl><Input className="h-12" placeholder="Nom complet" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="telephone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Téléphone *</FormLabel>
                      <FormControl><Input className="h-12" placeholder="+243..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <CustomRadioGroup form={form} name="typeOccupation" label="Occupation *" options={typeOccupationOptions} />
                  <CustomRadioGroup form={form} name="usageParcelle" label="Usage de la parcelle *" options={usageParcelleOptions} />
                  
                  <FormField control={form.control} name="superficie" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Superficie (m²)</FormLabel>
                      <FormControl><Input className="h-12" type="number" placeholder="Ex: 500 (Optionnel)" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="dateProspection" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Date de prospection *</FormLabel>
                      <FormControl><Input className="h-12" type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* ÉTAPE 2: Adressage */}
              <div className={step === 2 && settings.adressage ? 'block space-y-6' : 'hidden'}>
                <CustomRadioGroup form={form} name="plaqueExistante" label="Plaque existante *" options={plaqueExistanteOptions} />
                <CustomRadioGroup form={form} name="statutPaiement" label="Paiement de la plaque *" options={paiementOptions} />
                
                <FormField control={form.control} name="recuNo" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Numéro de reçu</FormLabel>
                    <FormControl><Input className="h-12" placeholder="N° du reçu de paiement" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <CustomRadioGroup form={form} name="sensibilisation" label="Niveau de sensibilisation *" options={sensibilisationOptions} />
              </div>

              {/* ÉTAPE 3: Hygiène */}
              <div className={step === 3 && settings.hygiene ? 'block space-y-6' : 'hidden'}>
                <CustomRadioGroup form={form} name="hygiene_proprete" label="Propreté générale *" options={hygieneOptions} />
                <CustomRadioGroup form={form} name="hygiene_ordures" label="Gestion des ordures ménagères *" options={hygieneOptions} />
                <CustomRadioGroup form={form} name="hygiene_vegetation" label="Végétation non entretenue *" options={hygieneOptions} />
                <CustomRadioGroup form={form} name="hygiene_latrines" label="Salubrité des latrines *" options={hygieneOptions} />
                <CustomRadioGroup form={form} name="hygiene_eauxStagnantes" label="Eaux stagnantes *" options={hygieneOptions} />
              </div>

              {/* ÉTAPE 4: Déchets */}
              <div className={step === 4 && settings.dechets ? 'block space-y-6' : 'hidden'}>
                <CustomRadioGroup form={form} name="dechets_modeElimination" label="Mode d'élimination des déchets *" options={modeEliminationOptions} layout="col" />
                <CustomRadioGroup form={form} name="dechets_bacOrdures" label="État du bac à ordures *" options={bacOrduresOptions} />
                <CustomRadioGroup form={form} name="dechets_visibles" label="Déchets visibles devant la parcelle *" options={dechetsVisiblesOptions} />
              </div>

              {/* ÉTAPE 5: Façade */}
              <div className={step === 5 && settings.facade ? 'block space-y-6' : 'hidden'}>
                <CustomRadioGroup form={form} name="facade_etat" label="État de la façade *" options={etatFacadeOptions} />
                <CustomRadioGroup form={form} name="facade_cloture" label="Type de clôture *" options={clotureOptions} />
                <CustomRadioGroup form={form} name="facade_emplacement" label="Emplacement idéal de la plaque *" options={emplacementOptions} />
                
                {form.watch('facade_emplacement') === 'autre' && (
                  <FormField control={form.control} name="facade_emplacementAutre" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Préciser l'emplacement *</FormLabel>
                      <FormControl><Input className="h-12" placeholder="Autre emplacement" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
                
                <CustomRadioGroup form={form} name="facade_visibilite" label="Visibilité *" options={visibiliteOptions} />
              </div>

              {/* ÉTAPE 6: Drainage */}
              <div className={step === 6 && settings.drainage ? 'block space-y-6' : 'hidden'}>
                <CustomRadioGroup form={form} name="drainage_canal" label="Canalisation *" options={canalisationOptions} layout="col" />
                <CustomRadioGroup form={form} name="drainage_risque" label="Risque d'érosion / inondation *" options={risqueOptions} />
              </div>

              {/* ÉTAPE 7: Activités */}
              <div className={step === 7 && settings.activites ? 'block space-y-6' : 'hidden'}>
                <CustomMultiSelect form={form} name="activites" label="Activités recensées (Sélection multiple)" options={activitesOptions} />
                <FormField control={form.control} name="activites_autres" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Autres activités</FormLabel>
                    <FormControl><Input className="h-12" placeholder="Précisez si autre..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* ÉTAPE 8: Remarques */}
              <div className={step === 8 && settings.remarques ? 'block space-y-6' : 'hidden'}>
                <FormField control={form.control} name="remarques" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Remarques et observations de l'agent</FormLabel>
                    <FormControl><Textarea className="min-h-[160px] resize-none" placeholder="Saisissez vos observations ici..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* ÉTAPE 9: Avis de l'agent */}
              <div className={step === 9 && settings.avis ? 'block space-y-6' : 'hidden'}>
                <CustomRadioGroup form={form} name="avis_global" label="Avis global *" options={avisGlobalOptions} />
                <CustomRadioGroup form={form} name="avis_priorite" label="Priorité d'intervention *" options={prioriteOptions} />
                <CustomMultiSelect form={form} name="avis_suivi" label="Actions de suivi recommandées" options={suiviOptions} />
                
                <div className="mt-6">
                  <FormField control={form.control} name="agentMatricule" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Matricule de l'agent</FormLabel>
                      <FormControl><Input className="h-12" placeholder="Ex: AGT-001" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="chefRueNom" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Nom du Chef de rue</FormLabel>
                      <FormControl><Input className="h-12" placeholder="Nom du chef" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="chefRueAvenue" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Avenue du Chef de rue</FormLabel>
                      <FormControl><Input className="h-12" placeholder="Nom de l'avenue" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="mt-8 p-6 bg-muted/30 border-2 rounded-xl">
                  <FormField control={form.control} name="avis_attestation" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-4 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="h-6 w-6 mt-1 data-[state=checked]:bg-green-600 data-[state=checked]:text-white"
                        />
                      </FormControl>
                      <div className="space-y-2">
                        <FormLabel className="text-base font-bold leading-tight cursor-pointer">
                          Certification sur l'honneur *
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Je certifie que les informations recueillies dans cette fiche sont exactes et ont été 
                          constatées lors de la visite sur le terrain. En cochant cette case, je valide ma soumission.
                        </p>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="mt-8 flex justify-between gap-2 border-t border-border/60 pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={prevStep} 
                  disabled={activeIndex <= 0 || isCheckingDuplicate || createFiche.isPending}
                  className="h-12 px-3 sm:px-6"
                >
                  <ChevronLeft className="mr-2 h-5 w-5" /> Précédent
                </Button>
                
                {activeIndex < activeSteps.length - 1 ? (
                  <Button 
                    type="button" 
                    onClick={nextStep} 
                    disabled={step === 0 && (loadingCommunes || communesError) || isCheckingDuplicate || activeIndex < 0}
                    className="h-12 px-3 sm:px-6"
                  >
                    {isCheckingDuplicate ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Vérification...</>
                    ) : (
                      <>Suivant <ChevronRight className="ml-2 h-5 w-5" /></>
                    )}
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    className="h-12 px-3 sm:px-8 bg-green-600 hover:bg-green-700 text-white font-bold"
                    disabled={createFiche.isPending || isCheckingDuplicate || (step === 0 && (loadingCommunes || communesError))}
                  >
                    {createFiche.isPending ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Enregistrement...</>
                    ) : (
                      <>Enregistrer la fiche <CheckCircle2 className="ml-2 h-5 w-5" /></>
                    )}
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