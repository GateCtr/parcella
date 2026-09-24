import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListUsers,
  useCreateUser,
  useUpdateUser,
  useRotateUserCode,
  getListUsersQueryKey,
} from '@workspace/api-client-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataSpinner } from '@/components/data-spinner';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, RefreshCw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Utilisateurs() {
  const { data: users, isLoading } = useListUsers({
    query: { queryKey: getListUsersQueryKey() },
  });
  type ListedUser = NonNullable<typeof users>[number];
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const rotateMutation = useRotateUserCode();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin_principal' | 'validateur' | 'agent'>('agent');
  const [newCode, setNewCode] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ data: { email: newEmail, role: newRole } }, {
      onSuccess: (data) => {
        setNewCode(data.accessCode);
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: 'Utilisateur créé' });
      },
      onError: () => {
        toast({ variant: 'destructive', title: 'Erreur lors de la création' });
      }
    });
  };

  const handleUpdateRole = (id: string, role: string) => {
    updateMutation.mutate({ id, data: { role } as any }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: 'Rôle mis à jour' });
      },
      onError: () => toast({ variant: 'destructive', title: 'Erreur lors de la mise à jour' })
    });
  };

  const handleUpdateActive = (id: string, active: boolean) => {
    updateMutation.mutate({ id, data: { active } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: 'Statut mis à jour' });
      },
      onError: () => toast({ variant: 'destructive', title: 'Erreur lors de la mise à jour' })
    });
  };

  const handleRotate = (id: string) => {
    if (!confirm('Voulez-vous vraiment générer un nouveau code d\'accès ? L\'ancien code ne fonctionnera plus.')) return;
    rotateMutation.mutate({ id }, {
      onSuccess: (data) => {
        setNewCode(data.accessCode);
        toast({ title: 'Nouveau code généré' });
      },
      onError: () => toast({ variant: 'destructive', title: 'Erreur lors de la génération' })
    });
  };

  const handleDismissCode = () => {
    setNewCode(null);
  };

  const roleControl = (user: ListedUser, mobile = false) => {
    if (user.role === 'admin_principal') {
      return (
        <span className="inline-flex items-center rounded-full border bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          Admin principal
        </span>
      );
    }

    return (
      <Select
        value={user.role}
        onValueChange={(role) => handleUpdateRole(user.id, role)}
        disabled={updateMutation.isPending}
      >
        <SelectTrigger
          id={mobile ? `role-mobile-${user.id}` : undefined}
          aria-label={`Rôle de ${user.email}`}
          className={mobile ? 'w-full min-w-0' : 'h-8 w-[180px] text-xs'}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="agent">Agent Terrain</SelectItem>
          <SelectItem value="validateur">Validateur</SelectItem>
        </SelectContent>
      </Select>
    );
  };

  if (isLoading) return <DataSpinner label="Chargement des utilisateurs..." />;

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-5 pb-16 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gérez les accès, les rôles et les codes d'authentification des agents.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setNewEmail('');
            setNewRole('agent');
            setNewCode(null);
          } else {
            setNewCode(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <UserPlus className="mr-2 h-4 w-4" />
              Nouvel utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer un utilisateur</DialogTitle>
              <DialogDescription>
                Créez un compte pour un nouvel agent. Un code d'accès permanent sera généré.
              </DialogDescription>
            </DialogHeader>

            {newCode ? (
              <div className="space-y-4 pt-4">
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-900">Code généré avec succès</AlertTitle>
                  <AlertDescription className="text-amber-800 mt-2">
                    Copiez ce code d'accès immédiatement. Il ne sera plus affiché après la fermeture de cette fenêtre.
                    <div className="mt-3 select-all break-all rounded border border-amber-200 bg-white p-3 text-center font-mono text-sm font-bold text-black sm:text-base">
                      {newCode}
                    </div>
                  </AlertDescription>
                </Alert>
                <div className="flex justify-end pt-2">
                  <Button onClick={() => setIsCreateOpen(false)}>Fermer</Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="agent@kinshasa.cd"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Select value={newRole} onValueChange={(val: any) => setNewRole(val)}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Sélectionnez un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Agent Terrain</SelectItem>
                      <SelectItem value="validateur">Validateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>
                    Créer et générer le code
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {newCode && !isCreateOpen && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900">Nouveau code d'accès</AlertTitle>
          <AlertDescription className="text-amber-800 mt-2">
            Veuillez copier ce code. Il ne sera plus affiché par la suite.
            <div className="mt-3 select-all break-all rounded border border-amber-200 bg-white p-3 text-center font-mono text-sm font-bold text-black sm:text-base">
              {newCode}
            </div>
          </AlertDescription>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={handleDismissCode}>J'ai copié le code</Button>
          </div>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:hidden">
        {users?.map((user) => {
          const isPrincipal = user.role === 'admin_principal';
          return (
            <article key={user.id} className="min-w-0 rounded-xl border bg-card p-4 shadow-sm">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Adresse e-mail</p>
                <p className="mt-1 break-all text-sm font-semibold leading-snug">{user.email}</p>
              </div>

              <div className="mt-4 grid gap-4 border-t pt-4">
                <div className="min-w-0">
                  {isPrincipal ? (
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Rôle</p>
                  ) : (
                    <Label htmlFor={`role-mobile-${user.id}`} className="mb-2 block text-xs text-muted-foreground">
                      Rôle
                    </Label>
                  )}
                  {roleControl(user, true)}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-muted-foreground">Créé le</span>
                  <span className="text-sm">{format(new Date(user.createdAt), 'dd MMM yyyy', { locale: fr })}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor={`active-mobile-${user.id}`} className="text-sm">Compte actif</Label>
                  <Switch
                    id={`active-mobile-${user.id}`}
                    checked={user.active}
                    onCheckedChange={(active) => handleUpdateActive(user.id, active)}
                    disabled={isPrincipal || updateMutation.isPending}
                  />
                </div>
              </div>

              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => handleRotate(user.id)}
                disabled={isPrincipal || rotateMutation.isPending}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Nouveau code
              </Button>
            </article>
          );
        })}
        {(!users || users.length === 0) && (
          <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground sm:col-span-2">
            Aucun utilisateur trouvé.
          </p>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-md border xl:block">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead>Actif</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((u) => {
              const isPrincipal = u.role === 'admin_principal';
              return (
                <TableRow key={u.id}>
                  <TableCell className="break-all font-medium">{u.email}</TableCell>
                  <TableCell>{roleControl(u)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {format(new Date(u.createdAt), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <Switch
                      aria-label={`Compte actif : ${u.email}`}
                      checked={u.active}
                      onCheckedChange={(val) => handleUpdateActive(u.id, val)}
                      disabled={isPrincipal || updateMutation.isPending}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => handleRotate(u.id)}
                      disabled={isPrincipal || rotateMutation.isPending}
                    >
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Nouveau code
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {(!users || users.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Aucun utilisateur trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
