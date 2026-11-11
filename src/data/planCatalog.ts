import type { PlanDefinition } from '../types';

export const planCatalog: PlanDefinition[] = [
  { code: 'Personal', name: 'Personal', description: 'For one person managing daily execution.', modules: ['Tasks', 'Calendar', 'Reminders', 'Notes', 'Goals'], maxMembers: 1, maxCustomers: 50, maxProjects: 10, storageMb: 100 },
  { code: 'Business', name: 'Business', description: 'For operating teams managing customers and finance.', modules: ['Tasks', 'Projects', 'Customers', 'Calendar', 'Reminders', 'Notes', 'Goals', 'Finance', 'Reports'], maxMembers: 10, maxCustomers: 1000, maxProjects: 100, storageMb: 5120 },
  { code: 'Professional', name: 'Professional', description: 'For growing companies needing scale, governance, and advanced controls.', modules: ['Tasks', 'Projects', 'Customers', 'Calendar', 'Reminders', 'Notes', 'Goals', 'Finance', 'Reports'], maxMembers: 50, maxCustomers: 10000, maxProjects: 1000, storageMb: 51200 },
];

export function getPlan(code: string | undefined) { return planCatalog.find((plan) => plan.code === code) ?? planCatalog[0]; }
export function planIncludesModule(code: string | undefined, module: string) { return getPlan(code).modules.includes(module); }
