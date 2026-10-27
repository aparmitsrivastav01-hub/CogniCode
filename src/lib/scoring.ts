/**
 * CogniCode Scoring Engine
 * 
 * Computes a normalized comprehension score based on:
 * - Challenges solved (breadth)
 * - Prediction and verification accuracy (precision)
 * - Average resolution speed (efficiency)
 * - Assistant hint reliance (independence)
 * 
 * Formula:
 * Base Score = solved * 1,000 * accuracyFactor
 * Speed Bonus = solved * max(0, min(250, round((600 - avgTimeSeconds) * 0.6)))
 * Hint Deduction = hintsUsed * 75
 * Final Score = max(0, Base Score + Speed Bonus - Hint Deduction)
 */

export interface CalculateScoreParams {
  /** Number of rounds successfully solved */
  solved: number;
  /** Average completion time per round in seconds */
  avgTimeSeconds: number;
  /** Total number of assistant hints revealed across all rounds */
  hintsUsed: number;
  /** Overall verification and prediction accuracy (0.0 - 1.0 or 0 - 100) */
  accuracy: number;
}

export function calculateScore({
  solved,
  avgTimeSeconds,
  hintsUsed,
  accuracy,
}: CalculateScoreParams): number {
  if (solved <= 0) return 0;

  // Normalize accuracy to [0, 1] range if passed as percentage 0..100
  const normalizedAccuracy = accuracy > 1 ? Math.min(1, Math.max(0, accuracy / 100)) : Math.max(0, accuracy);

  // 1,000 base points per round scaled by accuracy
  const basePoints = solved * 1000 * normalizedAccuracy;

  // Speed bonus: baseline 600 seconds (10 min). Solving under 600s yields up to 250 bonus pts per round.
  const speedBonusPerRound = Math.max(0, Math.min(250, Math.round((600 - avgTimeSeconds) * 0.5)));
  const totalSpeedBonus = solved * speedBonusPerRound;

  // Hint deduction: 75 points deducted per hint used
  const hintDeductions = hintsUsed * 75;

  const rawScore = basePoints + totalSpeedBonus - hintDeductions;
  return Math.max(0, Math.round(rawScore));
}

/**
 * Formats a duration in seconds into 'mm:ss' display format.
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
