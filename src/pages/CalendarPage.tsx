import { CalendarDays, Clock3, MapPin } from 'lucide-react';
import { mockMeetings, mockTasks } from '../data/mockData';
import { formatLongDate } from '../utils/date';

export function CalendarPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">Calendar</p>
        <h1 className="mt-2 text-3xl font-black text-brand-black">Daily calendar</h1>
        <p className="mt-2 text-gray-500">{formatLongDate()}</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
          <CalendarDays className="text-brand-orange" size={24} />
          <h2 className="mt-4 text-lg font-black text-brand-black">Scheduled work blocks</h2>
          <div className="mt-5 space-y-3">
            {['Morning', 'Afternoon', 'Evening'].map((slot) => (
              <div key={slot} className="rounded-md bg-gray-50 p-4">
                <p className="font-bold text-brand-black">{slot}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {mockTasks.filter((task) => task.schedule === slot).length} planned tasks
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-brand-black">Meetings</h2>
          <div className="mt-5 space-y-3">
            {mockMeetings.map((meeting) => (
              <article key={meeting.id} className="rounded-md border border-gray-200 p-4">
                <h3 className="font-black text-brand-black">{meeting.title}</h3>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-2">
                    <Clock3 size={16} />
                    {meeting.time}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MapPin size={16} />
                    {meeting.location}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
