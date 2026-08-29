import { Request, Response, NextFunction } from 'express';
import { BugStatus, BugResolution, BugSeverity, BugPriority } from '../types/index.js';

const VALID_STATUSES: BugStatus[] = ['UNCONFIRMED', 'NEW', 'IN_PROGRESS', 'IN_REVIEW', 'RESOLVED', 'VERIFIED', 'CLOSED', 'REOPENED'];
const VALID_RESOLUTIONS: BugResolution[] = ['FIXED', 'INVALID', 'WONTFIX', 'DUPLICATE', 'WORKSFORME', 'INCOMPLETE', 'NOT_A_BUG', null];
const VALID_SEVERITIES: BugSeverity[] = ['blocker', 'critical', 'major', 'normal', 'minor', 'trivial', 'enhancement'];
const VALID_PRIORITIES: BugPriority[] = ['P1', 'P2', 'P3', 'P4', 'P5'];

export const validateBugCreate = (req: Request, res: Response, next: NextFunction) => {
  const { title, description, productId, severity, priority } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    return res.status(400).json({ error: 'Title is required and must be at least 3 characters long', code: 'INVALID_TITLE' });
  }

  if (title.length > 255) {
    return res.status(400).json({ error: 'Title cannot exceed 255 characters', code: 'TITLE_TOO_LONG' });
  }

  if (description && typeof description !== 'string') {
    return res.status(400).json({ error: 'Description must be a valid string', code: 'INVALID_DESCRIPTION' });
  }

  if (severity && !VALID_SEVERITIES.includes(severity)) {
    return res.status(400).json({ error: `Invalid severity. Must be one of [${VALID_SEVERITIES.join(', ')}]`, code: 'INVALID_SEVERITY' });
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: `Invalid priority. Must be one of [${VALID_PRIORITIES.join(', ')}]`, code: 'INVALID_PRIORITY' });
  }

  next();
};

export const validateTransition = (req: Request, res: Response, next: NextFunction) => {
  const { status, resolution } = req.body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid status '${status}'. Must be one of [${VALID_STATUSES.join(', ')}]`,
      code: 'INVALID_STATUS',
      allowedStatuses: VALID_STATUSES
    });
  }

  if (resolution !== undefined && !VALID_RESOLUTIONS.includes(resolution)) {
    return res.status(400).json({
      error: `Invalid resolution '${resolution}'. Must be one of [${VALID_RESOLUTIONS.filter(Boolean).join(', ')}, null]`,
      code: 'INVALID_RESOLUTION'
    });
  }

  next();
};

export const validateComment = (req: Request, res: Response, next: NextFunction) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Comment text cannot be empty', code: 'EMPTY_COMMENT' });
  }

  if (text.length > 15000) {
    return res.status(400).json({ error: 'Comment exceeds maximum allowed length of 15,000 characters', code: 'COMMENT_TOO_LONG' });
  }

  next();
};

export const validateWorkLog = (req: Request, res: Response, next: NextFunction) => {
  const { hoursSpent } = req.body;
  const hrs = Number(hoursSpent);

  if (isNaN(hrs) || hrs <= 0 || hrs > 240) {
    return res.status(400).json({ error: 'hoursSpent must be a positive number between 0.1 and 240', code: 'INVALID_WORKLOG_HOURS' });
  }

  next();
};
