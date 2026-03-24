import OpenAI from "openai";

export const IS_OPENAI_MOCK = !process.env.OPENAI_API_KEY;

export const openai = IS_OPENAI_MOCK
  ? null
  : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Simulate realistic API latency in mock mode
export function simulateDelay(ms = 1200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =========================================================
// System Prompts
// =========================================================

export const COURSE_ANALYSIS_PROMPT = `Tu es un assistant pédagogique expert. Analyse ce document académique et extrait les informations clés.

Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "course_title": "Titre du cours",
  "description": "Brève description du cours (1-2 phrases)",
  "concepts": [
    {
      "title": "Nom du concept",
      "content": "Explication détaillée du concept (200-400 mots). Inclus les définitions, mécanismes, exemples et points clés à retenir.",
      "chapter": "Nom du chapitre ou module",
      "difficulty": 1
    }
  ]
}

Règles :
- Extrais entre 10 et 30 concepts clés (maximum 30)
- Chaque concept doit être auto-suffisant pour l'étude
- La difficulté va de 1 (facile) à 5 (très difficile)
- Réponds UNIQUEMENT avec le JSON, aucun texte avant ou après`;

export const QUIZ_GENERATION_PROMPT = `Tu es un expert en évaluation pédagogique. Génère une question QCM de haute qualité sur le concept suivant.

Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "question": "Question claire et précise ?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_index": 0,
  "explanation": "Explication détaillée de la bonne réponse et pourquoi les autres options sont incorrectes (2-3 phrases)."
}

Règles :
- La question doit tester la compréhension, pas la mémorisation pure
- Les distracteurs doivent être plausibles mais clairement incorrects
- L'explication doit renforcer l'apprentissage
- correct_index est l'index 0-3 de la bonne réponse dans le tableau options
- Réponds UNIQUEMENT avec le JSON`;

export const FLASHCARD_PROMPT = `Tu es un expert en mémorisation et spaced repetition. Génère 3 flashcards efficaces pour ce concept académique.

Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "flashcards": [
    {
      "front": "Question ou terme à mémoriser",
      "back": "Réponse concise et mémorisable (max 100 mots)"
    }
  ]
}

Règles :
- Le recto (front) doit être une question précise ou un terme à définir
- Le verso (back) doit être la réponse la plus concise possible
- Vise 3 flashcards par concept, couvrant les aspects les plus importants
- Réponds UNIQUEMENT avec le JSON`;

export const STUDY_PLAN_PROMPT = `Tu es un coach d'étude expert. Génère un plan d'étude personnalisé sur 7 jours pour cet étudiant.

Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "week_summary": "Résumé de la semaine d'étude en 1-2 phrases",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "day_label": "Lundi 24 mars",
      "total_minutes": 45,
      "sessions": [
        {
          "course_id": "uuid",
          "course_title": "Titre du cours",
          "activity": "quiz",
          "duration_minutes": 20,
          "focus": "Description de ce sur quoi se concentrer",
          "concepts_to_review": ["Concept 1", "Concept 2"]
        }
      ]
    }
  ]
}

Règles :
- Priorise les cours avec examen proche et score de maîtrise faible
- Sessions de 15-45 minutes (adaptées au transport en commun)
- Alterne quiz, flashcards et révision pour maximiser la rétention
- activity doit être "quiz", "flashcards" ou "review"
- Réponds UNIQUEMENT avec le JSON`;

// =========================================================
// Mock responses (French, realistic, varied mastery)
// =========================================================

export const MOCK_COURSE_ANALYSES: Record<string, object> = {
  default: {
    course_title: "Pharmacologie — Antibiotiques",
    description:
      "Mécanismes d'action, résistances et applications cliniques des antibiotiques majeurs",
    concepts: [
      {
        title: "Mécanismes des bêta-lactamines",
        content:
          "Les antibiotiques bêta-lactamines (pénicillines, céphalosporines, carbapénèmes) agissent en inhibant la synthèse du peptidoglycane de la paroi bactérienne. Ils se fixent sur les protéines liant la pénicilline (PLP), empêchant la transpeptidation finale. La bactérie, incapable de maintenir son intégrité pariétale, subit une lyse osmotique. Ces antibiotiques sont bactéricides et actifs principalement sur les bactéries en phase de croissance active.",
        chapter: "Chapitre 1 — Antibiotiques inhibiteurs de la synthèse pariétale",
        difficulty: 3,
      },
      {
        title: "Résistance aux bêta-lactamines",
        content:
          "La résistance aux bêta-lactamines survient par trois mécanismes principaux : 1) Production de bêta-lactamases qui hydrolysent le cycle bêta-lactame (mécanisme le plus répandu), 2) Modification des PLP (PLP de faible affinité chez MRSA), 3) Imperméabilité membranaire par modification des porines (Gram-négatifs). Les inhibiteurs de bêta-lactamases (acide clavulanique, sulbactam, tazobactam) permettent de restaurer l'activité.",
        chapter: "Chapitre 2 — Résistances aux antibiotiques",
        difficulty: 4,
      },
      {
        title: "Aminoglycosides",
        content:
          "Les aminoglycosides (gentamicine, tobramycine, amikacine) inhibent la synthèse protéique en se fixant sur la sous-unité 30S du ribosome bactérien, provoquant des erreurs de lecture de l'ARNm. Ils sont bactéricides, concentration-dépendants, et présentent un effet post-antibiotique prolongé. Leur utilisation est limitée par leur néphrotoxicité et ototoxicité dose-dépendantes. Monitoring des taux sériques obligatoire.",
        chapter: "Chapitre 3 — Inhibiteurs de la synthèse protéique",
        difficulty: 3,
      },
      {
        title: "Fluoroquinolones",
        content:
          "Les fluoroquinolones (ciprofloxacine, lévofloxacine, moxifloxacine) inhibent l'ADN gyrase et la topoisomérase IV bactériennes, enzymes essentielles à la réplication de l'ADN. Elles sont bactéricides, concentration-dépendantes et ont un large spectre d'activité. Effets indésirables : tendinopathies (risque de rupture du tendon d'Achille), photosensibilisation, allongement du QT, contre-indiquées chez les enfants.",
        chapter: "Chapitre 4 — Inhibiteurs des acides nucléiques",
        difficulty: 3,
      },
      {
        title: "Macrolides",
        content:
          "Les macrolides (érythromycine, azithromycine, clarithromycine) se fixent sur la sous-unité 50S du ribosome et inhibent la translocation. Ils sont bactériostatiques sur la plupart des germes. Spectre : Gram-positifs, bactéries intracellulaires (Chlamydia, Mycoplasma, Legionella), atypiques. L'azithromycine a une demi-vie très longue (3 jours), permettant des cures courtes. Interactions médicamenteuses importantes via CYP3A4.",
        chapter: "Chapitre 3 — Inhibiteurs de la synthèse protéique",
        difficulty: 2,
      },
    ],
  },
};

export const MOCK_QUIZ_QUESTION = {
  question:
    "Quel mécanisme explique principalement la résistance aux bêta-lactamines chez S. aureus résistant à la méticilline (MRSA) ?",
  options: [
    "Production de bêta-lactamases à large spectre",
    "Modification des protéines liant la pénicilline (PLP2a)",
    "Imperméabilité membranaire par perte de porines",
    "Efflux actif de la molécule antibiotique",
  ],
  correct_index: 1,
  explanation:
    "Le MRSA produit une PLP2a (codée par le gène mecA) qui a une très faible affinité pour tous les antibiotiques bêta-lactamines. Contrairement aux autres staphylocoques, ce mécanisme confère une résistance à l'ensemble des bêta-lactamines. Les bêta-lactamases sont plutôt caractéristiques des entérobactéries résistantes.",
};

export const MOCK_FLASHCARDS = [
  {
    front: "Quel est le mécanisme d'action des bêta-lactamines ?",
    back: "Inhibition de la synthèse du peptidoglycane par fixation sur les PLP (protéines liant la pénicilline), empêchant la transpeptidation → lyse bactérienne",
  },
  {
    front: "Différence bactéricide vs bactériostatique",
    back: "Bactéricide = tue les bactéries (bêta-lactamines, aminoglycosides, fluoroquinolones). Bactériostatique = inhibe la croissance sans tuer (macrolides, tétracyclines). Important en immunodépression : préférer bactéricide.",
  },
  {
    front: "Principaux effets indésirables des aminoglycosides",
    back: "Néphrotoxicité (tubulaire, réversible) et ototoxicité (cochléaire + vestibulaire, irréversible). Dose-dépendants. Monitoring obligatoire : taux peak et trough.",
  },
];
