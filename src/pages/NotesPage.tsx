import { NotebookText, Pin } from 'lucide-react';
import { mockNotes } from '../data/mockData';
import { formatShortDate } from '../utils/date';

export function NotesPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">Notes</p>
        <h1 className="mt-2 text-3xl font-black text-brand-black">Quick notes</h1>
        <p className="mt-2 max-w-2xl text-gray-500">
          Capture short executive thoughts, meeting outcomes, customer context, and decisions.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {mockNotes.map((note) => (
          <article key={note.id} className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <NotebookText className="text-brand-orange" size={22} />
              <Pin className="text-gray-300" size={18} />
            </div>
            <h2 className="mt-5 text-xl font-black text-brand-black">{note.title}</h2>
            <p className="mt-3 leading-7 text-gray-500">{note.body}</p>
            <p className="mt-5 text-sm font-semibold text-gray-400">Updated {formatShortDate(note.updatedAt)}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
