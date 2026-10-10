export const COURSE_TYPES = [
  { id: "lecture", label: "Cours magistral", hint: "Un enseignant expose, peu d'interactions" },
  { id: "tutorial", label: "TD / travaux dirigés", hint: "Exercices, corrections, questions" },
  { id: "lab", label: "TP / atelier", hint: "Manipulations, consignes pas à pas" },
  { id: "meeting", label: "Réunion", hint: "Plusieurs voix, décisions et actions" },
  { id: "conference", label: "Conférence / présentation", hint: "Exposé suivi de questions" },
  { id: "interview", label: "Entretien", hint: "Questions / réponses" },
  { id: "other", label: "Autre", hint: "Décris le contexte ci-dessous" },
] as const;

export type CourseTypeId = (typeof COURSE_TYPES)[number]["id"];

export function courseTypeLabel(id: CourseTypeId): string {
  return COURSE_TYPES.find((t) => t.id === id)?.label ?? "Autre";
}
