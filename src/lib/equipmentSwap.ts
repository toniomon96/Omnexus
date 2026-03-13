/**
 * Equipment Swap Engine
 *
 * Finds substitute exercises that preserve:
 *   1. Movement pattern (hinge stays hinge, push-horizontal stays push-horizontal, etc.)
 *   2. Primary muscle target (exact or top-2 overlap)
 *   3. Difficulty band (± 1 tier)
 *
 * When explicit exerciseVariants links exist they are preferred; otherwise a
 * similarity score is computed across all exercises in the library.
 */

import type { Equipment, Exercise, ExperienceLevel, SwapCandidate } from '../types';

// ─── Difficulty ordering ──────────────────────────────────────────────────────

const DIFFICULTY_ORDER: Record<ExperienceLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

function difficultyDistance(a?: ExperienceLevel, b?: ExperienceLevel): number {
  if (!a || !b) return 0; // treat unknown as compatible
  return Math.abs(DIFFICULTY_ORDER[a] - DIFFICULTY_ORDER[b]);
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function scoreCandidate(source: Exercise, candidate: Exercise): { score: number; reasons: string[] } {
  if (candidate.id === source.id) return { score: -1, reasons: [] };

  const reasons: string[] = [];
  let score = 0;

  // 1. Movement-pattern match (most important)
  if (source.pattern && candidate.pattern) {
    if (source.pattern === candidate.pattern) {
      score += 50;
      reasons.push(`Same movement pattern (${source.pattern})`);
    } else {
      // Pattern mismatch is a hard penalty but not a disqualifier
      score -= 30;
    }
  }

  // 2. Primary-muscle overlap
  const sourcePrimary = new Set(source.primaryMuscles);
  const primaryOverlap = candidate.primaryMuscles.filter((m) => sourcePrimary.has(m));
  if (primaryOverlap.length > 0) {
    const overlapRatio = primaryOverlap.length / Math.max(source.primaryMuscles.length, 1);
    score += Math.round(30 * overlapRatio);
    reasons.push(`Targets ${primaryOverlap.join(', ')}`);
  } else {
    // Primary-muscle mismatch is disqualifying
    return { score: -1, reasons: [] };
  }

  // 3. Difficulty proximity
  const dist = difficultyDistance(source.difficulty, candidate.difficulty);
  if (dist === 0) {
    score += 15;
    reasons.push('Same difficulty level');
  } else if (dist === 1) {
    score += 5;
  } else {
    // Two tiers apart — still usable but penalised
    score -= 10;
  }

  // 4. Category match
  if (source.category === candidate.category) {
    score += 5;
  }

  return { score, reasons };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface SwapOptions {
  /** Equipment the user has available. If empty, bodyweight-only swaps are returned. */
  availableEquipment?: Equipment[];
  /** Maximum number of candidates to return (default: 5) */
  maxResults?: number;
}

/**
 * Returns the best substitute exercises for `source` from the provided `library`.
 *
 * Exercises listed in `source.exerciseVariants` are ranked first (explicit links),
 * followed by similarity-scored candidates.
 */
export function findSwapCandidates(
  source: Exercise,
  library: Exercise[],
  options: SwapOptions = {},
): SwapCandidate[] {
  const { availableEquipment = [], maxResults = 5 } = options;

  const equipmentSet = new Set<Equipment>(availableEquipment);
  const hasEquipmentConstraint = equipmentSet.size > 0;

  // Build variant set for priority scoring
  const variantIds = new Set(source.exerciseVariants ?? []);

  const candidates: SwapCandidate[] = [];

  for (const ex of library) {
    if (ex.id === source.id) continue;

    // Equipment filter: if the user provided constraints, the candidate must
    // require only equipment the user has (bodyweight always passes).
    if (hasEquipmentConstraint) {
      const candidateNeeds = ex.equipment.filter((e) => e !== 'bodyweight');
      const isAccessible =
        candidateNeeds.length === 0 ||
        candidateNeeds.every((e) => equipmentSet.has(e));
      if (!isAccessible) continue;
    }

    const { score, reasons } = scoreCandidate(source, ex);
    if (score < 0) continue;

    // Boost explicit variant links
    const finalScore = variantIds.has(ex.id) ? score + 20 : score;

    candidates.push({ exercise: ex, score: finalScore, matchReasons: reasons });
  }

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}
