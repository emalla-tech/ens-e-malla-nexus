import type { WorkspaceRole } from '../types';

export type WorkspaceModule = 'Dashboard' | 'Tasks' | 'Projects' | 'Customers' | 'Calendar' | 'Reminders' | 'Notes' | 'Goals' | 'Finance' | 'Reports' | 'Notifications' | 'Team' | 'Settings';
const viewMatrix: Record<WorkspaceRole, WorkspaceModule[]> = {
  Owner: ['Dashboard','Tasks','Projects','Customers','Calendar','Reminders','Notes','Goals','Finance','Reports','Notifications','Team','Settings'],
  Admin: ['Dashboard','Tasks','Projects','Customers','Calendar','Reminders','Notes','Goals','Finance','Reports','Notifications','Team','Settings'],
  Manager: ['Dashboard','Tasks','Projects','Customers','Calendar','Reminders','Notes','Goals','Reports','Notifications','Team'],
  Finance: ['Dashboard','Finance','Reports','Notifications','Team'],
  Member: ['Dashboard','Tasks','Projects','Customers','Calendar','Reminders','Notes','Goals','Notifications','Team'],
  Viewer: ['Dashboard','Tasks','Projects','Customers','Calendar','Reminders','Notes','Goals','Reports','Notifications','Team'],
};
const manageMatrix: Record<WorkspaceRole, WorkspaceModule[]> = {
  Owner: viewMatrix.Owner,
  Admin: viewMatrix.Admin.filter((module) => module !== 'Settings'),
  Manager: ['Tasks','Projects','Customers','Calendar','Reminders','Notes','Goals'],
  Finance: ['Finance'],
  Member: ['Tasks','Projects','Customers','Calendar','Reminders','Notes','Goals'],
  Viewer: [],
};
export function canViewModule(role: WorkspaceRole | undefined, module: WorkspaceModule) { return role ? viewMatrix[role].includes(module) : false; }
export function canManageModule(role: WorkspaceRole | undefined, module: WorkspaceModule) { return role ? manageMatrix[role].includes(module) : false; }
export const pathModule: Record<string, WorkspaceModule> = { tasks: 'Tasks', projects: 'Projects', customers: 'Customers', calendar: 'Calendar', reminders: 'Reminders', notes: 'Notes', goals: 'Goals', finance: 'Finance', reports: 'Reports', notifications: 'Notifications', team: 'Team', settings: 'Settings' };
