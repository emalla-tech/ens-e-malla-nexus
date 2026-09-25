export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

export type DaySchedule = 'Morning' | 'Afternoon' | 'Evening';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  projectId: string;
  assignee: string;
  schedule: DaySchedule;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'Planning' | 'Active' | 'At Risk' | 'Completed';
  progress: number;
  totalTasks: number;
  completedTasks: number;
  dueDate: string;
  owner: string;
  client: string;
}

export type CustomerStatus = 'Lead' | 'Prospect' | 'Active' | 'At Risk' | 'Dormant';

export type CustomerHealth = 'Healthy' | 'Watch' | 'Risk';

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  health: CustomerHealth;
  owner: string;
  value: number;
  lastContact: string;
  nextFollowUp: string;
  notes: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  attendees: string[];
  location: string;
}

export interface FollowUp {
  id: string;
  customerId: string;
  customer: string;
  note: string;
  dueDate: string;
  priority: Priority;
  status: 'Open' | 'Scheduled' | 'Completed' | 'Waiting';
  owner: string;
  channel: 'Email' | 'Call' | 'Meeting' | 'WhatsApp';
  nextStep: string;
}

export interface QuickNote {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
  folder: string;
  tags: string[];
  pinned: boolean;
  linkedType: 'None' | 'Project' | 'Customer';
  linkedId: string;
}

export interface Goal {
  id: string;
  title: string;
  progress: number;
  owner: string;
  horizon: 'Weekly' | 'Monthly' | 'Quarterly';
}

export type ReminderCategory = 'Personal' | 'Business' | 'Customer' | 'Payment' | 'Call';
export type ReminderRepeat = 'Once' | 'Daily' | 'Weekly' | 'Monthly';

export interface Reminder {
  id: string;
  title: string;
  notes: string;
  category: ReminderCategory;
  priority: Priority;
  date: string;
  time: string;
  repeat: ReminderRepeat;
  status: 'Active' | 'Completed';
  createdAt: string;
}

export interface FinanceTransaction {
  id: string;
  type: 'Income' | 'Expense';
  description: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: 'Cash' | 'Bank' | 'Mobile Money' | 'Card' | 'Other';
  reference: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  description: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
}
