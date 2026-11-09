import type { WorkspaceRole } from '../types';
import matrix from '../data/permissionMatrix.json';

export type WorkspaceModule = 'Dashboard' | 'Tasks' | 'Projects' | 'Customers' | 'Calendar' | 'Reminders' | 'Notes' | 'Goals' | 'Finance' | 'Reports' | 'Notifications' | 'Team' | 'Settings';
const viewMatrix = matrix.view as Record<WorkspaceRole, WorkspaceModule[]>;
const manageMatrix = matrix.manage as Record<WorkspaceRole, WorkspaceModule[]>;
export function canViewModule(role: WorkspaceRole | undefined, module: WorkspaceModule) { return role ? viewMatrix[role].includes(module) : false; }
export function canManageModule(role: WorkspaceRole | undefined, module: WorkspaceModule) { return role ? manageMatrix[role].includes(module) : false; }
export const pathModule: Record<string, WorkspaceModule> = { tasks: 'Tasks', projects: 'Projects', customers: 'Customers', calendar: 'Calendar', reminders: 'Reminders', notes: 'Notes', goals: 'Goals', finance: 'Finance', reports: 'Reports', notifications: 'Notifications', team: 'Team', settings: 'Settings' };
