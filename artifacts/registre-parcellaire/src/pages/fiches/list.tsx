import { useState } from 'react';
import { useListFiches, useListCommunes } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Eye, MapPin, Calendar } from 'lucide-react';
import { DataSpinner } from '@/components/data-spinner';
import { DataPagination } from '@/components/data-pagination';
import { usePagination } from '@/hooks/use-pagination';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function FichesList() {
  const [recherche, setRecherche] = useState('');
  const [commune, setCommune] = useState<string>('toutes');
  const [statut, setStatut] = useState<string>('tous');

  const { data: communes, isLoading: loadingCommunes, isError: communesError } = useListCommunes();
  const { data: fiches, isLoading: loadingFiches, isFetching, isError } = useListFiches({
    recherche: recherche || undefined,
    commune: commune !== 'toutes' ? commune : undefined,
    statut: statut !== 'tous' ? statut : undefined,
  });

  const { page, setPage, pageCount, pageItems, total, rangeStart, rangeEnd } =
    usePagination(fiches, 10);

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'brouillon': return <Badge variant="outline" className="text-muted-foreground">Brouillon</Badge>;
      case 'soumise': return <Badge variant="secondary" className="bg-warning/20 text-warning-foreground hover:bg-warning/30">En attente</Badge>;
      case 'validee': return <Badge variant="secondary" className="bg-green-600/20 text-green-700 hover:bg-green-600/30">Validée</Badge>;
      case 'rejetee': return <Badge variant="destructive">Rejetée</Badge>;
      default: return <Badge variant="outline">{statut}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Registre des fiches</h2>
          <p className="text-muted-foreground text-sm">Gérez et consultez toutes les fiches de recensement.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/fiches/exemple" className={buttonVariants({ variant: 'outline' })}>
            Voir un exemple
          </Link>
          <Link href="/fiches/nouvelle" className={buttonVariants({ variant: 'default' })}>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle Fiche
          </Link>
        </div>
      </div>

      <div className="bg-card p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par n° fiche, propriétaire ou parcelle..."
            className="pl-9"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Select value={commune} onValueChange={setCommune} disabled={loadingCommunes || communesError}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Commune" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toutes">Toutes les communes</SelectItem>
              {communes?.map(c => (
                <SelectItem key={c.nom} value={c.nom}>{c.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statut} onValueChange={setStatut}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les statuts</SelectItem>
              <SelectItem value="brouillon">Brouillon</SelectItem>
              <SelectItem value="soumise">En attente</SelectItem>
              <SelectItem value="validee">Validée</SelectItem>
              <SelectItem value="rejetee">Rejetée</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {loadingCommunes && <DataSpinner compact label="Chargement des communes…" />}
      {communesError && <p role="alert" className="text-sm text-destructive">Impossible de charger les communes.</p>}

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        {isFetching && !loadingFiches && <DataSpinner compact label="Actualisation des fiches…" />}

        {loadingFiches ? (
          <DataSpinner label="Chargement des fiches…" />
        ) : isError ? (
          <p className="h-32 flex items-center justify-center text-center text-destructive">Impossible de charger les fiches.</p>
        ) : total === 0 ? (
          <p className="h-32 flex items-center justify-center text-center text-muted-foreground px-4">
            Aucune fiche trouvée correspondant à vos critères.
          </p>
        ) : (
          <>
            {/* Vue mobile : cartes */}
            <ul className="divide-y md:hidden">
              {pageItems.map((fiche) => (
                <li key={fiche.id}>
                  <a
                    href={`${import.meta.env.BASE_URL}fiches/${encodeURIComponent(fiche.id)}`}
                    className="block p-4 hover:bg-muted/50"
                    aria-label={`Voir la fiche ${fiche.ficheNo}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{fiche.ficheNo}</p>
                        <p className="text-sm text-muted-foreground truncate">{fiche.proprietaireNom}</p>
                      </div>
                      {getStatutBadge(fiche.statutFiche)}
                    </div>
                    <div className="mt-2 flex flex-col gap-1 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{fiche.commune}, {fiche.quartier} · Av. {fiche.avenue}, N° {fiche.parcelleNo}</span>
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {format(new Date(fiche.createdAt), "dd/MM/yyyy")}
                      </span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>

            {/* Vue bureau : tableau */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Fiche</TableHead>
                    <TableHead>Propriétaire</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((fiche) => (
                    <TableRow key={fiche.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{fiche.ficheNo}</TableCell>
                      <TableCell>{fiche.proprietaireNom}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {fiche.commune}, {fiche.quartier}
                          </span>
                          <span className="text-muted-foreground text-xs ml-4">
                            Av. {fiche.avenue}, N° {fiche.parcelleNo}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(fiche.createdAt), "dd/MM/yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatutBadge(fiche.statutFiche)}
                      </TableCell>
                      <TableCell className="text-right">
                        <a
                          href={`${import.meta.env.BASE_URL}fiches/${encodeURIComponent(fiche.id)}`}
                          className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                          title="Voir les détails"
                          aria-label={`Voir la fiche ${fiche.ficheNo}`}
                        >
                          <Eye className="h-4 w-4" />
                        </a>
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
              itemLabel="fiche"
            />
          </>
        )}
      </div>
    </div>
  );
}
