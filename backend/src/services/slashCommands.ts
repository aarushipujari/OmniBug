import { Bug, User, BugStatus, BugResolution, BugPriority, BugSeverity, BugFlag } from '../types/index.js';
import { store } from '../data/store.js';
import { StateMachineService } from './stateMachine.js';

export interface SlashCommandResult {
  executedCommands: {
    command: string;
    description: string;
    success: boolean;
    error?: string;
  }[];
  cleanText: string;
}

export class SlashCommandService {
  public static execute(
    bugId: string,
    rawCommentText: string,
    currentUser: User
  ): SlashCommandResult {
    const bug = store.getBugById(bugId);
    if (!bug) {
      return { executedCommands: [], cleanText: rawCommentText };
    }

    const lines = rawCommentText.split('\n');
    const keptLines: string[] = [];
    const executed: SlashCommandResult['executedCommands'] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('/')) {
        keptLines.push(line);
        continue;
      }

      // Check known slash commands
      const matchResolve = trimmed.match(/^\/resolve\s+([A-Z_]+)(?:\s+(?:#|bug-)?(\d+))?/i);
      const matchStatus = trimmed.match(/^\/status\s+([A-Z_]+)/i);
      const matchAssign = trimmed.match(/^\/assign\s+@?([a-zA-Z0-9_\-\.]+)/i);
      const matchPriority = trimmed.match(/^\/priority\s+(P[1-5])/i);
      const matchSeverity = trimmed.match(/^\/severity\s+([a-zA-Z]+)/i);
      const matchFlag = trimmed.match(/^\/flag\s+([a-zA-Z\-]+)\?\s*@?([a-zA-Z0-9_\-\.]+)?/i);
      const matchLog = trimmed.match(/^\/log\s+(\d+(?:\.\d+)?)\s*h?(?:\s+(.+))?/i);
      const matchTag = trimmed.match(/^\/tag\s+(.+)/i);

      if (matchResolve) {
        const resolution = matchResolve[1].toUpperCase() as BugResolution;
        const dupId = matchResolve[2] ? `bug-${matchResolve[2]}` : undefined;
        const validation = StateMachineService.validateTransition(bug, 'RESOLVED', resolution, dupId);
        if (validation.valid) {
          store.updateBug(bug.id, { status: 'RESOLVED', resolution, duplicateOfBugId: dupId });
          store.addAuditLog({
            bugId: bug.id,
            actorId: currentUser.id,
            actorName: currentUser.name,
            changes: [
              { field: 'status', oldValue: bug.status, newValue: 'RESOLVED' },
              { field: 'resolution', oldValue: bug.resolution, newValue: resolution }
            ]
          });
          executed.push({
            command: trimmed,
            description: `Resolved issue as ${resolution}${dupId ? ` of ${dupId}` : ''}`,
            success: true
          });
        } else {
          executed.push({
            command: trimmed,
            description: `Failed to resolve: ${validation.error}`,
            success: false,
            error: validation.error
          });
        }
      } else if (matchStatus) {
        const targetStatus = matchStatus[1].toUpperCase() as BugStatus;
        const resolution = (targetStatus === 'RESOLVED' || targetStatus === 'CLOSED') ? 'FIXED' : undefined;
        const validation = StateMachineService.validateTransition(bug, targetStatus, resolution);
        if (validation.valid) {
          store.updateBug(bug.id, { status: targetStatus, resolution });
          store.addAuditLog({
            bugId: bug.id,
            actorId: currentUser.id,
            actorName: currentUser.name,
            changes: [{ field: 'status', oldValue: bug.status, newValue: targetStatus }]
          });
          executed.push({
            command: trimmed,
            description: `Updated status to ${targetStatus}`,
            success: true
          });
        } else {
          executed.push({
            command: trimmed,
            description: `Cannot set status: ${validation.error}`,
            success: false,
            error: validation.error
          });
        }
      } else if (matchAssign) {
        const targetName = matchAssign[1].toLowerCase();
        const foundUser = store.getUsers().find(u =>
          u.name.toLowerCase().includes(targetName) ||
          u.email.toLowerCase().includes(targetName) ||
          u.id.toLowerCase() === targetName
        );
        if (foundUser) {
          store.updateBug(bug.id, { assigneeId: foundUser.id, assigneeName: foundUser.name });
          store.addAuditLog({
            bugId: bug.id,
            actorId: currentUser.id,
            actorName: currentUser.name,
            changes: [{ field: 'assignee', oldValue: bug.assigneeName, newValue: foundUser.name }]
          });
          executed.push({
            command: trimmed,
            description: `Reassigned to ${foundUser.name}`,
            success: true
          });
        } else {
          executed.push({
            command: trimmed,
            description: `User "${matchAssign[1]}" not found`,
            success: false,
            error: 'User not found'
          });
        }
      } else if (matchPriority) {
        const targetPri = matchPriority[1].toUpperCase() as BugPriority;
        store.updateBug(bug.id, { priority: targetPri });
        store.addAuditLog({
          bugId: bug.id,
          actorId: currentUser.id,
          actorName: currentUser.name,
          changes: [{ field: 'priority', oldValue: bug.priority, newValue: targetPri }]
        });
        executed.push({
          command: trimmed,
          description: `Updated priority to ${targetPri}`,
          success: true
        });
      } else if (matchSeverity) {
        const targetSev = matchSeverity[1].toLowerCase() as BugSeverity;
        store.updateBug(bug.id, { severity: targetSev });
        store.addAuditLog({
          bugId: bug.id,
          actorId: currentUser.id,
          actorName: currentUser.name,
          changes: [{ field: 'severity', oldValue: bug.severity, newValue: targetSev }]
        });
        executed.push({
          command: trimmed,
          description: `Updated severity to ${targetSev}`,
          success: true
        });
      } else if (matchFlag) {
        const flagName = matchFlag[1].toLowerCase() as BugFlag['name'];
        const targetUserStr = matchFlag[2] ? matchFlag[2].toLowerCase() : '';
        const foundUser = targetUserStr
          ? store.getUsers().find(u => u.name.toLowerCase().includes(targetUserStr) || u.email.toLowerCase().includes(targetUserStr))
          : undefined;
        const requesteeUser = foundUser || store.getUserById(bug.assigneeId) || store.getUsers()[0];

        const existingIdx = bug.flags.findIndex(f => f.name === flagName);
        const flagObj: BugFlag = {
          id: existingIdx !== -1 ? bug.flags[existingIdx].id : `flg-${Date.now()}`,
          name: flagName,
          status: '?',
          requesteeId: requesteeUser.id,
          requesteeName: requesteeUser.name,
          setterId: currentUser.id,
          setterName: currentUser.name,
          updatedAt: new Date().toISOString()
        };

        if (existingIdx !== -1) {
          bug.flags[existingIdx] = flagObj;
        } else {
          bug.flags.push(flagObj);
        }
        store.updateBug(bug.id, { flags: bug.flags });
        store.addAuditLog({
          bugId: bug.id,
          actorId: currentUser.id,
          actorName: currentUser.name,
          changes: [{ field: 'flag', oldValue: 'none', newValue: `${flagName}? (${requesteeUser.name})` }]
        });
        executed.push({
          command: trimmed,
          description: `Requested flag ${flagName}? from ${requesteeUser.name}`,
          success: true
        });
      } else if (matchLog) {
        const hrs = parseFloat(matchLog[1]);
        const workComment = matchLog[2] || 'Work logged via slash command';
        if (!isNaN(hrs) && hrs > 0) {
          bug.workLogs.push({
            id: `wl-${Date.now()}`,
            userId: currentUser.id,
            userName: currentUser.name,
            hoursSpent: hrs,
            comment: workComment,
            loggedAt: new Date().toISOString()
          });
          const remainingHours = Math.max(0, bug.remainingHours - hrs);
          store.updateBug(bug.id, { workLogs: bug.workLogs, remainingHours });
          store.addAuditLog({
            bugId: bug.id,
            actorId: currentUser.id,
            actorName: currentUser.name,
            changes: [
              { field: 'workLog', oldValue: null, newValue: `+${hrs}h (${workComment})` },
              { field: 'remainingHours', oldValue: bug.remainingHours, newValue: remainingHours }
            ]
          });
          executed.push({
            command: trimmed,
            description: `Logged +${hrs}h work session`,
            success: true
          });
        }
      } else if (matchTag) {
        const newTags = matchTag[1].split(/\s+/).map(t => t.replace('#', '').toLowerCase().trim()).filter(Boolean);
        const mergedTags = Array.from(new Set([...bug.tags, ...newTags]));
        store.updateBug(bug.id, { tags: mergedTags });
        executed.push({
          command: trimmed,
          description: `Added tags: ${newTags.join(', ')}`,
          success: true
        });
      } else {
        keptLines.push(line);
      }
    }

    return {
      executedCommands: executed,
      cleanText: keptLines.join('\n').trim()
    };
  }
}
