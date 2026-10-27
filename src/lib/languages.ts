export type LanguageKind = 'love' | 'apology'

export interface LanguageDefinition {
  id: string
  name: string
  description: string
  examplePrompt: string
}

export interface LanguageKindConfig {
  kind: LanguageKind
  title: string
  intro: string
  receiveLabel: string
  giveLabel: string | null
  positiveLabel: string
  positivePlaceholder: string
  negativeLabel: string
  negativePlaceholder: string
  languages: LanguageDefinition[]
}

export const LANGUAGE_KINDS: Record<LanguageKind, LanguageKindConfig> = {
  love: {
    kind: 'love',
    title: "Langages de l'amour",
    intro:
      "On a tous une façon préférée de recevoir l'amour, et souvent une autre de le donner. Classe les cinq langages du plus important (1) au moins important (5).",
    receiveLabel: 'Comment j’aime recevoir',
    giveLabel: 'Comment je donne spontanément',
    positiveLabel: 'Ce qui me touche',
    positivePlaceholder: 'Quand tu m’envoies un message au milieu de la journée',
    negativeLabel: 'Ce qui me blesse',
    negativePlaceholder: 'Quand tu regardes ton téléphone pendant qu’on dîne',
    languages: [
      {
        id: 'paroles',
        name: 'Paroles valorisantes',
        description: 'Compliments, encouragements, mots doux, remerciements.',
        examplePrompt: 'Quels mots te font du bien ?',
      },
      {
        id: 'moments',
        name: 'Moments de qualité',
        description: 'Du temps ensemble, avec une attention pleine et sans distraction.',
        examplePrompt: 'Quels moments à deux te remplissent ?',
      },
      {
        id: 'cadeaux',
        name: 'Cadeaux',
        description: 'Attentions, petites surprises, objets qui montrent qu’on a pensé à toi.',
        examplePrompt: 'Quelle attention t’a marqué·e ?',
      },
      {
        id: 'services',
        name: 'Services rendus',
        description: 'Gestes concrets qui soulagent ou facilitent la vie.',
        examplePrompt: 'Quel coup de main te touche ?',
      },
      {
        id: 'contact',
        name: 'Contact physique',
        description: 'Câlins, tendresse, mains qui se frôlent, proximité.',
        examplePrompt: 'Quels gestes te rassurent ?',
      },
    ],
  },
  apology: {
    kind: 'apology',
    title: 'Langages des excuses',
    intro:
      "Après une dispute, on n'a pas tous besoin d'entendre la même chose pour se sentir apaisé. Classe les cinq façons de s'excuser de la plus importante (1) à la moins importante (5) pour toi.",
    receiveLabel: 'Ce dont j’ai besoin pour me sentir apaisé·e',
    giveLabel: null,
    positiveLabel: 'Ce qui m’apaise',
    positivePlaceholder: 'Que tu reviennes vers moi le soir même, même maladroitement',
    negativeLabel: 'Ce qui sonne faux',
    negativePlaceholder: '« Désolé·e si tu l’as mal pris »',
    languages: [
      {
        id: 'regrets',
        name: 'Exprimer des regrets',
        description: '« Je suis désolé·e de t’avoir blessé·e. »',
        examplePrompt: 'Quelle phrase te fait du bien ?',
      },
      {
        id: 'responsabilite',
        name: 'Reconnaître sa responsabilité',
        description: '« J’ai eu tort, c’est de ma faute. »',
        examplePrompt: 'Qu’as-tu besoin d’entendre reconnu ?',
      },
      {
        id: 'reparer',
        name: 'Réparer',
        description: '« Qu’est-ce que je peux faire pour arranger les choses ? »',
        examplePrompt: 'Quel geste répare vraiment ?',
      },
      {
        id: 'changer',
        name: 'S’engager à changer',
        description: '« Je vais faire en sorte que ça ne se reproduise pas. »',
        examplePrompt: 'Quel engagement te rassure ?',
      },
      {
        id: 'pardon',
        name: 'Demander pardon',
        description: '« Est-ce que tu peux me pardonner ? »',
        examplePrompt: 'Comment aimes-tu qu’on te le demande ?',
      },
    ],
  },
}

export function languageName(kind: LanguageKind, id: string) {
  return LANGUAGE_KINDS[kind].languages.find((l) => l.id === id)?.name ?? id
}

export function defaultRank(kind: LanguageKind) {
  return LANGUAGE_KINDS[kind].languages.map((l) => l.id)
}

export const MANUAL_FIELDS = [
  { id: 'stress_needs', label: 'Quand je suis stressé·e, j’ai besoin de…', placeholder: 'Qu’on me laisse un moment seul·e, puis qu’on en parle' },
  { id: 'stress_avoid', label: '… et il vaut mieux éviter de…', placeholder: 'Me proposer des solutions tout de suite' },
  { id: 'conflict_helps', label: 'Pendant une dispute, ce qui m’aide', placeholder: 'Faire une pause de 20 minutes et reprendre' },
  { id: 'conflict_triggers', label: 'Ce qui m’enflamme', placeholder: 'Les « toujours » et les « jamais »' },
  { id: 'recharge', label: 'Comment je recharge mes batteries', placeholder: 'Une soirée seul·e avec un livre, ou une balade à deux' },
  { id: 'signals', label: 'Mes signaux quand ça ne va pas', placeholder: 'Je deviens très silencieux·se, je range compulsivement' },
  { id: 'other', label: 'Autre chose à savoir sur moi', placeholder: '' },
] as const

export type ManualFieldId = (typeof MANUAL_FIELDS)[number]['id']

export const LANDMARK_KINDS = [
  { id: 'date', label: 'Dates importantes', single: 'Date', placeholder: 'Notre premier rendez-vous' },
  { id: 'ritual', label: 'Nos rituels', single: 'Rituel', placeholder: 'Le petit-déjeuner du dimanche' },
  { id: 'activity', label: 'Ce qu’on aime faire ensemble', single: 'Activité', placeholder: 'Les randos au bord de la mer' },
  { id: 'joke', label: 'Nos private jokes', single: 'Private joke', placeholder: '« La fameuse histoire du parapluie »' },
] as const

export type LandmarkKind = (typeof LANDMARK_KINDS)[number]['id']
