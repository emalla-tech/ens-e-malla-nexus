import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const matrix = JSON.parse(readFileSync(new URL('../src/data/permissionMatrix.json', import.meta.url), 'utf8'));
const planCatalogSource = readFileSync(new URL('../src/data/planCatalog.ts', import.meta.url), 'utf8');
const roles = ['Owner', 'Admin', 'Manager', 'Finance', 'Member', 'Viewer'];
const modules = ['Dashboard', 'Tasks', 'Projects', 'Customers', 'Calendar', 'Reminders', 'Notes', 'Goals', 'Finance', 'Reports', 'Notifications', 'Team', 'Settings', 'Billing'];

test('every supported role has complete view and manage lists', () => {
  for (const role of roles) {
    assert.ok(Array.isArray(matrix.view[role]), `${role} view permissions missing`);
    assert.ok(Array.isArray(matrix.manage[role]), `${role} manage permissions missing`);
    for (const module of [...matrix.view[role], ...matrix.manage[role]]) assert.ok(modules.includes(module), `${role} contains unknown module ${module}`);
  }
});

test('manage permission always implies view permission', () => {
  for (const role of roles) for (const module of matrix.manage[role]) assert.ok(matrix.view[role].includes(module), `${role} can manage ${module} without viewing it`);
});

test('viewer is strictly read-only', () => assert.deepEqual(matrix.manage.Viewer, []));
test('finance role cannot access customer or operational records', () => {
  for (const module of ['Tasks', 'Projects', 'Customers', 'Notes', 'Goals']) assert.ok(!matrix.view.Finance.includes(module));
  assert.ok(matrix.manage.Finance.includes('Finance'));
});
test('manager cannot access finance or settings', () => {
  assert.ok(!matrix.view.Manager.includes('Finance'));
  assert.ok(!matrix.view.Manager.includes('Settings'));
});
test('only owner and admin can manage team', () => {
  assert.ok(matrix.manage.Owner.includes('Team'));
  assert.ok(matrix.manage.Admin.includes('Team'));
  for (const role of ['Manager', 'Finance', 'Member', 'Viewer']) assert.ok(!matrix.manage[role].includes('Team'));
});

test('billing is restricted to the workspace owner', () => {
  assert.ok(matrix.view.Owner.includes('Billing'));
  assert.ok(matrix.manage.Owner.includes('Billing'));
  for (const role of ['Admin', 'Manager', 'Finance', 'Member', 'Viewer']) assert.ok(!matrix.view[role].includes('Billing'));
});

test('plan catalog keeps advanced modules out of Personal', () => {
  const personal = planCatalogSource.slice(planCatalogSource.indexOf("code: 'Personal'"), planCatalogSource.indexOf("code: 'Business'"));
  for (const module of ['Projects', 'Customers', 'Finance', 'Reports']) assert.ok(!personal.includes(`'${module}'`));
});

test('plan capacity increases from Personal to Professional', () => {
  const limits = [...planCatalogSource.matchAll(/maxMembers: (\d+), maxCustomers: (\d+), maxProjects: (\d+)/g)].map((match) => match.slice(1).map(Number));
  assert.equal(limits.length, 3);
  for (let index = 1; index < limits.length; index += 1) for (let field = 0; field < 3; field += 1) assert.ok(limits[index][field] > limits[index - 1][field]);
});

test('platform admin is not a workspace role', () => {
  assert.ok(!roles.includes('Platform Admin'));
  assert.ok(!Object.hasOwn(matrix.view, 'Platform Admin'));
});
