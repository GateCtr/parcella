import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { type Fiche, useUpdateFicheLocalite, getGetFicheQueryKey, getListFichesQueryKey, getListPlaquesQueryKey } from '@workspace/api-client-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function LocaliteEditor({ fiche }: { fiche: Fiche }) {
  const [value, setValue] = useState(fiche.localite ?? '');
  const queryClient = useQueryClient();
  const updateLocalite = useUpdateFicheLocalite();
  const { toast } = useToast();

  useEffect(() => {
    setValue(fiche.localite ?? '');
  }, [fiche.localite]);

  const save = () => {
    updateLocalite.mutate({ id: fiche.id, data: { localite: value.trim() || null } }, {
      onSuccess: (updated) => {
        queryClient.setQueryData(getGetFicheQueryKey(fiche.id), updated);
        queryClient.invalidateQueries({ queryKey: getListFichesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListPlaquesQueryKey() });
        toast({ title: 'Localité enregistrée', description: 'Actualisez la plaque pour faire apparaître la nouvelle adresse.' });
      },
      onError: () => toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d’enregistrer la localité.' }),
    });
  };

  return (
    <div className="no-print rounded-lg border bg-card p-4">
      <label htmlFor="plaque-localite" className="block text-sm font-semibold mb-1">Localité — ligne LO/</label>
      <p className="text-xs text-muted-foreground mb-3">Renseignez la localité réelle de cette parcelle. Elle est distincte du quartier ; aucune valeur du modèle n’est reprise automatiquement.</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input id="plaque-localite" value={value} onChange={(event) => setValue(event.target.value)} maxLength={120} placeholder="Ex. Foire Agricole" className="sm:max-w-md" />
        <Button type="button" variant="outline" onClick={save} disabled={updateLocalite.isPending || value.trim() === (fiche.localite ?? '')}>
          {updateLocalite.isPending ? 'Enregistrement…' : 'Enregistrer la localité'}
        </Button>
      </div>
    </div>
  );
}