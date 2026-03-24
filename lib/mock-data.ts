// StudyPulse — Mock data for development without API keys
// All data in French, realistic, varied mastery scores to demonstrate adaptive features

import type {
  Profile,
  Course,
  Concept,
  Flashcard,
  StudyPlan,
  QuizQuestion,
} from "@/types/database";

const today = new Date();
const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r.toISOString().split("T")[0];
};

// =========================================================
// Profile
// =========================================================
export const MOCK_PROFILE: Profile = {
  id: "mock-user-00000000",
  email: "alex.tremblay@umontreal.ca",
  full_name: "Alex Tremblay",
  university: "Université de Montréal",
  program: "Pharmacie",
  plan: "free",
  stripe_customer_id: null,
  stripe_subscription_id: null,
  created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
};

// =========================================================
// Courses
// =========================================================
export const MOCK_COURSES: Course[] = [
  {
    id: "course-pharma-0000001",
    user_id: "mock-user-00000000",
    title: "Pharmacologie — Antibiotiques",
    description:
      "Mécanismes d'action, résistances et applications cliniques des antibiotiques majeurs",
    exam_date: addDays(today, 3), // exam in 3 days — urgent!
    file_url: null,
    content_text: null,
    total_concepts: 10,
    mastery_score: 0.32,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "course-calcul-0000002",
    user_id: "mock-user-00000000",
    title: "Calcul Différentiel et Intégral",
    description: "Limites, dérivées, intégrales et leurs applications",
    exam_date: addDays(today, 14),
    file_url: null,
    content_text: null,
    total_concepts: 10,
    mastery_score: 0.61,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// =========================================================
// Concepts — Pharmacologie
// =========================================================
export const MOCK_CONCEPTS_PHARMA: Concept[] = [
  {
    id: "concept-pharma-001",
    course_id: "course-pharma-0000001",
    title: "Mécanisme des bêta-lactamines",
    content:
      "Les antibiotiques bêta-lactamines (pénicillines, céphalosporines) inhibent la synthèse du peptidoglycane en se fixant sur les PLP. Résultat : lyse bactérienne par fragilisation pariétale.",
    embedding: null,
    mastery_score: 0.15,
    times_tested: 3,
    times_correct: 0,
    last_tested_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "concept-pharma-002",
    course_id: "course-pharma-0000001",
    title: "Résistance aux bêta-lactamines",
    content:
      "Trois mécanismes : 1) Bêta-lactamases (hydrolysent le cycle bêta-lactame), 2) PLP modifiées (MRSA/PLP2a), 3) Imperméabilité (perte de porines). Inhibiteurs : acide clavulanique, sulbactam.",
    embedding: null,
    mastery_score: 0.08,
    times_tested: 5,
    times_correct: 0,
    last_tested_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "concept-pharma-003",
    course_id: "course-pharma-0000001",
    title: "Aminoglycosides",
    content:
      "Inhibent la synthèse protéique en se fixant sur la sous-unité 30S du ribosome → erreurs de traduction. Bactéricides, concentration-dépendants. Effets indésirables : néphrotoxicité, ototoxicité.",
    embedding: null,
    mastery_score: 0.42,
    times_tested: 4,
    times_correct: 2,
    last_tested_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "concept-pharma-004",
    course_id: "course-pharma-0000001",
    title: "Fluoroquinolones",
    content:
      "Inhibent l'ADN gyrase et topoisomérase IV → blocage réplication ADN. Bactéricides, concentration-dépendants. CI : enfants, grossesse. Effets : tendinopathies, photosensibilisation, allongement QT.",
    embedding: null,
    mastery_score: 0.55,
    times_tested: 6,
    times_correct: 3,
    last_tested_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "concept-pharma-005",
    course_id: "course-pharma-0000001",
    title: "Macrolides",
    content:
      "Se fixent sur la sous-unité 50S, inhibent la translocation. Bactériostatiques. Spectre : Gram+, bactéries intracellulaires (Chlamydia, Mycoplasma). Azithromycine : demi-vie 3 jours, cure courte possible.",
    embedding: null,
    mastery_score: 0.72,
    times_tested: 8,
    times_correct: 6,
    last_tested_at: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// =========================================================
// Concepts — Calcul
// =========================================================
export const MOCK_CONCEPTS_CALCUL: Concept[] = [
  {
    id: "concept-calcul-001",
    course_id: "course-calcul-0000002",
    title: "Règle de la chaîne",
    content:
      "Si f(x) = g(h(x)), alors f'(x) = g'(h(x)) · h'(x). Utile pour dériver des fonctions composées. Exemple : d/dx[sin(x²)] = cos(x²) · 2x.",
    embedding: null,
    mastery_score: 0.82,
    times_tested: 10,
    times_correct: 8,
    last_tested_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "concept-calcul-002",
    course_id: "course-calcul-0000002",
    title: "Intégration par parties",
    content:
      "∫u dv = uv - ∫v du. Mnémotechnique LIATE pour choisir u : Logarithme, Inverse trig, Algébrique, Trigonométrique, Exponentielle. Exemple : ∫x·eˣdx = xeˣ - eˣ + C.",
    embedding: null,
    mastery_score: 0.45,
    times_tested: 5,
    times_correct: 2,
    last_tested_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "concept-calcul-003",
    course_id: "course-calcul-0000002",
    title: "Théorème fondamental du calcul",
    content:
      "Partie 1 : Si F(x) = ∫ₐˣ f(t)dt, alors F'(x) = f(x). Partie 2 : ∫ₐᵇ f(x)dx = F(b) - F(a) où F est une primitive de f. Relie dérivation et intégration.",
    embedding: null,
    mastery_score: 0.68,
    times_tested: 7,
    times_correct: 5,
    last_tested_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const MOCK_CONCEPTS: Record<string, Concept[]> = {
  "course-pharma-0000001": MOCK_CONCEPTS_PHARMA,
  "course-calcul-0000002": MOCK_CONCEPTS_CALCUL,
};

// =========================================================
// Flashcards (5 due today, 5 future)
// =========================================================
export const MOCK_FLASHCARDS: Flashcard[] = [
  {
    id: "flash-001",
    user_id: "mock-user-00000000",
    course_id: "course-pharma-0000001",
    concept_id: "concept-pharma-001",
    front: "Quel est le mécanisme d'action des bêta-lactamines ?",
    back: "Inhibition de la synthèse du peptidoglycane par fixation sur les PLP → lyse bactérienne",
    ease_factor: 2.5,
    interval_days: 1,
    repetitions: 0,
    next_review_date: addDays(today, 0),
    last_reviewed_at: null,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "flash-002",
    user_id: "mock-user-00000000",
    course_id: "course-pharma-0000001",
    concept_id: "concept-pharma-002",
    front: "Principaux mécanismes de résistance aux bêta-lactamines ?",
    back: "1) Bêta-lactamases (hydrolysent l'antibiotique)\n2) PLP modifiées (MRSA)\n3) Imperméabilité membranaire",
    ease_factor: 2.5,
    interval_days: 1,
    repetitions: 0,
    next_review_date: addDays(today, 0),
    last_reviewed_at: null,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "flash-003",
    user_id: "mock-user-00000000",
    course_id: "course-pharma-0000001",
    concept_id: "concept-pharma-003",
    front: "Effets indésirables des aminoglycosides ?",
    back: "Néphrotoxicité (tubulaire, réversible) et ototoxicité (cochléaire + vestibulaire, irréversible). Surveillance des taux sériques obligatoire.",
    ease_factor: 2.3,
    interval_days: 1,
    repetitions: 1,
    next_review_date: addDays(today, 0),
    last_reviewed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "flash-004",
    user_id: "mock-user-00000000",
    course_id: "course-calcul-0000002",
    concept_id: "concept-calcul-002",
    front: "Formule d'intégration par parties ?",
    back: "∫u dv = uv - ∫v du\nChoix de u : règle LIATE (Log, Inv-trig, Algébrique, Trig, Expo)",
    ease_factor: 2.1,
    interval_days: 1,
    repetitions: 2,
    next_review_date: addDays(today, 0),
    last_reviewed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "flash-005",
    user_id: "mock-user-00000000",
    course_id: "course-calcul-0000002",
    concept_id: "concept-calcul-001",
    front: "Règle de la chaîne — formule",
    back: "Si f = g∘h, alors f'(x) = g'(h(x)) · h'(x)\nEx : d/dx[sin(x²)] = cos(x²) · 2x",
    ease_factor: 2.8,
    interval_days: 7,
    repetitions: 3,
    next_review_date: addDays(today, 2), // future
    last_reviewed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// =========================================================
// Mock quiz questions
// =========================================================
export const MOCK_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q-mock-001",
    session_id: "session-mock-001",
    concept_id: "concept-pharma-002",
    question_text:
      "Quel mécanisme explique principalement la résistance du MRSA aux bêta-lactamines ?",
    options: [
      "Production de bêta-lactamases à large spectre",
      "Modification des PLP (PLP2a codée par mecA)",
      "Imperméabilité membranaire par perte de porines",
      "Efflux actif de la molécule antibiotique",
    ],
    correct_option: 1,
    user_answer: null,
    is_correct: null,
    explanation:
      "Le MRSA produit une PLP2a (codée par le gène mecA) de très faible affinité pour tous les bêta-lactamines. C'est différent des entérobactéries où les bêta-lactamases prédominent. La PLP2a reste fonctionnelle même en présence d'antibiotiques, permettant la survie bactérienne.",
    created_at: new Date().toISOString(),
  },
  {
    id: "q-mock-002",
    session_id: "session-mock-001",
    concept_id: "concept-pharma-003",
    question_text:
      "Pourquoi les aminoglycosides sont-ils dits 'concentration-dépendants' ?",
    options: [
      "Leur efficacité augmente avec la durée d'exposition",
      "Leur effet bactéricide est proportionnel au pic sérique (Cmax/CMI)",
      "Ils nécessitent une concentration minimale constante",
      "Leur toxicité dépend de la concentration plasmatique",
    ],
    correct_option: 1,
    user_answer: null,
    is_correct: null,
    explanation:
      "Les antibiotiques concentration-dépendants (aminoglycosides, fluoroquinolones) ont une activité bactéricide qui augmente avec le rapport Cmax/CMI. L'administration en dose unique journalière maximise l'efficacité tout en réduisant la néphrotoxicité, contrairement aux antibiotiques temps-dépendants (bêta-lactamines) où c'est le temps > CMI qui importe.",
    created_at: new Date().toISOString(),
  },
  {
    id: "q-mock-003",
    session_id: "session-mock-001",
    concept_id: "concept-pharma-004",
    question_text:
      "Quelle est la contre-indication majeure des fluoroquinolones chez l'enfant ?",
    options: [
      "Risque de néphrotoxicité sévère",
      "Risque d'ototoxicité irréversible",
      "Risque d'arthropathie (lésions du cartilage de croissance)",
      "Risque d'aplasie médullaire",
    ],
    correct_option: 2,
    user_answer: null,
    is_correct: null,
    explanation:
      "Les fluoroquinolones causent des lésions du cartilage de croissance chez les animaux immatures, d'où leur contre-indication chez l'enfant et l'adolescent (sauf exceptions). Chez l'adulte, on redoute surtout les tendinopathies (risque de rupture du tendon d'Achille) et les troubles du rythme cardiaque.",
    created_at: new Date().toISOString(),
  },
];

// =========================================================
// Mock study plan
// =========================================================
export const MOCK_STUDY_PLAN: StudyPlan = {
  id: "plan-mock-001",
  user_id: "mock-user-00000000",
  generated_at: new Date().toISOString(),
  is_active: true,
  plan_data: {
    week_summary:
      "Semaine critique : examen de Pharmacologie dans 3 jours. Priorité maximale aux antibiotiques, notamment les mécanismes de résistance (score 8%). Révision légère du Calcul en parallèle.",
    days: [
      {
        date: addDays(today, 0),
        day_label: "Aujourd'hui",
        total_minutes: 45,
        sessions: [
          {
            course_id: "course-pharma-0000001",
            course_title: "Pharmacologie — Antibiotiques",
            activity: "quiz",
            duration_minutes: 25,
            focus: "Mécanismes de résistance aux bêta-lactamines (priorité critique)",
            concepts_to_review: [
              "Résistance aux bêta-lactamines",
              "Mécanisme des bêta-lactamines",
            ],
          },
          {
            course_id: "course-pharma-0000001",
            course_title: "Pharmacologie — Antibiotiques",
            activity: "flashcards",
            duration_minutes: 20,
            focus: "Révision rapide des fiches — renforcement mémorisation",
            concepts_to_review: [
              "Bêta-lactamines",
              "Aminoglycosides",
              "Fluoroquinolones",
            ],
          },
        ],
      },
      {
        date: addDays(today, 1),
        day_label: "Demain",
        total_minutes: 40,
        sessions: [
          {
            course_id: "course-pharma-0000001",
            course_title: "Pharmacologie — Antibiotiques",
            activity: "quiz",
            duration_minutes: 30,
            focus: "Mode examen — simulation complète",
            concepts_to_review: [
              "Tous les concepts",
            ],
          },
          {
            course_id: "course-calcul-0000002",
            course_title: "Calcul Différentiel et Intégral",
            activity: "flashcards",
            duration_minutes: 10,
            focus: "Entretien des acquis",
            concepts_to_review: ["Intégration par parties"],
          },
        ],
      },
    ],
  },
};
