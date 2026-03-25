# StudyPulse — Moteur d'Apprentissage Scientifique
### Addendum au document MVP principal · Pour Claude Code

---

## POURQUOI CE DOCUMENT EXISTE

Le différenciateur réel de StudyPulse n'est pas l'upload de PDF ni les quiz génériques.
C'est la **prévision précise du temps d'étude nécessaire** et la **réduction maximale de la friction décisionnelle** — l'étudiant ouvre l'app et sait exactement quoi faire, combien de temps ça prendra, et pourquoi.

Ce document traduit la science cognitive en fonctionnalités concrètes à implémenter.

---

## 1. LES 4 PILIERS SCIENTIFIQUES (tous prouvés par études peer-reviewed)

### Pilier 1 — Courbe de l'oubli d'Ebbinghaus
**La science :** Les humains oublient ~50% de la nouvelle information dans l'heure, et ~90% dans les 7 premiers jours sans révision active. Répliqué en 2015 avec des résultats similaires à l'original de 1885.

**La formule :**
```
R(t) = e^(-t/S)
R = rétention (0 à 1)
t = jours depuis la dernière révision
S = force mémoire (augmente à chaque révision réussie)
```

**Implémentation :**
```typescript
// lib/forgetting-curve.ts
export function calculateRetention(lastReviewedAt: Date, memoryStrength: number): number {
  const days = (Date.now() - lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-days / memoryStrength);
}

export function predictNextReviewDate(memoryStrength: number, targetRetention = 0.85): Date {
  // Résoudre R = e^(-t/S) pour t : t = -S * ln(R)
  const daysUntilReview = -memoryStrength * Math.log(targetRetention);
  const next = new Date();
  next.setDate(next.getDate() + daysUntilReview);
  return next;
}

export function updateMemoryStrength(current: number, wasCorrect: boolean, confidence: number): number {
  if (wasCorrect) {
    return current * (1 + 0.2 * (confidence / 5));
  }
  return Math.max(1.0, current * 0.6); // reset partiel, pas complet
}
```

---

### Pilier 2 — Répétition espacée (Spacing Effect)
**La science :** Supérieure à l'absence de répétition espacée pour l'apprentissage (58.03% vs 43.20%, P<.001, Cohen d=0.62) et le transfert de connaissances (Price et al., PubMed 2025). Les doubles répétitions espacées surpassent les simples (62.24% vs 51.83%, P<.001).

**Moteur de prédiction de session :**
```typescript
// lib/session-predictor.ts
interface ConceptStatus {
  conceptId: string;
  retention: number;
  memoryStrength: number;
  lastReviewedAt: Date;
  difficultyScore: number; // 1-5
}

export function predictStudySession(
  concepts: ConceptStatus[],
  availableMinutes: number,
  examDate?: Date
): {
  urgentConcepts: ConceptStatus[];
  optimalDurationMinutes: number;
  costOfSkippingMessage: string;
} {
  const examUrgency = examDate
    ? Math.max(1, 5 / Math.max(1, (examDate.getTime() - Date.now()) / 86400000))
    : 1;

  const sorted = concepts
    .map(c => ({
      ...c,
      priority: (1 - c.retention) * 0.5 * examUrgency + (c.difficultyScore / 5) * 0.3
    }))
    .sort((a, b) => b.priority - a.priority);

  let totalMinutes = 0;
  const selected: ConceptStatus[] = [];
  for (const c of sorted) {
    const cost = 1.5 + c.difficultyScore * 0.5;
    if (totalMinutes + cost <= availableMinutes) {
      selected.push(c);
      totalMinutes += cost;
    }
  }

  const urgent = selected.filter(c => c.retention < 0.6);
  const daysLeft = examDate
    ? Math.ceil((examDate.getTime() - Date.now()) / 86400000)
    : null;

  const msg = urgent.length > 0
    ? daysLeft
      ? `Dans ${daysLeft} jours, tu risques d'avoir oublié ${urgent.length} concept(s) clé(s).`
      : `${urgent.length} concept(s) commencent à s'effacer de ta mémoire.`
    : '';

  return {
    urgentConcepts: urgent,
    optimalDurationMinutes: Math.round(totalMinutes),
    costOfSkippingMessage: msg
  };
}
```

---

### Pilier 3 — Testing Effect (Pratique de récupération)
**La science :** La répétition de l'étude après apprentissage n'a aucun effet sur le rappel différé, mais la répétition des tests produit un large effet positif (Roediger & Karpicke, 2006). Les prédictions des étudiants sur leur performance sont non corrélées avec leur performance réelle.

**Ce que ça change :** Les étudiants ne savent pas ce qu'ils ne savent pas. C'est exactement ce que StudyPulse résout avec le diagnostic initial.

**Implémentation — Pré-test au premier upload :**
```
Après extraction des concepts, avant d'afficher le cours :
→ Générer 8 questions de diagnostic
→ Message : "Diagnostic initial — 2 minutes pour calibrer ton plan"
→ Initialiser memoryStrength selon les résultats :
   - Bonne réponse + réponse rapide (< 5s)  → memoryStrength 3.0
   - Bonne réponse + réponse lente (> 5s)   → memoryStrength 1.5
   - Mauvaise réponse                        → memoryStrength 1.0
   - Non testé                               → memoryStrength 0.5
