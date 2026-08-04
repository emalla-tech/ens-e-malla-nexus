import { Flag } from 'lucide-react';
import { ProgressBar } from '../components/ProgressBar';
import { mockGoals } from '../data/mockData';

export function GoalsPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">Goals</p>
        <h1 className="mt-2 text-3xl font-black text-brand-black">Leadership goals</h1>
        <p className="mt-2 max-w-2xl text-gray-500">
          Keep weekly, monthly, and quarterly targets visible next to daily execution.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {mockGoals.map((goal) => (
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
          </article>
        ))}
      </section>
    </div>
  );
}
