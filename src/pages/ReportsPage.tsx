import { ArrowDownRight, ArrowUpRight, BriefcaseBusiness, CheckCircle2, CircleDollarSign, Download, RefreshCw, TriangleAlert, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { useCustomers } from '../hooks/useCustomers';
import { useFinance } from '../hooks/useFinance';
import { useFollowUps } from '../hooks/useFollowUps';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { getLocalDateKey } from '../utils/date';
import { getLiveTasks, withProjectTaskStats } from '../utils/projects';

type Period = 30 | 90 | 365;
const money = new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 });
const percent = (value: number, total: number) => total ? Math.round(value / total * 100) : 0;

export function ReportsPage() {
  const { tasks, syncing: tasksSyncing, syncFromCloud: syncTasks } = useTasks();
  const { projects, syncing: projectsSyncing, syncFromCloud: syncProjects } = useProjects();
  const { customers, syncing: customersSyncing, syncFromCloud: syncCustomers } = useCustomers();
  const { followUps, syncing: followUpsSyncing, syncFromCloud: syncFollowUps } = useFollowUps();
  const finance = useFinance(); const [period, setPeriod] = useState<Period>(90);
  const today = new Date(); const start = new Date(today); start.setDate(start.getDate() - period + 1);
  const startKey = getLocalDateKey(start); const todayKey = getLocalDateKey(today);
  const liveTasks = getLiveTasks(tasks);
  const periodTasks = liveTasks.filter((item) => item.createdAt.slice(0, 10) >= startKey);
  const periodTransactions = finance.transactions.filter((item) => item.date >= startKey && item.date <= todayKey);
  const completed = periodTasks.filter((item) => item.status === 'Completed').length;
  const overdue = liveTasks.filter((item) => item.dueDate < todayKey && !['Completed', 'Cancelled'].includes(item.status)).length;
  const income = periodTransactions.filter((item) => item.type === 'Income').reduce((sum, item) => sum + item.amount, 0);
  const expenses = periodTransactions.filter((item) => item.type === 'Expense').reduce((sum, item) => sum + item.amount, 0);
  const outstanding = finance.invoices.filter((item) => ['Sent', 'Overdue'].includes(item.status)).reduce((sum, item) => sum + item.amount, 0);
  const completedFollowUps = followUps.filter((item) => item.status === 'Completed').length;
  const projectStats = withProjectTaskStats(projects, liveTasks).sort((a, b) => b.progress - a.progress);
  const syncing = tasksSyncing || projectsSyncing || customersSyncing || followUpsSyncing || finance.syncing;
  const monthly = useMemo(() => buildMonthlyTrend(finance.transactions, period), [finance.transactions, period]);
  const maxMonthly = Math.max(1, ...monthly.flatMap((item) => [item.income, item.expense]));
  const customerStages = ['Lead', 'Prospect', 'Active', 'At Risk', 'Dormant'].map((status) => ({ status, count: customers.filter((item) => item.status === status).length }));

  function refresh() { syncTasks(); syncProjects(); syncCustomers(); syncFollowUps(); finance.syncFromCloud(); }

  return <div className="space-y-6 print:bg-white">
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">Reports</p><h1 className="mt-2 text-3xl font-black">Executive analytics</h1><p className="mt-2 max-w-2xl text-gray-500">A live view of execution, customers, projects, and financial performance.</p></div><div className="flex flex-wrap gap-2 print:hidden"><Button variant="secondary" onClick={refresh}><RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />Refresh</Button><Button onClick={() => window.print()}><Download size={16} />Export PDF</Button></div></section>

    <section className="flex overflow-x-auto rounded-md bg-gray-100 p-1 print:hidden">{([30, 90, 365] as Period[]).map((days) => <button key={days} onClick={() => setPeriod(days)} className={`min-h-9 shrink-0 rounded-md px-4 text-sm font-bold ${period === days ? 'bg-white shadow-sm' : 'text-gray-500'}`}>{days === 365 ? '12 months' : `Last ${days} days`}</button>)}</section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi icon={CheckCircle2} label="Task completion" value={`${percent(completed, periodTasks.length)}%`} detail={`${completed} of ${periodTasks.length} tasks`} tone="green" /><Kpi icon={TriangleAlert} label="Overdue tasks" value={String(overdue)} detail="Open executive actions" tone="red" /><Kpi icon={CircleDollarSign} label="Net cash flow" value={money.format(income - expenses)} detail={`${money.format(income)} received`} tone={income - expenses >= 0 ? 'green' : 'red'} /><Kpi icon={Users} label="Follow-up completion" value={`${percent(completedFollowUps, followUps.length)}%`} detail={`${completedFollowUps} completed`} tone="orange" /></section>

    <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
      <article className="rounded-md border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><h2 className="text-lg font-black">Cash-flow trend</h2><p className="mt-1 text-sm text-gray-500">Income and expenses by month</p></div><span className={`rounded-md px-2 py-1 text-xs font-bold ${income >= expenses ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{income >= expenses ? 'Positive' : 'Negative'} cash flow</span></div><div className="mt-6 flex h-56 items-end gap-3 border-b border-gray-200 px-2">{monthly.map((item) => <div key={item.key} className="flex min-w-0 flex-1 flex-col items-center"><div className="flex h-44 w-full items-end justify-center gap-1"><div title={`Income ${money.format(item.income)}`} style={{ height: `${Math.max(item.income ? 4 : 0, item.income / maxMonthly * 100)}%` }} className="w-2/5 rounded-t bg-emerald-500" /><div title={`Expenses ${money.format(item.expense)}`} style={{ height: `${Math.max(item.expense ? 4 : 0, item.expense / maxMonthly * 100)}%` }} className="w-2/5 rounded-t bg-red-400" /></div><p className="mt-2 truncate text-xs font-semibold text-gray-500">{item.label}</p></div>)}</div><div className="mt-4 flex gap-5 text-xs font-semibold text-gray-500"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Income</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-red-400" />Expenses</span></div></article>
      <article className="rounded-md border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-black">Financial exposure</h2><div className="mt-5 space-y-5"><ReportLine label="Income" value={money.format(income)} icon={ArrowUpRight} tone="text-emerald-700" /><ReportLine label="Expenses" value={money.format(expenses)} icon={ArrowDownRight} tone="text-red-700" /><ReportLine label="Outstanding invoices" value={money.format(outstanding)} icon={CircleDollarSign} tone="text-orange-700" /></div></article>
    </section>

    <section className="grid gap-6 lg:grid-cols-2"><article className="rounded-md border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><BriefcaseBusiness size={20} className="text-brand-orange" /><h2 className="text-lg font-black">Project health</h2></div><div className="mt-5 space-y-5">{projectStats.length ? projectStats.slice(0, 6).map((project) => <div key={project.id}><div className="mb-2 flex justify-between gap-4"><div><p className="font-bold">{project.name}</p><p className="text-xs text-gray-500">{project.completedTasks}/{project.totalTasks} tasks · {project.status}</p></div><span className="font-black">{project.progress}%</span></div><ProgressBar value={project.progress} /></div>) : <Empty text="No project activity yet" />}</div></article>
      <article className="rounded-md border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Users size={20} className="text-brand-orange" /><h2 className="text-lg font-black">Customer pipeline</h2></div><div className="mt-5 space-y-4">{customerStages.map((stage) => <div key={stage.status}><div className="mb-2 flex justify-between text-sm"><span className="font-semibold text-gray-600">{stage.status}</span><span className="font-black">{stage.count}</span></div><div className="h-2 overflow-hidden rounded bg-gray-100"><div className="h-full bg-brand-orange" style={{ width: `${percent(stage.count, customers.length)}%` }} /></div></div>)}</div><p className="mt-5 rounded-md bg-gray-50 p-3 text-sm text-gray-500">{customers.length} customers tracked · {customers.filter((item) => item.health === 'Risk').length} currently at risk</p></article></section>

    <section className="rounded-md bg-brand-black p-5 text-white"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-orange">Executive summary</p><p className="mt-3 leading-7 text-gray-200">During this reporting period, ENs recorded <strong className="text-white">{completed} completed tasks</strong>, net cash flow of <strong className="text-white">{money.format(income - expenses)}</strong>, and <strong className="text-white">{completedFollowUps} completed customer follow-ups</strong>. Current exposure includes {overdue} overdue tasks and {money.format(outstanding)} in outstanding invoices.</p></section>
  </div>;
}

