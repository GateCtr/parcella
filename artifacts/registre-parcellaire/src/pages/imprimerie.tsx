import { useListPlaques, useMarkPlaquePrinted, getListPlaquesQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Printer, MapPin, Check, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ImprimeriePage() {
  const { data: plaques, isLoading } = useListPlaques();
  const markPrinted = useMarkPlaquePrinted();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [previewSvg, setPreviewSvg] = useState<string | null>(null);

  const handleMarkPrinted = (id: string) => {
    markPrinted.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPlaquesQueryKey() });
        toast({ title: 'Statut mis à jour', description: 'La plaque a été marquée comme imprimée.' });
      },
      onError: () => {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le statut.' });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">File d'impression</h2>
          <p className="text-muted-foreground text-sm">Gérez les plaques parcellaires générées prêtes à être produites.</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Plaque</TableHead>
                <TableHead>Fiche associée</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Date de génération</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : plaques?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Aucune plaque dans la file d'attente.
                  </TableCell>
                </TableRow>
              ) : (
                plaques?.map((plaque) => (
                  <TableRow key={plaque.id} className="hover:bg-muted/50">
                    <TableCell className="font-bold text-primary">{plaque.plaqueNo}</TableCell>
                    <TableCell className="font-mono text-sm">{plaque.ficheNo}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {plaque.commune}, {plaque.quartier}
                        </span>
                        <span className="text-muted-foreground text-xs ml-4">
                          Av. {plaque.avenue}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(plaque.genereLe), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      {plaque.statut === 'imprimee' ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Imprimée</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">En attente</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setPreviewSvg(plaque.svg)}
                          title="Aperçu du SVG"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {plaque.statut !== 'imprimee' && (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleMarkPrinted(plaque.id)}
                            disabled={markPrinted.isPending}
                          >
                            <Check className="mr-1 h-4 w-4" /> Marquer imprimée
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!previewSvg} onOpenChange={(open) => !open && setPreviewSvg(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aperçu de la plaque</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-4 bg-muted/30 rounded-lg">
            {previewSvg && (
              <div 
                className="w-full max-w-[300px] border shadow-sm bg-white" 
                dangerouslySetInnerHTML={{ __html: previewSvg }} 
              />
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setPreviewSvg(null)}>Fermer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
