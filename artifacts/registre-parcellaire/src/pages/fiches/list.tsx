import { useState } from 'react';
import { useListFiches, useListCommunes } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Eye, MapPin, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function FichesList() {
  const [recherche, setRecherche] = useState('');
  const [commune, setCommune] = useState<string>('toutes');
  const [statut, setStatut] = useState<string>('tous');

  const { data: communes, isLoading: loadingCommunes } = useListCommunes();
  const { data: fiches, isLoading: loadingFiches } = useListFiches({
    recherche: recherche || undefined,
    commune: commune !== 'toutes' ? commune : undefined,
    statut: statut !== 'tous' ? statut : undefined,
  });

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
        <Link href="/fiches/nouvelle" className={buttonVariants({ variant: 'default' })}>
          <Plus className="mr-2 h-4 w-4" /> Nouvelle Fiche
        </Link>
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
          <Select value={commune} onValueChange={setCommune}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Commune" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toutes">Toutes les communes</SelectItem>
              {communes?.map(c => (
                <SelectItem key={c.code} value={c.nom}>{c.nom}</SelectItem>
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

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
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
              {loadingFiches ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : fiches?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Aucune fiche trouvée correspondant à vos critères.
                  </TableCell>
                </TableRow>
              ) : (
                fiches?.map((fiche) => (
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
                      <Link 
                        href={`/fiches/${fiche.id}`} 
                        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
