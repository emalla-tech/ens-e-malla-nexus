import { Cloud, Edit3, Flag, Plus, RefreshCw, Trash2, TriangleAlert } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { StatCard } from '../components/StatCard';
import { useGoals } from '../hooks/useGoals';
import type { Goal } from '../types';

type GoalDraft = Omit<Goal, 'id'>;

const horizons: Goal['horizon'][] = ['Weekly', 'Monthly', 'Quarterly'];

const emptyDraft: GoalDraft = {
  title: '',
  progress: 0,
  owner: 'John',
  horizon: 'Monthly',
};

export function GoalsPage() {
  const { goals, createGoal, updateGoal, deleteGoal, syncError, syncing, syncFromCloud } = useGoals();
  const [draft, setDraft] = useState<GoalDraft>(emptyDraft);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const summary = useMemo(() => {
    const averageProgress = goals.length > 0
      ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length)
      : 0;

    return {
      total: goals.length,
      complete: goals.filter((goal) => goal.progress >= 100).length,
      atRisk: goals.filter((goal) => goal.progress < 35).length,
      averageProgress,
    };
  }, [goals]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.title.trim()) {
      return;
    }

    const cleanDraft: GoalDraft = {
      ...draft,
      title: draft.title.trim(),
      owner: draft.owner.trim() || 'John',
      progress: Math.min(100, Math.max(0, Number(draft.progress) || 0)),
    };

    if (editingGoal) {
      updateGoal(editingGoal.id, cleanDraft);
      setEditingGoal(null);
    } else {
      createGoal(cleanDraft);
    }

    setDraft(emptyDraft);
  }

  function startEdit(goal: Goal) {
    setEditingGoal(goal);
    setDraft({
      title: goal.title,
      progress: goal.progress,
      owner: goal.owner,
      horizon: goal.horizon,
    });
  }

  function cancelEdit() {
    setEditingGoal(null);
    setDraft(emptyDraft);
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">Goals</p>
          <h1 className="mt-2 text-3xl font-black text-brand-black">Leadership goals</h1>
          <p className="mt-2 max-w-2xl text-gray-500">
            Keep weekly, monthly, and quarterly targets visible next to daily execution.
          </p>
        </div>
        <div className="rounded-md bg-brand-black px-4 py-3 text-white shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-orange">Average progress</p>
          <p className="mt-1 text-2xl font-black">{summary.averageProgress}%</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Goals" value={summary.total} icon={Flag} caption="Active targets" />
        <StatCard label="Complete" value={summary.complete} icon={RefreshCw} caption="Reached 100%" />
        <StatCard label="Needs push" value={summary.atRisk} icon={TriangleAlert} caption="Under 35%" />
      </section>

      <section
        className={`flex flex-col justify-between gap-3 rounded-md border p-4 shadow-sm sm:flex-row sm:items-center ${
          syncError ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex gap-3">
          <div
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${
              syncError ? 'bg-red-100 text-red-700' : 'bg-orange-50 text-brand-orange'
            }`}
          >
            {syncError ? <TriangleAlert size={19} /> : <Cloud size={19} />}
          </div>
          <div>
            <p className="font-bold text-brand-black">{syncError ? 'Goals sync needs attention' : 'Goals cloud sync'}</p>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {syncError || (syncing ? 'Syncing goals with Supabase...' : 'Signed-in devices can share goals through Supabase.')}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-brand-black ring-1 ring-gray-200 hover:bg-gray-50"
          onClick={() => syncFromCloud()}
        >
          <RefreshCw size={16} />
          Sync now
        </button>
      </section>

      <form onSubmit={handleSubmit} className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-black text-brand-black">{editingGoal ? 'Edit goal' : 'Create goal'}</h2>
            <p className="mt-1 text-sm text-gray-500">Define the outcome, owner, horizon, and current progress.</p>
          </div>
          {editingGoal ? (
            <Button type="button" variant="ghost" onClick={cancelEdit}>
              Cancel edit
            </Button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-semibold text-gray-700">Goal title</span>
            <input
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
              placeholder="Enter leadership goal"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">Owner</span>
            <input
              value={draft.owner}
              onChange={(event) => setDraft({ ...draft, owner: event.target.value })}
              className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">Horizon</span>
            <select
              value={draft.horizon}
              onChange={(event) => setDraft({ ...draft, horizon: event.target.value as Goal['horizon'] })}
              className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
            >
              {horizons.map((horizon) => (
                <option key={horizon}>{horizon}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 lg:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-gray-700">Progress</span>
              <span className="text-sm font-black text-brand-black">{draft.progress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={draft.progress}
              onChange={(event) => setDraft({ ...draft, progress: Number(event.target.value) })}
              className="w-full accent-brand-orange"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <Button type="submit">
            <Plus size={16} />
            {editingGoal ? 'Save goal' : 'Create goal'}
          </Button>
        </div>
      </form>

      {goals.length > 0 ? (
        <section className="grid gap-5 lg:grid-cols-3">
          {goals.map((goal) => (
            <article key={goal.id} className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <Flag className="text-brand-orange" size={22} />
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">{goal.horizon}</span>
              </div>
              <h2 className="mt-5 text-xl font-black text-brand-black">{goal.title}</h2>
              <p className="mt-2 text-sm text-gray-500">Owner: {goal.owner}</p>
              <div className="mt-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-semibold text-gray-700">Progress</span>
                  <span className="font-black text-brand-black">{goal.progress}%</span>
                </div>
                <ProgressBar value={goal.progress} />
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button type="button" variant="secondary" className="h-9 w-9 px-0" onClick={() => startEdit(goal)} aria-label={`Edit ${goal.title}`}>
                  <Edit3 size={16} />
                </Button>
                <Button type="button" variant="danger" className="h-9 w-9 px-0" onClick={() => deleteGoal(goal.id)} aria-label={`Delete ${goal.title}`}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-lg font-black text-brand-black">No live goals yet</p>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Create your first leadership goal to start tracking strategic progress.
          </p>
        </section>
      )}
    </div>
  );
}