```

---

### Pilier 4 — Pratique entrelacée (Interleaving)
**La science :** Améliorations médianes de 50% au test 1 et 125% au test 2 vs pratique bloquée (npj Science of Learning, 2021). Effet persistant sur 1 mois. L'avantage augmente avec le temps.

**Règle absolue :** Ne jamais faire réviser un étudiant sur un seul cours en continu. Toujours mélanger les concepts de cours différents dans chaque session.

```typescript
// lib/interleaving-scheduler.ts
export function buildInterleavedSession(
  courseConcepts: Map<string, ConceptStatus[]>,
  targetMinutes: number
): ConceptStatus[] {
  const allPrioritized: (ConceptStatus & { courseId: string })[] = [];

  for (const [courseId, concepts] of courseConcepts) {
    const top = concepts
      .filter(c => c.retention < 0.8)
      .sort((a, b) => a.retention - b.retention)
      .slice(0, 5)
      .map(c => ({ ...c, courseId }));
    allPrioritized.push(...top);
  }

  // Entrelacement : même cours pas consécutif
  return smartShuffle(allPrioritized);
}

function smartShuffle<T extends { courseId: string }>(items: T[]): T[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    if (!groups.has(item.courseId)) groups.set(item.courseId, []);
    groups.get(item.courseId)!.push(item);
  }
  const result: T[] = [];
  const queues = Array.from(groups.values());
  while (queues.some(q => q.length > 0)) {
    for (const queue of queues) {
      if (queue.length > 0) result.push(queue.shift()!);
    }
  }
  return result;
}
```

---

## 2. IMPORTANT : NE PAS IMPLÉMENTER LES STYLES D'APPRENTISSAGE VARK

**La science :** Diverses revues depuis le milieu des années 2000 ont conclu qu'il n'y a aucune preuve que l'adaptation des méthodes d'enseignement au style d'apprentissage supposé d'un étudiant améliore l'apprentissage. L'approche peut même être nuisible en créant des croyances limitantes chez l'étudiant.

**À la place — Profil basé sur le comportement réel :**
```typescript
// lib/learner-profile.ts
interface LearnerProfile {
  userId: string;
  // Tout observé automatiquement, jamais demandé :
  averageSessionDurationMinutes: number;
  preferredSessionLength: 'short' | 'medium' | 'long'; // <10 / 10-25 / >25 min
  responseTimeAverageMs: number;       // proxy pour confiance
  retentionCurveFactor: number;        // <1 = oublie vite, >1 = retient bien
  learningVelocityScore: number;       // concepts maîtrisés / heure
  bestStudyHour: number | null;        // 0-23, heure avec meilleur taux de réussite
  optimalQuizLength: number;           // questions avant fatigue détectée
}
```

---

## 3. ALGORITHME DE PRÉVISION EXAMEN — LE COEUR DU PRODUIT

```typescript
// lib/exam-predictor.ts
interface ExamReadiness {
  currentMastery: number;        // 0-1
  projectedMasteryAtExam: number; // sans révision
  hoursNeededTotal: number;
  minutesPerDay: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  weatherEmoji: string;          // 🌞 / 🌤️ / ⛅ / ⛈️
  dailyPlan: { date: Date; durationMinutes: number; focusConcepts: string[] }[];
}

