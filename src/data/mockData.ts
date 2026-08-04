import type { Customer, FollowUp, Goal, Meeting, NotificationItem, Project, QuickNote, Task } from '../types';

const today = new Date();
const isoToday = today.toISOString().slice(0, 10);
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 7);
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

export const mockProjects: Project[] = [
  {
    id: 'project-growth',
    name: 'Growth Command Center',
    description: 'A weekly operating cadence for acquisition, conversion, and retention metrics.',
    status: 'Active',
    progress: 72,
    totalTasks: 18,
    completedTasks: 13,
    dueDate: nextWeek.toISOString().slice(0, 10),
    owner: 'John',
    client: 'Internal',
  },
  {
    id: 'project-enterprise',
    name: 'Enterprise Customer Rollout',
    description: 'Implementation plan for onboarding strategic accounts with executive visibility.',
    status: 'At Risk',
    progress: 46,
    totalTasks: 24,
    completedTasks: 11,
    dueDate: tomorrow.toISOString().slice(0, 10),
    owner: 'Maya',
    client: 'Northstar Group',
  },
  {
    id: 'project-finance',
    name: 'Q3 Finance Readiness',
    description: 'Budget checkpoints, cash flow reviews, and vendor follow-up before quarter close.',
    status: 'Planning',
    progress: 28,
    totalTasks: 15,
    completedTasks: 4,
    dueDate: nextWeek.toISOString().slice(0, 10),
    owner: 'John',
    client: 'Internal',
  },
];

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Review executive dashboard metrics',
    description: 'Check active project health, follow-up commitments, and blockers before standup.',
    priority: 'Critical',
    status: 'In Progress',
    dueDate: isoToday,
    projectId: 'project-growth',
    assignee: 'John',
    schedule: 'Morning',
    createdAt: isoToday,
  },
  {
    id: 'task-2',
    title: 'Send customer rollout update',
    description: 'Share delivery dates, risks, and next actions with Northstar Group leadership.',
    priority: 'High',
    status: 'Pending',
    dueDate: isoToday,
    projectId: 'project-enterprise',
    assignee: 'Aline',
    schedule: 'Afternoon',
    createdAt: isoToday,
  },
  {
    id: 'task-3',
    title: 'Approve vendor payment batch',
    description: 'Confirm invoice status and release approved payments for finance.',
    priority: 'Medium',
    status: 'Completed',
    dueDate: isoToday,
    projectId: 'project-finance',
    assignee: 'John',
    schedule: 'Morning',
    createdAt: isoToday,
  },
  {
    id: 'task-4',
    title: 'Prepare board follow-up notes',
    description: 'Summarize open asks, owner assignments, and next decision points.',
    priority: 'High',
    status: 'Pending',
    dueDate: yesterday.toISOString().slice(0, 10),
    projectId: 'project-growth',
    assignee: 'John',
    schedule: 'Evening',
    createdAt: yesterday.toISOString().slice(0, 10),
  },
  {
    id: 'task-5',
    title: 'Map Q3 budget scenarios',
    description: 'Draft best, expected, and conservative spend plans for leadership review.',
    priority: 'Low',
    status: 'Pending',
    dueDate: nextWeek.toISOString().slice(0, 10),
    projectId: 'project-finance',
    assignee: 'Daniel',
    schedule: 'Afternoon',
    createdAt: isoToday,
  },
];

export const mockMeetings: Meeting[] = [
  {
    id: 'meeting-1',
    title: 'Leadership daily sync',
    time: '09:00',
    attendees: ['John', 'Maya', 'Daniel'],
    location: 'Boardroom',
  },
  {
    id: 'meeting-2',
    title: 'Northstar rollout check-in',
    time: '14:30',
    attendees: ['Aline', 'Customer Success'],
    location: 'Google Meet',
  },
];

