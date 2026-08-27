import { Request, Response } from 'express';
import { store } from '../data/store.js';
import { BugFlag, FlagStatus } from '../types/index.js';

export class FlagController {
  public static setFlag(req: Request, res: Response) {
    try {
      const bugId = req.params.bugId;
      const bug = store.getBugById(bugId);
      if (!bug) return res.status(404).json({ error: 'Bug not found' });

      const { name, status, requesteeId } = req.body as {
        name: BugFlag['name'];
        status: FlagStatus;
        requesteeId?: string;
      };

      const user = req.body._currentUser || store.getUsers()[0];

      if (!name || !status) {
        return res.status(400).json({ error: 'name and status are required for flag updates' });
      }

      const existingFlagIndex = bug.flags.findIndex(f => f.name === name);

      if (status === 'X') {
        // Clear flag
        if (existingFlagIndex !== -1) {
          const removed = bug.flags.splice(existingFlagIndex, 1)[0];
          store.updateBug(bug.id, { flags: bug.flags });
          store.addAuditLog({
            bugId: bug.id,
            actorId: user.id,
            actorName: user.name,
            changes: [{ field: 'flag', oldValue: `${removed.name}${removed.status}`, newValue: 'cleared' }]
          });
        }
        return res.json({ message: 'Flag cleared', flags: bug.flags });
      }

      let requesteeUser = requesteeId ? store.getUserById(requesteeId) : undefined;
      if (!requesteeUser && existingFlagIndex !== -1) {
        requesteeUser = store.getUserById(bug.flags[existingFlagIndex].requesteeId);
      }
      if (!requesteeUser) {
        requesteeUser = store.getUserById(bug.assigneeId) || store.getUsers()[0];
      }

      const flagObj: BugFlag = {
        id: existingFlagIndex !== -1 ? bug.flags[existingFlagIndex].id : `flg-${Date.now()}`,
        name,
        status,
        requesteeId: requesteeUser.id,
        requesteeName: requesteeUser.name,
        setterId: user.id,
        setterName: user.name,
        updatedAt: new Date().toISOString(),
      };

      const oldFlagStr = existingFlagIndex !== -1 ? `${bug.flags[existingFlagIndex].name}${bug.flags[existingFlagIndex].status}` : 'none';

      if (existingFlagIndex !== -1) {
        bug.flags[existingFlagIndex] = flagObj;
      } else {
        bug.flags.push(flagObj);
      }

      store.updateBug(bug.id, { flags: bug.flags });

      store.addAuditLog({
        bugId: bug.id,
        actorId: user.id,
        actorName: user.name,
        changes: [{ field: 'flag', oldValue: oldFlagStr, newValue: `${flagObj.name}${flagObj.status} (${flagObj.requesteeName})` }]
      });

      return res.json({ data: flagObj, flags: bug.flags });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
