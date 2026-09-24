import { useGetDashboard } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, Printer, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DataSpinner } from '@/components/data-spinner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DashboardPage() {
  const { data: dashboard, isLoading, error } = useGetDashboard();

  if (isLoading) {
    return <DataSpinner label="Chargement du tableau de bord…" />;
  }

  if (error || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="rounded-full bg-destructive/10 p-3 text-destructive mb-4">
          <Activity className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-medium text-foreground">Erreur de chargement</h3>
        <p className="text-muted-foreground mt-1">Impossible de charger les données du tableau de bord.</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total des fiches',
      value: dashboard.totalFiches,
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'En attente',
      value: dashboard.enAttente,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Validées',
      value: dashboard.validees,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-600/10',
    },
    {
      title: 'Plaques à imprimer',
      value: dashboard.plaquesAImprimer,
      icon: Printer,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString('fr-FR')}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="min-w-0 xl:col-span-2">
          <CardHeader>
            <CardTitle>Répartition par commune</CardTitle>
            <CardDescription>Nombre de fiches recensées par commune</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.repartitionCommunes.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboard.repartitionCommunes}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="commune"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar
                      dataKey="total"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 xl:col-span-1">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Dernières fiches modifiées</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 sm:px-6 sm:pb-6">
            {dashboard.activiteRecente.length > 0 ? (
              <ol className="divide-y divide-border">
                {dashboard.activiteRecente.map((activite) => (
                  <li key={activite.id} className="flex min-w-0 items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="shrink-0 rounded-full bg-primary/10 p-2 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="break-all text-sm font-medium">
                        Fiche {activite.ficheNo}
                      </p>
                      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        <p className="break-all capitalize">{activite.action}</p>
                        <time className="block" dateTime={activite.horodatage}>
                          {format(new Date(activite.horodatage), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                        </time>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Aucune activité récente
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
