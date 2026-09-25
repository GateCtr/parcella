import { getGetPublicPlaqueQueryKey, useGetPublicPlaque } from '@workspace/api-client-react';
import { CheckCircle2, MapPin, ShieldCheck, TriangleAlert } from 'lucide-react';

export default function PublicVerification() {
  const code = new URLSearchParams(window.location.hash.slice(1)).get('code') ?? '';
  const validCode = /^[A-Za-z0-9_-]{43}$/.test(code);
  const { data, isLoading, error } = useGetPublicPlaque({ code }, {
    query: { queryKey: getGetPublicPlaqueQueryKey({ code }), enabled: validCode, retry: false, refetchOnWindowFocus: false },
    request: { cache: 'no-store' },
  });
  const missing = !validCode || (error && typeof error === 'object' && 'status' in error && error.status === 404);

  return (
    <main className="min-h-[100dvh] bg-[#f4f7fb] text-[#193761]">
      <header className="border-b border-slate-200 bg-white px-5 py-5">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <div className="rounded-xl bg-[#193761] p-2.5 text-white"><ShieldCheck className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Kinshasa</p>
            <p className="text-lg font-bold leading-tight">Registre parcellaire</p>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-5 py-10 sm:py-16">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Consultation publique</p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">Informations sur la plaque</h1>
        <p className="mb-8 text-slate-600">Cette page permet de consulter les informations d’adresse associées au QR de la plaque, sans ouvrir la fiche de prospection.</p>

        {isLoading && <div className="rounded-2xl border bg-white p-8 text-slate-600" role="status">Vérification de la plaque…</div>}
        {!isLoading && missing && (
          <div className="rounded-2xl border border-amber-200 bg-white p-7" role="alert">
            <TriangleAlert className="mb-4 h-8 w-8 text-amber-600" />
            <h2 className="text-xl font-bold">Plaque non reconnue</h2>
            <p className="mt-2 text-slate-600">Ce QR est incomplet ou ne correspond pas à une plaque validée dans ce registre. Vérifiez que le lien a été scanné en entier.</p>
          </div>
        )}
        {!isLoading && !missing && error && (
          <div className="rounded-2xl border bg-white p-7" role="alert">
            <h2 className="text-xl font-bold">Vérification momentanément indisponible</h2>
            <p className="mt-2 text-slate-600">Veuillez réessayer dans quelques instants.</p>
          </div>
        )}
        {data && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Détails publics de la plaque">
            <div className="flex items-start gap-3 border-b border-slate-100 bg-[#f1f7f3] px-6 py-6">
              {data.actuelle ? <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-green-700" /> : <TriangleAlert className="mt-1 h-6 w-6 shrink-0 text-amber-700" />}
              <div>
                <h2 className="text-xl font-bold">{data.actuelle ? 'Plaque enregistrée' : 'Plaque à vérifier auprès du registre'}</h2>
                <p className="mt-1 text-sm text-slate-600">{data.actuelle ? 'Les informations ci-dessous correspondent à la plaque actuelle.' : 'Une nouvelle version de cette plaque existe ou une réimpression est nécessaire.'}</p>
              </div>
            </div>
            <div className="px-6 py-7">
              <div className="mb-6 flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-blue-700" />
                <div>
                  <p className="text-sm text-slate-500">Adresse de la parcelle</p>
                  <p className="text-xl font-semibold">{data.parcelleNo}, {data.avenue}</p>
                  <p className="mt-1 text-slate-600">{[data.localite, data.quartier, data.commune].filter(Boolean).join(' · ')}</p>
                </div>
              </div>
              <dl className="grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
                <div><dt className="text-sm text-slate-500">Numéro de fiche</dt><dd className="mt-1 font-semibold">{data.ficheNo}</dd></div>
                <div><dt className="text-sm text-slate-500">Code de plaque</dt><dd className="mt-1 font-semibold">{data.plaqueNo}</dd></div>
                <div><dt className="text-sm text-slate-500">Version de la plaque</dt><dd className="mt-1 font-semibold">{data.version}</dd></div>
                <div><dt className="text-sm text-slate-500">Enregistrée le</dt><dd className="mt-1 font-semibold">{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(data.genereLe))}</dd></div>
              </dl>
            </div>
          </section>
        )}
        <p className="mt-6 text-sm leading-relaxed text-slate-500">Les noms, numéros de téléphone et renseignements de prospection ne sont pas accessibles sur cette page. La fiche complète reste réservée aux agents autorisés.</p>
      </div>
    </main>
  );
}