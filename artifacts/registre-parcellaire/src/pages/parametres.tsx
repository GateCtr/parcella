import { useQueryClient } from '@tanstack/react-query';
import {
  getGetRubriqueSettingsQueryKey,
  useGetRubriqueSettings,
  useUpdateRubriqueSetting,
} from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { DataSpinner } from '@/components/data-spinner';
import { useToast } from '@/hooks/use-toast';
import { RUBRIQUES } from '@/lib/rubriques';

export default function Parametres() {
  const { data: settings, isLoading, isError } = useGetRubriqueSettings({
    query: { queryKey: getGetRubriqueSettingsQueryKey(), refetchInterval: 30_000 },
  });
  const update = useUpdateRubriqueSetting();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (isLoading) return <DataSpinner label="Chargement des paramètres…" />;
  if (isError || !settings) return <p role="alert" className="text-destructive">Impossible de charger les paramètres des rubriques.</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres des rubriques</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ces réglages sont communs à tous les agents. Une rubrique désactivée disparaît du formulaire et des fiches affichées ou imprimées ; les données déjà enregistrées sont conservées.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-0 p-0">
          <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
            <div>
              <p className="font-semibold">1. Identification de la parcelle</p>
              <p className="text-sm text-muted-foreground">Toujours active</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Obligatoire</span>
          </div>
          {RUBRIQUES.map(({ key, numero, titre }) => (
            <div key={key} className="flex items-center justify-between gap-4 border-b px-5 py-4 last:border-0">
              <label htmlFor={`rubrique-${key}`} className="cursor-pointer">
                <span className="block font-semibold">{numero}. {titre}</span>
                <span className="text-sm text-muted-foreground">{settings[key] ? 'Visible sur le formulaire et la fiche' : 'Masquée sur le formulaire et la fiche'}</span>
              </label>
              <Switch
                id={`rubrique-${key}`}
                checked={settings[key]}
                disabled={update.isPending}
                onCheckedChange={(active) => update.mutate({ data: { rubrique: key, active } }, {
                  onSuccess: (updated) => {
                    queryClient.setQueryData(getGetRubriqueSettingsQueryKey(), updated);
                    toast({ title: `${titre} ${active ? 'activée' : 'désactivée'}` });
                  },
                  onError: () => toast({ variant: 'destructive', title: 'Échec de l’enregistrement', description: 'Le réglage n’a pas été modifié.' }),
                })}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}