export function predictExamReadiness(
  concepts: ConceptStatus[],
  profile: LearnerProfile,
  examDate: Date
): ExamReadiness {
  const daysLeft = Math.max(1, (examDate.getTime() - Date.now()) / 86400000);

  let totalMinutes = 0;
  const dailyPlan = [];

  for (const concept of concepts) {
    const currentRetention = calculateRetention(concept.lastReviewedAt, concept.memoryStrength);
    const reviewsNeeded = currentRetention < 0.85
      ? Math.ceil(Math.log(0.85 / Math.max(0.1, currentRetention)) / Math.log(1.3))
      : 0;
    const minutesPerReview = 1.5 + concept.difficultyScore * 0.5;
    totalMinutes += reviewsNeeded * minutesPerReview;
  }

  const minutesPerDay = totalMinutes / daysLeft;
  const riskLevel = minutesPerDay > 120 ? 'critical'
                  : minutesPerDay > 60  ? 'high'
                  : minutesPerDay > 30  ? 'medium' : 'low';
  const weatherEmoji = { low: '🌞', medium: '🌤️', high: '⛅', critical: '⛈️' }[riskLevel];

  return {
    currentMastery: concepts.reduce((s, c) => s + c.retention, 0) / concepts.length,
    projectedMasteryAtExam: concepts.reduce((s, c) =>
      s + calculateRetention(examDate, c.memoryStrength), 0) / concepts.length,
    hoursNeededTotal: totalMinutes / 60,
    minutesPerDay: Math.round(minutesPerDay),
    riskLevel,
    weatherEmoji,
    dailyPlan: [] // généré séparément
  };
}
```

---

## 4. ONBOARDING SCIENTIFIQUE — LES 5 PREMIÈRES MINUTES

Séquence exacte à implémenter :

**Étape 1 — Upload (30 sec)**
Message : "Téléverse ton plan de cours ou tes notes — l'IA apprend ton contexte académique sans que tu aies à tout expliquer."
Animation pendant l'analyse : compteur de concepts détectés en temps réel.

**Étape 2 — Diagnostic initial (2 min)**
Message : "Avant de créer ton plan d'étude, 8 questions pour voir ce que tu sais déjà. Souvent surprenant."
Note : NE PAS afficher un score pendant le diagnostic. Juste avancer.

**Étape 3 — Le moment "wow" (30 sec)**
Afficher immédiatement après le diagnostic :
- "Tu maîtrises actuellement X% de ce cours."
- "Pour être prêt à 85% pour ton examen du [date], tu as besoin de [X] minutes par jour."
- Widget météo examen : [emoji] + barre de progression

**Étape 4 — Première session (immédiat)**
Bouton unique : "Commencer mes [X] minutes d'aujourd'hui →"
NE PAS laisser partir sans au moins 5 questions complétées.

---

## 5. UI — WIDGET MÉTÉO EXAMEN

Afficher dans le dashboard pour chaque cours avec examen configuré :

```
╔═══════════════════════════════════════════╗
║  🌤️  Pharmacologie · Exam dans 8 jours    ║
║                                           ║
║  Maîtrise actuelle  ████████░░  78%       ║
║  Objectif exam      ████████████ 85%      ║
║                                           ║
║  Temps restant nécessaire : 2h15          ║
║  Soit : 17 min/jour jusqu'à l'examen      ║
║                                           ║
║  [▶ Commencer les 17 min d'aujourd'hui]  ║
╚═══════════════════════════════════════════╝
```

Notification push si pas étudié avant 20h :
"📚 Ton exam de pharma est dans 8 jours. Sans révision ce soir, ta rétention tombe à 71% demain. [Commencer — 17 min]"

---

## 6. AJOUTS AU SCHÉMA SQL

```sql
-- Ajouter à 'concepts' :
ALTER TABLE concepts ADD COLUMN memory_strength float DEFAULT 1.0;
ALTER TABLE concepts ADD COLUMN next_review_date date DEFAULT CURRENT_DATE;
ALTER TABLE concepts ADD COLUMN response_time_avg_ms integer;

