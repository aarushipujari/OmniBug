export type BugStatus =
  | 'UNCONFIRMED'
  | 'NEW'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'RESOLVED'
  | 'VERIFIED'
  | 'CLOSED'
  | 'REOPENED';

export type BugResolution =
  | 'FIXED'
  | 'INVALID'
  | 'WONTFIX'
  | 'DUPLICATE'
  | 'WORKSFORME'
  | 'INCOMPLETE'
  | 'NOT_A_BUG'
  | null;

export type BugSeverity =
  | 'blocker'
  | 'critical'
  | 'major'
  | 'normal'
  | 'minor'
  | 'trivial'
  | 'enhancement';

export type BugPriority = 'P1' | 'P2' | 'P3' | 'P4' | 'P5';

export type FlagStatus = '?' | '+' | '-' | 'X';

export interface BugFlag {
  id: string;
  name: 'review' | 'needinfo' | 'qa-verify' | 'security-audit' | 'release-blocker';
  status: FlagStatus; // ? = requested, + = granted, - = denied, X = cleared
  requesteeId: string;
  requesteeName: string;
  setterId: string;
  setterName: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'maintainer' | 'developer' | 'qa' | 'reporter';
  avatarUrl?: string;
}

export interface ProductComponent {
  id: string;
  name: string;
  description: string;
  leadId: string;
  leadName: string;
  defaultQaId: string;
  defaultQaName: string;
}

export interface Milestone {
  id: string;
  name: string;
  targetDate: string;
  status: 'open' | 'closed';
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  components: ProductComponent[];
  milestones: Milestone[];
  versions: string[];
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  description: string;
  isPatch: boolean;
  patchContent?: string;
  uploaderId: string;
  uploaderName: string;
  uploadedAt: string;
  downloadUrl?: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
  isInternal?: boolean;
}

export interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface AuditLogEntry {
  id: string;
  bugId: string;
  actorId: string;
  actorName: string;
  timestamp: string;
  changes: FieldChange[];
  commentId?: string;
}

export interface WorkLog {
  id: string;
  userId: string;
  userName: string;
  hoursSpent: number;
  comment: string;
  loggedAt: string;
}

export interface GitLinkage {
  commitHash?: string;
  commitMessage?: string;
  branch?: string;
  pullRequestUrl?: string;
  ciStatus?: 'success' | 'failed' | 'running' | 'pending';
}

export interface Bug {
  id: string;
  bugNumber: number;
  title: string;
  description: string;
  productId: string;
  productName: string;
  componentId: string;
  componentName: string;
  version: string;
  targetMilestone?: string;
  
  status: BugStatus;
  resolution: BugResolution;
  duplicateOfBugId?: string;
  
  severity: BugSeverity;
  priority: BugPriority;
  
  reporterId: string;
  reporterName: string;
  assigneeId: string;
  assigneeName: string;
  qaContactId?: string;
  qaContactName?: string;
  
  ccList: string[]; // User IDs or emails
  watchers: string[];
  votes: number;
  votedUserIds: string[];
  
  // Dependencies
  dependsOn: string[]; // Bug IDs this bug depends on (Blocked By)
  blocks: string[];    // Bug IDs this bug blocks (Blocker For)
  seeAlso: string[];
  
  flags: BugFlag[];
  tags: string[];
  
  isSecuritySensitive: boolean;
  
  // Time tracking
  estimatedHours: number;
  remainingHours: number;
  workLogs: WorkLog[];
  
  attachments: Attachment[];
  comments: Comment[];
  
  gitLinkage?: GitLinkage;
  
  lockVersion?: number; // Optimistic concurrency lock
  
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}
