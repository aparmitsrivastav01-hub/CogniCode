import { calculateScore } from '../lib/scoring';

export type LeaderboardTimeframe = 'all-time' | 'this-week';

export interface LeaderboardEntry {
  id: string;
  rank?: number;
  name: string;
  score: number;
  solved: number;
  avgTimeSeconds: number;
  hintsUsed: number;
  accuracy: number;
  avatar?: string;
  isCurrentUser?: boolean;
}

export interface RoundCompletionRecord {
  id: string;
  roundId: string;
  userHandle: string;
  completedAt: string; // ISO date string
  solved: boolean;
  timeSpentSeconds: number;
  hintsRevealedCount: number;
  accuracy: number;
  score: number;
}

export interface LeaderboardRepository {
  getEntries(timeframe: LeaderboardTimeframe): Promise<LeaderboardEntry[]>;
  recordCompletion(record: Omit<RoundCompletionRecord, 'id' | 'completedAt' | 'score'>): Promise<void>;
  getUserHandle(): string;
  setUserHandle(handle: string): void;
  clearAllRecords(): void;
}

const STORAGE_KEYS = {
  USER_HANDLE: 'cognicode_user_handle',
  RECORDS: 'cognicode_round_completions',
};

/**
 * LocalLeaderboardRepository
 * Stores and aggregates real verified round completions from localStorage.
 * Contains ZERO dummy or fabricated entries.
 */
export class LocalLeaderboardRepository implements LeaderboardRepository {
  getUserHandle(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.USER_HANDLE) || '';
    } catch {
      return '';
    }
  }

  setUserHandle(handle: string): void {
    try {
      const clean = handle.trim();
      if (clean) {
        localStorage.setItem(STORAGE_KEYS.USER_HANDLE, clean);
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER_HANDLE);
      }
    } catch {
      // Storage access failure
    }
  }

  clearAllRecords(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.RECORDS);
    } catch {
      // Storage access failure
    }
  }

  private getStoredRecords(): RoundCompletionRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async recordCompletion(
    params: Omit<RoundCompletionRecord, 'id' | 'completedAt' | 'score'>
  ): Promise<void> {
    try {
      const records = this.getStoredRecords();
      const currentHandle = this.getUserHandle() || params.userHandle || 'You';

      // Calculate score for this round using the scoring engine
      const roundScore = calculateScore({
        solved: params.solved ? 1 : 0,
        avgTimeSeconds: params.timeSpentSeconds,
        hintsUsed: params.hintsRevealedCount,
        accuracy: params.accuracy,
      });

      const newRecord: RoundCompletionRecord = {
        id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        roundId: params.roundId,
        userHandle: currentHandle,
        completedAt: new Date().toISOString(),
        solved: params.solved,
        timeSpentSeconds: params.timeSpentSeconds,
        hintsRevealedCount: params.hintsRevealedCount,
        accuracy: params.accuracy,
        score: roundScore,
      };

      records.push(newRecord);
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    } catch (err) {
      console.error('Failed to save completion record:', err);
    }
  }

  async getEntries(timeframe: LeaderboardTimeframe): Promise<LeaderboardEntry[]> {
    const records = this.getStoredRecords();
    const currentHandle = this.getUserHandle();

    // Filter by timeframe
    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    const filteredRecords = records.filter(rec => {
      if (timeframe === 'all-time') return true;
      const recordTime = new Date(rec.completedAt).getTime();
      return now - recordTime <= oneWeekMs;
    });

    if (filteredRecords.length === 0) {
      return [];
    }

    // Aggregate records by userHandle
    const userMap = new Map<string, {
      totalSolved: number;
      totalTime: number;
      totalHints: number;
      accuracySum: number;
      count: number;
    }>();

    for (const rec of filteredRecords) {
      const handle = rec.userHandle || 'Anonymous Engineer';
      const existing = userMap.get(handle) || {
        totalSolved: 0,
        totalTime: 0,
        totalHints: 0,
        accuracySum: 0,
        count: 0,
      };

      if (rec.solved) {
        existing.totalSolved += 1;
      }
      existing.totalTime += rec.timeSpentSeconds;
      existing.totalHints += rec.hintsRevealedCount;
      existing.accuracySum += rec.accuracy;
      existing.count += 1;

      userMap.set(handle, existing);
    }

    // Convert aggregated map to LeaderboardEntry list
    const entries: LeaderboardEntry[] = [];
    userMap.forEach((stats, handle) => {
      const count = Math.max(1, stats.count);
      const avgTimeSeconds = Math.round(stats.totalTime / count);
      const avgAccuracy = Math.round(stats.accuracySum / count);

      const score = calculateScore({
        solved: stats.totalSolved,
        avgTimeSeconds,
        hintsUsed: stats.totalHints,
        accuracy: avgAccuracy,
      });

      const isCurrent = Boolean(
        currentHandle && handle.toLowerCase() === currentHandle.toLowerCase()
      );

      entries.push({
        id: `user-${handle.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: handle,
        score,
        solved: stats.totalSolved,
        avgTimeSeconds,
        hintsUsed: stats.totalHints,
        accuracy: avgAccuracy,
        isCurrentUser: isCurrent,
      });
    });

    // Sort descending by score, then by solved count, then by avgTimeSeconds (ascending)
    entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.solved !== a.solved) return b.solved - a.solved;
      return a.avgTimeSeconds - b.avgTimeSeconds;
    });

    // Assign sequential ranks
    return entries.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));
  }
}

export const leaderboardRepository = new LocalLeaderboardRepository();
