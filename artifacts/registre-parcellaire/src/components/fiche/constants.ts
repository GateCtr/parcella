export const typeOccupationOptions = [
  { label: 'Propriétaire résident', value: 'proprietaire' },
  { label: 'Locataire', value: 'locataire' },
  { label: 'Autre', value: 'autre' },
];

export const usageParcelleOptions = [
  { label: 'Résidentiel', value: 'residentiel' },
  { label: 'Commercial', value: 'commercial' },
  { label: 'Mixte (Résidentiel + Commercial)', value: 'mixte' },
];

export const plaqueExistanteOptions = [
  { label: 'Ancienne', value: 'ancienne' },
  { label: 'Première', value: 'premiere' },
  { label: 'Endommagée', value: 'endommagee' },
];

export const paiementOptions = [
  { label: 'Payé 15 000 FC', value: 'paye_15000' },
  { label: 'Acompte 7 500 FC', value: 'acompte_7500' },
  { label: 'Non payé', value: 'non_paye' },
];

export const sensibilisationOptions = [
  { label: 'Adhère', value: 'adhere' },
  { label: 'À relancer', value: 'a_relancer' },
  { label: 'Réticent', value: 'reticent' },
];

export const hygieneOptions = [
  { label: 'Bon', value: 'bon' },
  { label: 'Moyen', value: 'moyen' },
  { label: 'Mauvais', value: 'mauvais' },
];

export const modeEliminationOptions = [
  { label: 'Collecte municipale', value: 'collecte_municipale' },
  { label: 'Brûlage', value: 'incineration' },
  { label: 'Dépôt sauvage', value: 'decharge_sauvage' },
  { label: 'Fosse', value: 'fosse' },
];

export const bacOrduresOptions = [
  { label: 'Bon', value: 'bon' },
  { label: 'Endommagé', value: 'endommage' },
  { label: 'Aucun', value: 'aucun' },
];

export const dechetsVisiblesOptions = [
  { label: 'Aucun', value: 'aucun' },
  { label: 'Peu', value: 'peu' },
  { label: 'Beaucoup', value: 'beaucoup' },
];

export const etatFacadeOptions = [
  { label: 'Bonne', value: 'bonne' },
  { label: 'Dégradée', value: 'degradee' },
  { label: 'En construction', value: 'en_construction' },
  { label: 'Inexistante', value: 'inexistante' },
];

export const clotureOptions = [
  { label: 'Mur', value: 'mur' },
  { label: 'Palissade', value: 'palissade' },
  { label: 'Haie', value: 'haie' },
  { label: 'Aucune', value: 'aucune' },
];

export const emplacementOptions = [
  { label: 'Portail', value: 'portail' },
  { label: 'Mur de façade', value: 'mur_facade' },
  { label: 'Poteau', value: 'poteau' },
  { label: 'Autre', value: 'autre' },
];

export const visibiliteOptions = [
  { label: 'Excellente', value: 'excellente' },
  { label: 'Bonne', value: 'bonne' },
  { label: 'Difficile', value: 'difficile' },
];

export const canalisationOptions = [
  { label: 'Présent fonctionnel', value: 'present_fonctionnel' },
  { label: 'Présent obstrué', value: 'present_obstrue' },
  { label: 'Absent', value: 'absent' },
];

export const risqueOptions = [
  { label: 'Aucun', value: 'aucun' },
  { label: 'Modéré', value: 'modere' },
  { label: 'Élevé', value: 'eleve' },
];

export const activitesOptions = [
  { label: 'Maison familiale', value: 'maison_familiale' },
  { label: 'Boutique/Magasin', value: 'boutique_magasin' },
  { label: 'Atelier', value: 'atelier' },
  { label: 'Restaurant/Bar', value: 'restaurant_bar' },
  { label: 'École', value: 'ecole' },
  { label: 'Église', value: 'eglise' },
  { label: 'Santé/Pharmacie', value: 'sante_pharmacie' },
  { label: 'Agriculture/Élevage', value: 'agriculture_elevage' },
  { label: 'Entrepôt', value: 'entrepot' },
  { label: 'Terrain vide', value: 'terrain_vide' },
];

export const avisGlobalOptions = [
  { label: 'Conforme', value: 'conforme' },
  { label: 'Non conforme', value: 'non_conforme' },
  { label: 'En attente', value: 'en_attente' },
];

export const prioriteOptions = [
  { label: 'Urgente', value: 'urgente' },
  { label: 'Normale', value: 'normale' },
  { label: 'Différée', value: 'differee' },
];

export const suiviOptions = [
  { label: 'Rappel de paiement', value: 'rappel_paiement' },
  { label: 'Sensibilisation supplémentaire', value: 'sensibilisation_supplementaire' },
  { label: 'Signalement d\'incident', value: 'signalement_incident' },
];

export const getLabel = (value: string | undefined | null, options: {label: string, value: string}[]) => {
  if (!value) return "Non renseigné";
  return options.find(o => o.value === value)?.label || value;
};
