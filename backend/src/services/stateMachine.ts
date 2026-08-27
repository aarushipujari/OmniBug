import { Bug, BugStatus, BugResolution } from '../types/index.js';

export interface TransitionValidationResult {
  valid: boolean;
  error?: string;
}

export const VALID_STATUS_TRANSITIONS: Record<BugStatus, BugStatus[]> = {
  UNCONFIRMED: ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  NEW: ['IN_PROGRESS', 'IN_REVIEW', 'RESOLVED', 'CLOSED'],
  IN_PROGRESS: ['IN_REVIEW', 'RESOLVED', 'NEW', 'CLOSED'],
  IN_REVIEW: ['RESOLVED', 'IN_PROGRESS', 'NEW', 'CLOSED'],
  RESOLVED: ['VERIFIED', 'CLOSED', 'REOPENED', 'IN_PROGRESS'],
  VERIFIED: ['CLOSED', 'REOPENED', 'RESOLVED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['IN_PROGRESS', 'IN_REVIEW', 'RESOLVED', 'NEW']
};

export class StateMachineService {
  public static validateTransition(
    currentBug: Bug,
    targetStatus: BugStatus,
    targetResolution?: BugResolution,
    duplicateOfBugId?: string
  ): TransitionValidationResult {
    // Check if status is same
    if (currentBug.status === targetStatus && currentBug.resolution === targetResolution) {
      return { valid: true };
    }

    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentBug.status];
    if (!allowedTransitions.includes(targetStatus) && currentBug.status !== targetStatus) {
      return {
        valid: false,
        error: `Cannot transition bug from ${currentBug.status} to ${targetStatus}. Allowed transitions: ${allowedTransitions.join(', ')}`
      };
    }

    // Resolution rules
    if (targetStatus === 'RESOLVED' || targetStatus === 'CLOSED') {
      if (!targetResolution) {
        return {
          valid: false,
          error: `A resolution is required when setting bug status to ${targetStatus} (e.g. FIXED, INVALID, WONTFIX, DUPLICATE).`
        };
      }

      if (targetResolution === 'DUPLICATE') {
        if (!duplicateOfBugId) {
          return {
            valid: false,
            error: 'You must specify the original bug ID when resolving as DUPLICATE.'
          };
        }
        if (duplicateOfBugId === currentBug.id || duplicateOfBugId === `bug-${currentBug.bugNumber}`) {
          return {
            valid: false,
            error: 'A bug cannot be marked as a duplicate of itself.'
          };
        }
      }
    }

    // Check if reopened
    if (targetStatus === 'REOPENED') {
      // Reopened clears resolution
    }

    return { valid: true };
  }
}
