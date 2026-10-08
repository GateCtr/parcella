import { useListPlaques, useMarkPlaquePrinted, getListPlaquesQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, buttonVariants } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DataSpinner } from '@/components/data-spinner';
import { DataPagination } from '@/components/data-pagination';
import { usePagination } from '@/hooks/use-pagination';
import { MapPin, Check, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export default function ImprimeriePage() {
  const { data: plaques, isLoading, isFetching, isError } = useListPlaques();
  const markPrinted = useMarkPlaquePrinted();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const canMarkPrinted = user?.role === 'admin_principal' || user?.role === 'validateur';

  const { page, setPage, pageCount, pageItems, total, rangeStart, rangeEnd } =
    usePagination(plaques, 10);

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
        {isFetching && !isLoading && <DataSpinner compact label="Actualisation des plaques…" />}

        {isLoading ? (
          <DataSpinner label="Chargement des plaques…" />
        ) : isError ? (
          <p className="h-32 flex items-center justify-center text-center text-destructive">Impossible de charger les plaques.</p>
        ) : total === 0 ? (
          <p className="h-32 flex items-center justify-center text-center text-muted-foreground px-4">
            Aucune plaque dans la file d'attente.
          </p>
        ) : (
          <>
            {/* Vue mobile + tablette : cartes */}
            <ul className="divide-y lg:hidden">
              {pageItems.map((plaque) => (
                <li key={plaque.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-primary truncate">{plaque.plaqueNo}</p>
                      <p className="font-mono text-xs text-muted-foreground truncate">{plaque.ficheNo}</p>
                    </div>
                    {plaque.statut === 'imprimee' ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Imprimée</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">En attente</Badge>
                    )}
                  </div>
                  <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{plaque.commune}, {plaque.quartier} · Av. {plaque.avenue}</span>
                    </span>
                    <span>{format(new Date(plaque.genereLe), "dd/MM/yyyy HH:mm")}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/fiches/${plaque.ficheId}/plaque`}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex-1 justify-center')}
                    >
                      <Eye className="mr-1 h-4 w-4" /> Aperçu
                    </Link>
                    {plaque.statut !== 'imprimee' && canMarkPrinted && (
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 justify-center"
                        onClick={() => handleMarkPrinted(plaque.id)}
                        disabled={markPrinted.isPending}
                      >
                        <Check className="mr-1 h-4 w-4" /> Marquer imprimée
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* Vue bureau : tableau (défilement horizontal si nécessaire) */}
            <div className="hidden lg:block">
              <Table className="min-w-[820px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">N° Plaque</TableHead>
                    <TableHead className="whitespace-nowrap">Fiche associée</TableHead>
                    <TableHead className="whitespace-nowrap">Localisation</TableHead>
                    <TableHead className="whitespace-nowrap">Date de génération</TableHead>
                    <TableHead className="whitespace-nowrap">Statut</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((plaque) => (
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
                          <Link
                            href={`/fiches/${plaque.ficheId}/plaque`}
                            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                            title="Aperçu de la plaque"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {plaque.statut !== 'imprimee' && canMarkPrinted && (
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
                  ))}
                </TableBody>
              </Table>
            </div>

            <DataPagination
              page={page}
              pageCount={pageCount}
              onPageChange={setPage}
              total={total}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              itemLabel="plaque"
            />
          </>
        )}
      </div>
    </div>
  );
}
