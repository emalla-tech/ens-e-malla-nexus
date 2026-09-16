import { Cloud, Edit3, NotebookText, Pin, Plus, RefreshCw, Search, Trash2, TriangleAlert } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '../components/Button';
import { useNotes } from '../hooks/useNotes';
import type { QuickNote } from '../types';
import { formatShortDate } from '../utils/date';

type NoteDraft = Omit<QuickNote, 'id' | 'updatedAt'>;

const emptyDraft: NoteDraft = {
  title: '',
  body: '',
};

export function NotesPage() {
  const { notes, createNote, updateNote, deleteNote, syncError, syncing, syncFromCloud } = useNotes();
  const [draft, setDraft] = useState<NoteDraft>(emptyDraft);
  const [editingNote, setEditingNote] = useState<QuickNote | null>(null);
  const [query, setQuery] = useState('');

  const filteredNotes = useMemo(() => {
    return notes.filter((note) =>
      `${note.title} ${note.body}`.toLowerCase().includes(query.toLowerCase()),
    );
  }, [notes, query]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.title.trim() || !draft.body.trim()) {
      return;
    }

    const nextDraft = {
      title: draft.title.trim(),
      body: draft.body.trim(),
    };

    if (editingNote) {
      updateNote(editingNote.id, nextDraft);
      setEditingNote(null);
    } else {
      createNote(nextDraft);
    }

    setDraft(emptyDraft);
  }

  function startEdit(note: QuickNote) {
    setEditingNote(note);
    setDraft({
      title: note.title,
      body: note.body,
    });
  }

  function cancelEdit() {
    setEditingNote(null);
    setDraft(emptyDraft);
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">Notes</p>
          <h1 className="mt-2 text-3xl font-black text-brand-black">Quick notes</h1>
          <p className="mt-2 max-w-2xl text-gray-500">
            Capture executive thoughts, meeting outcomes, customer context, and decisions.
          </p>
        </div>
        <div className="rounded-md bg-brand-black px-4 py-3 text-white shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-orange">Live notes</p>
          <p className="mt-1 text-2xl font-black">{notes.length}</p>
        </div>
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
            <p className="font-bold text-brand-black">{syncError ? 'Notes sync needs attention' : 'Notes cloud sync'}</p>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {syncError || (syncing ? 'Syncing notes with Supabase...' : 'Signed-in devices can share notes through Supabase.')}
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
            <h2 className="text-lg font-black text-brand-black">{editingNote ? 'Edit note' : 'Create note'}</h2>
            <p className="mt-1 text-sm text-gray-500">Write a short note and keep it available on phone and desktop.</p>
          </div>
          {editingNote ? (
            <Button type="button" variant="ghost" onClick={cancelEdit}>
              Cancel edit
            </Button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">Title</span>
            <input
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
              placeholder="Note title"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">Note</span>
            <textarea
              value={draft.body}
              onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              className="min-h-32 w-full rounded-md border border-gray-200 px-3 py-2 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
              placeholder="Capture the context, decision, or reminder"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <Button type="submit">
            <Plus size={16} />
            {editingNote ? 'Save note' : 'Create note'}
          </Button>
        </div>
      </form>

      <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <label className="flex min-h-11 items-center gap-2 rounded-md border border-gray-200 px-3">
          <Search size={18} className="text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full border-0 bg-transparent text-sm outline-none"
            placeholder="Search notes"
          />
        </label>
      </section>

      {filteredNotes.length > 0 ? (
        <section className="grid gap-5 md:grid-cols-2">
          {filteredNotes.map((note) => (
            <article key={note.id} className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <NotebookText className="text-brand-orange" size={22} />
                <Pin className="text-gray-300" size={18} />
              </div>
              <h2 className="mt-5 text-xl font-black text-brand-black">{note.title}</h2>
              <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-500">{note.body}</p>
              <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-sm font-semibold text-gray-400">Updated {formatShortDate(note.updatedAt)}</p>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" className="h-9 w-9 px-0" onClick={() => startEdit(note)} aria-label={`Edit ${note.title}`}>
                    <Edit3 size={16} />
                  </Button>
                  <Button type="button" variant="danger" className="h-9 w-9 px-0" onClick={() => deleteNote(note.id)} aria-label={`Delete ${note.title}`}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-lg font-black text-brand-black">No live notes yet</p>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Create your first note and it will appear on the dashboard.
          </p>
        </section>
      )}
    </div>
  );
}