function buildMonthlyTrend(transactions: { date: string; type: string; amount: number }[], period: Period) { const count = period === 365 ? 12 : period === 90 ? 3 : 1; return Array.from({ length: count }, (_, index) => { const date = new Date(); date.setDate(1); date.setMonth(date.getMonth() - (count - index - 1)); const key = getLocalDateKey(date).slice(0, 7); const records = transactions.filter((item) => item.date.startsWith(key)); return { key, label: date.toLocaleDateString('en', { month: 'short' }), income: records.filter((item) => item.type === 'Income').reduce((sum, item) => sum + item.amount, 0), expense: records.filter((item) => item.type === 'Expense').reduce((sum, item) => sum + item.amount, 0) }; }); }
function Kpi({ icon: Icon, label, value, detail, tone }: { icon: typeof Users; label: string; value: string; detail: string; tone: string }) { const color = tone === 'green' ? 'bg-emerald-50 text-emerald-700' : tone === 'red' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'; return <article className="rounded-md border border-gray-200 bg-white p-5 shadow-sm"><div className={`grid h-10 w-10 place-items-center rounded-md ${color}`}><Icon size={19} /></div><p className="mt-4 text-sm font-semibold text-gray-500">{label}</p><p className="mt-1 text-2xl font-black">{value}</p><p className="mt-1 text-xs text-gray-400">{detail}</p></article>; }
function ReportLine({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Users; tone: string }) { return <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><Icon size={19} className={tone} /><span className="text-sm font-semibold text-gray-600">{label}</span></div><strong>{value}</strong></div>; }
function Empty({ text }: { text: string }) { return <p className="rounded-md bg-gray-50 p-4 text-sm text-gray-500">{text}</p>; }