export const mockCustomers: Customer[] = [
  {
    id: 'customer-northstar',
    name: 'Olivia Grant',
    company: 'Northstar Group',
    email: 'olivia.grant@northstar.example',
    phone: '+250 788 100 901',
    status: 'Active',
    health: 'Watch',
    owner: 'Aline',
    value: 128000,
    lastContact: yesterday.toISOString().slice(0, 10),
    nextFollowUp: isoToday,
    notes: 'Strategic rollout account. Needs launch owner confirmation and training schedule.',
  },
  {
    id: 'customer-kivu',
    name: 'Eric Mutesi',
    company: 'Kivu Logistics',
    email: 'eric@kivulogistics.example',
    phone: '+250 788 220 330',
    status: 'Prospect',
    health: 'Healthy',
    owner: 'John',
    value: 54000,
    lastContact: isoToday,
    nextFollowUp: tomorrow.toISOString().slice(0, 10),
    notes: 'Interested in operational dashboard and weekly executive summaries.',
  },
  {
    id: 'customer-akagera',
    name: 'Nadia Ishimwe',
    company: 'Akagera Retail',
    email: 'nadia@akageraretail.example',
    phone: '+250 788 440 510',
    status: 'At Risk',
    health: 'Risk',
    owner: 'Maya',
    value: 76000,
    lastContact: yesterday.toISOString().slice(0, 10),
    nextFollowUp: isoToday,
    notes: 'Renewal depends on executive reporting reliability and faster support turnaround.',
  },
  {
    id: 'customer-mara',
    name: 'Samuel Okoro',
    company: 'Mara Ventures',
    email: 'samuel@mara.example',
    phone: '+254 700 880 102',
    status: 'Lead',
    health: 'Healthy',
    owner: 'Daniel',
    value: 32000,
    lastContact: nextWeek.toISOString().slice(0, 10),
    nextFollowUp: nextWeek.toISOString().slice(0, 10),
    notes: 'Founder-led business exploring a lightweight executive operating system.',
  },
];

export const mockFollowUps: FollowUp[] = [
  {
    id: 'follow-up-1',
    customerId: 'customer-northstar',
    customer: 'Northstar Group',
    note: 'Confirm launch owner and final training date.',
    dueDate: isoToday,
    priority: 'High',
    status: 'Open',
    owner: 'Aline',
    channel: 'Meeting',
    nextStep: 'Send meeting summary and owner checklist.',
  },
  {
    id: 'follow-up-2',
    customerId: 'customer-kivu',
    customer: 'Kivu Logistics',
    note: 'Send revised commercial proposal.',
    dueDate: tomorrow.toISOString().slice(0, 10),
    priority: 'Medium',
    status: 'Scheduled',
    owner: 'John',
    channel: 'Email',
    nextStep: 'Attach pricing options and implementation timeline.',
  },
  {
    id: 'follow-up-3',
    customerId: 'customer-akagera',
    customer: 'Akagera Retail',
    note: 'Escalate renewal risk and confirm support recovery plan.',
    dueDate: isoToday,
    priority: 'Critical',
    status: 'Open',
    owner: 'Maya',
    channel: 'Call',
    nextStep: 'Book executive call before close of business.',
  },
];

export const mockNotes: QuickNote[] = [
  {
    id: 'note-1',
    title: 'Hiring signal',
    body: 'Customer success capacity needs review before onboarding two more enterprise accounts.',
    updatedAt: isoToday,
  },
  {
    id: 'note-2',
    title: 'Founder focus',
    body: 'Keep this week centered on cash visibility, customer health, and unblock decisions.',
    updatedAt: isoToday,
  },
];

export const mockGoals: Goal[] = [
  {
    id: 'goal-1',
    title: 'Close three strategic renewals',
    progress: 64,
    owner: 'John',
    horizon: 'Monthly',
  },
  {
    id: 'goal-2',
    title: 'Reduce overdue executive actions below 5',
    progress: 78,
    owner: 'Operations',
    horizon: 'Weekly',
  },
  {
    id: 'goal-3',
    title: 'Ship management reporting workflow',
    progress: 42,
    owner: 'Product',
    horizon: 'Quarterly',
  },
];

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notification-1',
    title: 'Customer follow-up due',
    description: 'Northstar Group needs confirmation before end of day.',
    time: '10 min ago',
    unread: true,
  },
  {
    id: 'notification-2',
    title: 'Project risk changed',
    description: 'Enterprise Customer Rollout moved to at risk.',
    time: '45 min ago',
    unread: true,
  },
  {
    id: 'notification-3',
    title: 'Task completed',
    description: 'Vendor payment batch was marked completed.',
    time: '2 hours ago',
    unread: false,
  },
];
