import { Bell, CheckCircle2 } from 'lucide-react';
import { mockNotifications } from '../data/mockData';

export function NotificationsPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">Notifications</p>
        <h1 className="mt-2 text-3xl font-black text-brand-black">Executive alerts</h1>
        <p className="mt-2 max-w-2xl text-gray-500">
          Review follow-up alerts, project risks, completed actions, and priority changes.
        </p>
      </section>

      <section className="rounded-md border border-gray-200 bg-white shadow-sm">
        {mockNotifications.map((item) => (
          <article key={item.id} className="flex gap-4 border-b border-gray-100 p-5 last:border-b-0">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-md ${item.unread ? 'bg-orange-50 text-brand-orange' : 'bg-emerald-50 text-emerald-700'}`}>
              {item.unread ? <Bell size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-black text-brand-black">{item.title}</h2>
                {item.unread ? <span className="h-2 w-2 rounded-full bg-brand-orange" /> : null}
              </div>
              <p className="mt-1 text-sm leading-6 text-gray-500">{item.description}</p>
              <p className="mt-2 text-xs font-semibold text-gray-400">{item.time}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
