import type { Challenge } from '../../types/round';
import { ecommerceCartChallenge } from './ecommerce-cart-bug';
import { apiRateLimiterChallenge } from './api-rate-limiter';
import { lruCacheTtlChallenge } from './lru-cache-ttl';
import { meetingRoomBookingChallenge } from './meeting-room-booking';
import { bankTransferLedgerChallenge } from './bank-transfer-ledger';
import { taskSchedulerDepsChallenge } from './task-scheduler-deps';
import { orderPipelineDiscountsChallenge } from './order-pipeline-discounts';

export {
  ecommerceCartChallenge,
  apiRateLimiterChallenge,
  lruCacheTtlChallenge,
  meetingRoomBookingChallenge,
  bankTransferLedgerChallenge,
  taskSchedulerDepsChallenge,
  orderPipelineDiscountsChallenge,
};

const DIFFICULTY_ORDER: Record<string, number> = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
};

export const challenges: Challenge[] = [
  ecommerceCartChallenge,
  apiRateLimiterChallenge,
  lruCacheTtlChallenge,
  meetingRoomBookingChallenge,
  bankTransferLedgerChallenge,
  taskSchedulerDepsChallenge,
  orderPipelineDiscountsChallenge,
].sort((a, b) => {
  const diffA = DIFFICULTY_ORDER[a.difficulty] ?? 2;
  const diffB = DIFFICULTY_ORDER[b.difficulty] ?? 2;
  if (diffA !== diffB) return diffA - diffB;
  return a.title.localeCompare(b.title);
});

export function getChallengeBySlug(slug?: string): Challenge | undefined {
  if (!slug) return undefined;
  return challenges.find(c => c.slug === slug || c.id === slug);
}
