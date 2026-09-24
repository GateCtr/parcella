export const RUBRIQUES = [
  { numero: 2, key: 'adressage', titre: "État de l’adressage parcellaire" },
  { numero: 3, key: 'hygiene', titre: 'Hygiène et salubrité de la parcelle' },
  { numero: 4, key: 'dechets', titre: 'Gestion des déchets' },
  { numero: 5, key: 'facade', titre: 'État de la façade et de la clôture' },
  { numero: 6, key: 'drainage', titre: 'Présence et état des canaux de drainage' },
  { numero: 7, key: 'activites', titre: 'Types d’activités exercées sur la parcelle' },
  { numero: 8, key: 'remarques', titre: 'Remarques et observations de l’agent' },
  { numero: 9, key: 'avis', titre: 'Avis de l’agent de prospection' },
] as const;

export type RubriqueKey = (typeof RUBRIQUES)[number]['key'];