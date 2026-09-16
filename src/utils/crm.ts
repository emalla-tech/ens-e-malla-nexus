import type { FollowUp } from '../types';

export function isSeedFollowUp(followUp: FollowUp) {
  return /^follow-up-\d+$/.test(followUp.id);
}

export function getLiveFollowUps(followUps: FollowUp[]) {
  return followUps.filter((followUp) => !isSeedFollowUp(followUp));
}