-- Ajouter à 'profiles' :
ALTER TABLE profiles ADD COLUMN learning_velocity float DEFAULT 1.0;
ALTER TABLE profiles ADD COLUMN optimal_session_minutes integer DEFAULT 20;
ALTER TABLE profiles ADD COLUMN retention_curve_factor float DEFAULT 1.0;
-- < 1.0 = oublie plus vite que la moyenne
-- > 1.0 = retient mieux que la moyenne

-- Nouvelle table : historique de rétention
CREATE TABLE retention_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  concept_id uuid references concepts(id) on delete cascade,
  retention_score float not null,
  memory_strength float not null,
  recorded_at timestamptz default now()
);

ALTER TABLE retention_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own snapshots"
  ON retention_snapshots FOR ALL USING (auth.uid() = user_id);
```

---

## 7. MESSAGES UI ÉDUCATIFS

Intégrer ces messages aux moments clés pour renforcer la confiance dans l'app :

**Au pré-test :**
"Les études montrent que les étudiants se trompent souvent sur ce qu'ils savent vraiment. Ce diagnostic révèle tes vraies lacunes."

**Quand l'app suggère de réviser un concept "déjà vu" :**
"Sans révision, tu oublies en moyenne 70% de ce matériel en 24h. Ce rappel réinitialise ta courbe de mémorisation."

**Quand le quiz mélange plusieurs cours :**
"On mélange intentionnellement tes cours — plus difficile, mais les études montrent +50 à +125% de rétention vs étudier un cours à la fois."

**Si session > 40 min :**
"Après 40 minutes, l'efficacité chute significativement. Prends 10 min de pause — tes révisions seront plus efficaces."

---

## 8. RÉSUMÉ POUR CLAUDE CODE

**À implémenter en priorité (différenciateur compétitif) :**
1. `lib/forgetting-curve.ts` — formule Ebbinghaus
2. `lib/session-predictor.ts` — prédiction durée de session
3. `lib/exam-predictor.ts` — prévision état au jour de l'examen
4. `lib/interleaving-scheduler.ts` — entrelacement multi-cours
5. `lib/learner-profile.ts` — profil comportemental (pas questionnaire)
6. Widget "Météo Examen" dans le dashboard
7. Pré-test de 8 questions au premier upload de cours

**À NE PAS implémenter :**
- Questionnaire de styles d'apprentissage VARK (scientifiquement non prouvé)
- Sessions > 45 min sans pause forcée
- Quiz mono-cours en continu

---

*Sources : Price et al. PubMed 2025 (Cohen d=0.62), Tabibian et al. PNAS 2019, Roediger & Karpicke 2006, Kornell et al. npj Science of Learning 2021, O'Hare et al. Frontiers in Education 2023, Ebbinghaus 1885 (réplication PMC 2015), Newton Swansea University (VARK debunk)*
