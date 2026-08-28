import { Request, Response } from 'express';
import { store } from '../data/store.js';
import { Bug, FieldChange, Comment, WorkLog, Attachment } from '../types/index.js';
import { StateMachineService } from '../services/stateMachine.js';
import { DependencyGraphService } from '../services/dependencyGraph.js';
import { BugzillaExportImportService } from '../services/bugzillaExportImport.js';
import { SlashCommandService } from '../services/slashCommands.js';

export class BugController {
  public static getBugs(req: Request, res: Response) {
    try {
      let bugs = store.getBugs();
      const {
        search,
        product,
        component,
        status,
        severity,
        priority,
        assignee,
        reporter,
        milestone,
        flag,
        tag,
        isSecuritySensitive,
        sort,
        order
      } = req.query;

      // Filter by product
      if (product) {
        bugs = bugs.filter(b => b.productId === product || b.productName.toLowerCase() === (product as string).toLowerCase());
      }

      // Filter by component
      if (component) {
        bugs = bugs.filter(b => b.componentId === component || b.componentName.toLowerCase() === (component as string).toLowerCase());
      }

      // Filter by status
      if (status) {
        const statuses = (status as string).split(',');
        bugs = bugs.filter(b => statuses.includes(b.status));
      }

      // Filter by severity
      if (severity) {
        const severities = (severity as string).split(',');
        bugs = bugs.filter(b => severities.includes(b.severity));
      }

      // Filter by priority
      if (priority) {
        const priorities = (priority as string).split(',');
        bugs = bugs.filter(b => priorities.includes(b.priority));
      }

      // Filter by assignee
      if (assignee) {
        bugs = bugs.filter(b => b.assigneeId === assignee || b.assigneeName.toLowerCase().includes((assignee as string).toLowerCase()));
      }

      // Filter by reporter
      if (reporter) {
        bugs = bugs.filter(b => b.reporterId === reporter || b.reporterName.toLowerCase().includes((reporter as string).toLowerCase()));
      }

      // Filter by milestone
      if (milestone) {
        bugs = bugs.filter(b => b.targetMilestone === milestone);
      }

      // Filter by flag
      if (flag) {
        bugs = bugs.filter(b => b.flags.some(f => f.name === flag || `${f.name}${f.status}` === flag));
      }

      // Filter by tag
      if (tag) {
        bugs = bugs.filter(b => b.tags.includes(tag as string));
      }

      // Filter by security
      if (isSecuritySensitive !== undefined) {
        const sec = isSecuritySensitive === 'true';
        bugs = bugs.filter(b => b.isSecuritySensitive === sec);
      }

      // Advanced search query parser (e.g. 'is:open severity:blocker memory')
      if (search && typeof search === 'string') {
        const terms = search.trim().split(/\s+/);
        for (const term of terms) {
          if (term.startsWith('is:open')) {
            bugs = bugs.filter(b => !['RESOLVED', 'VERIFIED', 'CLOSED'].includes(b.status));
          } else if (term.startsWith('is:closed') || term.startsWith('is:resolved')) {
            bugs = bugs.filter(b => ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(b.status));
          } else if (term.startsWith('severity:')) {
            const val = term.replace('severity:', '').toLowerCase();
            bugs = bugs.filter(b => b.severity.toLowerCase() === val);
          } else if (term.startsWith('priority:')) {
            const val = term.replace('priority:', '').toUpperCase();
            bugs = bugs.filter(b => b.priority === val);
          } else if (term.startsWith('assignee:')) {
            const val = term.replace('assignee:', '').toLowerCase();
            bugs = bugs.filter(b => b.assigneeName.toLowerCase().includes(val));
          } else if (term.startsWith('tag:')) {
            const val = term.replace('tag:', '').toLowerCase();
            bugs = bugs.filter(b => b.tags.some(t => t.toLowerCase() === val));
          } else if (term.startsWith('flag:')) {
            const val = term.replace('flag:', '').toLowerCase();
            bugs = bugs.filter(b => b.flags.some(f => f.name.toLowerCase().includes(val)));
          } else if (term.startsWith('#')) {
            const num = parseInt(term.substring(1), 10);
            if (!isNaN(num)) {
              bugs = bugs.filter(b => b.bugNumber === num);
            }
          } else {
            // General text match on title, description, tags
            const q = term.toLowerCase();
            bugs = bugs.filter(b =>
              b.title.toLowerCase().includes(q) ||
              b.description.toLowerCase().includes(q) ||
              b.tags.some(t => t.toLowerCase().includes(q)) ||
              b.componentName.toLowerCase().includes(q) ||
              b.bugNumber.toString().includes(q)
            );
          }
        }
      }

      // Sorting
      const sortField = (sort as string) || 'updatedAt';
      const isDesc = order !== 'asc';

      bugs.sort((a: any, b: any) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return isDesc ? 1 : -1;
        if (valA > valB) return isDesc ? -1 : 1;
        return 0;
      });

      return res.json({ total: bugs.length, data: bugs });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static getBugById(req: Request, res: Response) {
    try {
      const bug = store.getBugById(req.params.id);
      if (!bug) {
        return res.status(404).json({ error: 'Bug not found' });
      }

      const auditLogs = store.getAuditLogs(bug.id);
      const graph = DependencyGraphService.buildGraph(store.getBugs(), bug.id);

      return res.json({
        data: bug,
        auditLogs,
        graph,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static createBug(req: Request, res: Response) {
    try {
      const bugData = req.body;
      const user = req.body._currentUser || store.getUsers()[0];

      if (!bugData.title || !bugData.productId || !bugData.componentId) {
        return res.status(400).json({ error: 'Title, Product, and Component are required fields.' });
      }

      const product = store.getProductById(bugData.productId);
      if (!product) {
        return res.status(400).json({ error: 'Selected product does not exist.' });
      }

      const component = product.components.find(c => c.id === bugData.componentId);
      if (!component) {
        return res.status(400).json({ error: 'Selected component does not exist in this product.' });
      }

      const assigneeId = bugData.assigneeId || component.leadId;
      const assigneeUser = store.getUserById(assigneeId);
      const assigneeName = assigneeUser ? assigneeUser.name : component.leadName;

      const qaContactId = bugData.qaContactId || component.defaultQaId;
      const qaUser = store.getUserById(qaContactId);
      const qaContactName = qaUser ? qaUser.name : component.defaultQaName;

      const newBug = store.createBug({
        title: bugData.title,
        description: bugData.description || '',
        productId: product.id,
        productName: product.name,
        componentId: component.id,
        componentName: component.name,
        version: bugData.version || product.versions[0] || '1.0',
        targetMilestone: bugData.targetMilestone || product.milestones[0]?.name,
        status: bugData.status || 'NEW',
        resolution: bugData.resolution || null,
        severity: bugData.severity || 'normal',
        priority: bugData.priority || 'P3',
        reporterId: user.id,
        reporterName: user.name,
        assigneeId,
        assigneeName,
        qaContactId,
        qaContactName,
        ccList: bugData.ccList || [],
        watchers: [user.id],
        votes: 1,
        votedUserIds: [user.id],
        dependsOn: bugData.dependsOn || [],
        blocks: bugData.blocks || [],
        seeAlso: bugData.seeAlso || [],
        flags: bugData.flags || [],
        tags: bugData.tags || [],
        isSecuritySensitive: Boolean(bugData.isSecuritySensitive),
        estimatedHours: Number(bugData.estimatedHours) || 0,
        remainingHours: Number(bugData.remainingHours) || Number(bugData.estimatedHours) || 0,
        workLogs: [],
        attachments: bugData.attachments || [],
        comments: bugData.initialComment ? [{
          id: `c-${Date.now()}`,
          authorId: user.id,
          authorName: user.name,
          text: bugData.initialComment,
          createdAt: new Date().toISOString(),
        }] : [],
        gitLinkage: bugData.gitLinkage,
      });

      // Audit log creation
      store.addAuditLog({
        bugId: newBug.id,
        actorId: user.id,
        actorName: user.name,
        changes: [
          { field: 'status', oldValue: null, newValue: newBug.status },
          { field: 'severity', oldValue: null, newValue: newBug.severity },
          { field: 'priority', oldValue: null, newValue: newBug.priority },
          { field: 'assignee', oldValue: null, newValue: newBug.assigneeName }
        ]
      });

      return res.status(201).json({ data: newBug });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static updateBug(req: Request, res: Response) {
    try {
      const bugId = req.params.id;
      const currentBug = store.getBugById(bugId);
      if (!currentBug) {
        return res.status(404).json({ error: 'Bug not found' });
      }

      const updates = req.body;
      const user = req.body._currentUser || store.getUsers()[0];

      // Lifecycle validation if status or resolution is changing
      if (updates.status || updates.resolution !== undefined) {
        const targetStatus = updates.status || currentBug.status;
        const targetResolution = updates.resolution !== undefined ? updates.resolution : currentBug.resolution;
        const dupId = updates.duplicateOfBugId !== undefined ? updates.duplicateOfBugId : currentBug.duplicateOfBugId;

        const validation = StateMachineService.validateTransition(currentBug, targetStatus, targetResolution, dupId);
        if (!validation.valid) {
          return res.status(400).json({ error: validation.error });
        }
      }

      // Auto-resolve componentName if componentId changed
      if (updates.componentId && !updates.componentName) {
        const prod = store.getProductById(currentBug.productId);
        const comp = prod?.components.find(c => c.id === updates.componentId);
        if (comp) {
          updates.componentName = comp.name;
        }
      }

      // Auto-resolve assigneeName if assigneeId changed
      if (updates.assigneeId && !updates.assigneeName) {
        const assigneeUser = store.getUserById(updates.assigneeId);
        if (assigneeUser) {
          updates.assigneeName = assigneeUser.name;
        }
      }

      // Track changed fields for audit log
      const changes: FieldChange[] = [];
      const trackFields: (keyof Bug)[] = [
        'status', 'resolution', 'severity', 'priority', 'assigneeId', 'assigneeName',
        'targetMilestone', 'componentId', 'componentName', 'version', 'isSecuritySensitive',
        'estimatedHours', 'remainingHours', 'duplicateOfBugId', 'tags'
      ];

      for (const field of trackFields) {
        if (updates[field] !== undefined && updates[field] !== currentBug[field]) {
          changes.push({
            field,
            oldValue: currentBug[field],
            newValue: updates[field]
          });
        }
      }

      // Handle duplicate side-effects (e.g. merge comments/CC list into target bug)
      if (updates.resolution === 'DUPLICATE' && updates.duplicateOfBugId) {
        const targetBug = store.getBugById(updates.duplicateOfBugId);
        if (targetBug) {
          const autoComment: Comment = {
            id: `c-${Date.now()}`,
            authorId: user.id,
            authorName: user.name,
            text: `*** Bug ${currentBug.bugNumber} has been marked as a duplicate of this bug. ***`,
            createdAt: new Date().toISOString()
          };
          targetBug.comments.push(autoComment);
          for (const cc of currentBug.ccList) {
            if (!targetBug.ccList.includes(cc)) targetBug.ccList.push(cc);
          }
          store.updateBug(targetBug.id, targetBug);
        }
      }

      const updatedBug = store.updateBug(bugId, updates);
      if (!updatedBug) {
        return res.status(404).json({ error: 'Bug not found' });
      }

      if (changes.length > 0) {
        store.addAuditLog({
          bugId: updatedBug.id,
          actorId: user.id,
          actorName: user.name,
          changes
        });
      }

      return res.json({ data: updatedBug });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static addComment(req: Request, res: Response) {
    try {
      const bugId = req.params.id;
      const bug = store.getBugById(bugId);
      if (!bug) return res.status(404).json({ error: 'Bug not found' });

      const { text, isInternal } = req.body;
      const user = req.body._currentUser || store.getUsers()[0];

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Comment text cannot be empty' });
      }

      // Execute any embedded slash commands (/resolve, /assign, /priority, /flag, /log, etc.)
      const commandExecResult = SlashCommandService.execute(bug.id, text, user);

      const newComment: Comment = {
        id: `c-${Date.now()}`,
        authorId: user.id,
        authorName: user.name,
        authorAvatar: user.avatarUrl,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        isInternal: Boolean(isInternal),
      };

      const updatedBug = store.getBugById(bug.id) || bug;
      updatedBug.comments.push(newComment);
      store.updateBug(updatedBug.id, { comments: updatedBug.comments });

      store.addAuditLog({
        bugId: updatedBug.id,
        actorId: user.id,
        actorName: user.name,
        changes: [{ field: 'comment', oldValue: null, newValue: `Added comment #${updatedBug.comments.length}` }],
        commentId: newComment.id,
      });

      return res.status(201).json({
        data: newComment,
        bug: store.getBugById(updatedBug.id),
        executedCommands: commandExecResult.executedCommands
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static addWorkLog(req: Request, res: Response) {
    try {
      const bugId = req.params.id;
      const bug = store.getBugById(bugId);
      if (!bug) return res.status(404).json({ error: 'Bug not found' });

      const { hoursSpent, comment, newRemainingHours } = req.body;
      const user = req.body._currentUser || store.getUsers()[0];

      const hrs = Number(hoursSpent);
      if (isNaN(hrs) || hrs <= 0) {
        return res.status(400).json({ error: 'Valid positive hoursSpent is required' });
      }

      const workLog: WorkLog = {
        id: `wl-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        hoursSpent: hrs,
        comment: comment || 'Work session logged',
        loggedAt: new Date().toISOString(),
      };

      bug.workLogs.push(workLog);
      const remainingHours = newRemainingHours !== undefined ? Number(newRemainingHours) : Math.max(0, bug.remainingHours - hrs);

      store.updateBug(bug.id, {
        workLogs: bug.workLogs,
        remainingHours,
      });

      store.addAuditLog({
        bugId: bug.id,
        actorId: user.id,
        actorName: user.name,
        changes: [
          { field: 'workLog', oldValue: null, newValue: `+${hrs}h (${comment || 'Work log'})` },
          { field: 'remainingHours', oldValue: bug.remainingHours, newValue: remainingHours }
        ]
      });

      return res.status(201).json({ data: workLog, bug });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static toggleVote(req: Request, res: Response) {
    try {
      const bugId = req.params.id;
      const bug = store.getBugById(bugId);
      if (!bug) return res.status(404).json({ error: 'Bug not found' });

      const user = req.body._currentUser || store.getUsers()[0];
      const hasVoted = bug.votedUserIds.includes(user.id);

      if (hasVoted) {
        bug.votedUserIds = bug.votedUserIds.filter(id => id !== user.id);
        bug.votes = Math.max(0, bug.votes - 1);
      } else {
        bug.votedUserIds.push(user.id);
        bug.votes++;
      }

      store.updateBug(bug.id, {
        votes: bug.votes,
        votedUserIds: bug.votedUserIds,
      });

      return res.json({ votes: bug.votes, hasVoted: !hasVoted });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static bulkUpdate(req: Request, res: Response) {
    try {
      const { bugIds, updates } = req.body;
      const user = req.body._currentUser || store.getUsers()[0];

      if (!Array.isArray(bugIds) || bugIds.length === 0) {
        return res.status(400).json({ error: 'bugIds must be a non-empty array' });
      }

      const updatedBugs: Bug[] = [];
      for (const id of bugIds) {
        const current = store.getBugById(id);
        if (current) {
          const updated = store.updateBug(id, updates);
          if (updated) {
            updatedBugs.push(updated);
            store.addAuditLog({
              bugId: id,
              actorId: user.id,
              actorName: user.name,
              changes: Object.keys(updates).map(k => ({
                field: k,
                oldValue: (current as any)[k],
                newValue: updates[k]
              }))
            });
          }
        }
      }

      return res.json({ updatedCount: updatedBugs.length, data: updatedBugs });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static exportBugzillaXml(req: Request, res: Response) {
    try {
      const bugs = store.getBugs();
      const xml = BugzillaExportImportService.exportToBugzillaXml(bugs);
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', 'attachment; filename="omnibug-export.xml"');
      return res.send(xml);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async importBugzillaXml(req: Request, res: Response) {
    try {
      const { xmlContent } = req.body;
      if (!xmlContent) return res.status(400).json({ error: 'xmlContent is required' });

      const parsed = await BugzillaExportImportService.importFromBugzillaXml(xmlContent);
      const created: Bug[] = [];

      for (const p of parsed) {
        const prod = store.getProducts()[0];
        const newBug = store.createBug({
          title: p.title || 'Imported Bug',
          description: p.description || '',
          productId: prod.id,
          productName: prod.name,
          componentId: prod.components[0].id,
          componentName: prod.components[0].name,
          version: p.version || prod.versions[0],
          targetMilestone: p.targetMilestone || prod.milestones[0]?.name,
          status: (p.status as any) || 'NEW',
          resolution: (p.resolution as any) || null,
          severity: (p.severity as any) || 'normal',
          priority: (p.priority as any) || 'P3',
          reporterId: 'usr-6',
          reporterName: 'Bugzilla Import Agent',
          assigneeId: prod.components[0].leadId,
          assigneeName: prod.components[0].leadName,
          qaContactId: prod.components[0].defaultQaId,
          qaContactName: prod.components[0].defaultQaName,
          ccList: [],
          watchers: [],
          votes: 0,
          votedUserIds: [],
          dependsOn: [],
          blocks: [],
          seeAlso: [],
          flags: [],
          tags: ['imported-bugzilla'],
          isSecuritySensitive: false,
          estimatedHours: 0,
          remainingHours: 0,
          workLogs: [],
          attachments: [],
          comments: [],
        });
        created.push(newBug);
      }

      return res.json({ importedCount: created.length, data: created });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
