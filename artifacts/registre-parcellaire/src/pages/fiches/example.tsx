import type { Fiche } from '@workspace/api-client-react';
import FicheDetail from './detail';

// Demonstration data only: this page never reads or writes a fiche in the database.
const exampleFiche: Fiche = {
  id: 'exemple',
  ficheNo: 'EXEMPLE',
  commune: 'Gombe',
  quartier: 'Exemple de quartier',
  avenue: 'Avenue Exemple',
  parcelleNo: '00',
  plaqueNo: 'EX-000',
  proprietaireNom: 'Personne fictive',
  telephone: '+243 000 000 000',
  typeOccupation: 'proprietaire',
  superficie: 320,
  usageParcelle: 'mixte',
  plaqueExistante: 'ancienne',
  statutPaiement: 'non_paye',
  sensibilisation: 'a_relancer',
  hygiene: {
    proprete: 'bon',
    ordures: 'moyen',
    vegetation: 'bon',
    latrines: 'bon',
    eauxStagnantes: 'mauvais',
  },
  dechets: {
    modeElimination: 'collecte_municipale',
    bacOrdures: 'bon',
    visibles: 'peu',
  },
  facade: {
    etat: 'bonne',
    cloture: 'mur',
    emplacement: 'portail',
    visibilite: 'excellente',
  },
  drainage: {
    canal: 'present_obstrue',
    risque: 'modere',
  },
  activites: ['maison_familiale', 'boutique_magasin'],
  remarques: 'Exemple de remarque : canalisation à dégager et occupant à relancer. Aucune visite réelle n’a été effectuée.',
  avis: {
    global: 'en_attente',
    priorite: 'normale',
    suivi: ['rappel_paiement', 'sensibilisation_supplementaire'],
    attestation: false,
  },
  agentMatricule: 'EXEMPLE',
  chefRueNom: 'Témoin fictif',
  chefRueAvenue: 'Avenue Exemple',
  statutFiche: 'brouillon',
  statutPlaque: 'non_generee',
  dateProspection: '2026-09-15T10:00:00.000Z',
  createdAt: '2026-09-15T10:00:00.000Z',
};

export default function FicheExample() {
  return (
    <main className="min-h-screen bg-muted/30 p-4 md:p-8">
      <FicheDetail exampleFiche={exampleFiche} />
    </main>
  );
}