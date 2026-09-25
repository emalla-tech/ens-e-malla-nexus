import { Cloud, Edit3, Folder, Link2, NotebookText, Pin, Plus, RefreshCw, Search, Tag, Trash2, TriangleAlert } from 'lucide-react';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '../components/Button';
import { useCustomers } from '../hooks/useCustomers';
import { useNotes } from '../hooks/useNotes';
import { useProjects } from '../hooks/useProjects';
import type { QuickNote } from '../types';
import { formatShortDate } from '../utils/date';

type Draft = Omit<QuickNote, 'id' | 'updatedAt'>;
const emptyDraft: Draft = { title: '', body: '', folder: 'General', tags: [], pinned: false, linkedType: 'None', linkedId: '' };

export function NotesPage() {
  const { notes, createNote, updateNote, deleteNote, syncError, syncing, syncFromCloud } = useNotes();
  const { projects } = useProjects();
  const { customers } = useCustomers();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [tagInput, setTagInput] = useState('');
  const [editing, setEditing] = useState<QuickNote | null>(null);
  const [query, setQuery] = useState('');
  const [folderFilter, setFolderFilter] = useState('All');
  const folders = useMemo(() => ['All', ...Array.from(new Set(['General', ...notes.map((note) => note.folder)])).sort()], [notes]);
  const visible = notes.filter((note) => `${note.title} ${note.body} ${note.folder} ${note.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()) && (folderFilter === 'All' || note.folder === folderFilter));
  const options = draft.linkedType === 'Project' ? projects : draft.linkedType === 'Customer' ? customers : [];

  function submit(event: FormEvent) {
    event.preventDefault();
    const next = { ...draft, title: draft.title.trim(), body: draft.body.trim(), folder: draft.folder.trim() || 'General', tags: tagInput.split(',').map((tag) => tag.trim()).filter(Boolean).filter((tag, index, tags) => tags.indexOf(tag) === index), linkedId: draft.linkedType === 'None' ? '' : draft.linkedId };
    if (!next.title || !next.body) return;
    if (editing) updateNote(editing.id, next); else createNote(next);
    cancel();
  }
  function edit(note: QuickNote) { setEditing(note); setDraft({ title: note.title, body: note.body, folder: note.folder, tags: note.tags, pinned: note.pinned, linkedType: note.linkedType, linkedId: note.linkedId }); setTagInput(note.tags.join(', ')); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function cancel() { setEditing(null); setDraft(emptyDraft); setTagInput(''); }
  function linkedName(note: QuickNote) { return note.linkedType === 'Project' ? projects.find((item) => item.id === note.linkedId)?.name : note.linkedType === 'Customer' ? customers.find((item) => item.id === note.linkedId)?.name : ''; }
  function togglePin(note: QuickNote) { updateNote(note.id, { title: note.title, body: note.body, folder: note.folder, tags: note.tags, pinned: !note.pinned, linkedType: note.linkedType, linkedId: note.linkedId }); }

  return <div className="space-y-6">
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">Notes</p><h1 className="mt-2 text-3xl font-black text-brand-black">Executive knowledge</h1><p className="mt-2 max-w-2xl text-gray-500">Organize decisions and ideas, then connect them to the work and people they belong to.</p></div><div className="rounded-md bg-brand-black px-4 py-3 text-white"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-orange">Pinned notes</p><p className="mt-1 text-2xl font-black">{notes.filter((note) => note.pinned).length}</p></div></section>

    <section className={`flex flex-col justify-between gap-3 rounded-md border p-4 shadow-sm sm:flex-row sm:items-center ${syncError ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}><div className="flex gap-3"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${syncError ? 'bg-red-100 text-red-700' : 'bg-orange-50 text-brand-orange'}`}>{syncError ? <TriangleAlert size={19} /> : <Cloud size={19} />}</div><div><p className="font-bold text-brand-black">{syncError ? 'Notes sync needs attention' : 'Notes cloud sync'}</p><p className="mt-1 text-sm text-gray-500">{syncError || (syncing ? 'Syncing notes...' : 'Folders, tags, pins, and links sync across your devices.')}</p></div></div><button type="button" onClick={() => syncFromCloud()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold ring-1 ring-gray-200"><RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />Sync now</button></section>

    <form onSubmit={submit} className="rounded-md border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-black">{editing ? 'Edit note' : 'Create note'}</h2><p className="mt-1 text-sm text-gray-500">Capture it once and keep the context attached.</p></div>{editing ? <Button type="button" variant="ghost" onClick={cancel}>Cancel edit</Button> : null}</div><div className="mt-5 grid gap-4 lg:grid-cols-2">
      <Field label="Title" wide><input required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange" placeholder="Decision or idea title" /></Field>
      <Field label="Note" wide><textarea required value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} className="min-h-32 w-full rounded-md border border-gray-200 px-3 py-2 outline-none focus:border-brand-orange" placeholder="Capture the context or decision" /></Field>
      <Field label="Folder"><input list="note-folders" value={draft.folder} onChange={(event) => setDraft({ ...draft, folder: event.target.value })} className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange" /><datalist id="note-folders">{folders.filter((item) => item !== 'All').map((item) => <option key={item}>{item}</option>)}</datalist></Field>
      <Field label="Tags"><input value={tagInput} onChange={(event) => setTagInput(event.target.value)} className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange" placeholder="strategy, urgent, sales" /></Field>
      <Field label="Link to"><select value={draft.linkedType} onChange={(event) => setDraft({ ...draft, linkedType: event.target.value as Draft['linkedType'], linkedId: '' })} className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3"><option>None</option><option>Project</option><option>Customer</option></select></Field>
      <Field label={draft.linkedType === 'None' ? 'Linked record' : `Select ${draft.linkedType.toLowerCase()}`}><select disabled={draft.linkedType === 'None'} value={draft.linkedId} onChange={(event) => setDraft({ ...draft, linkedId: event.target.value })} className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3 disabled:bg-gray-50"><option value="">No selection</option>{options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    </div><div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={draft.pinned} onChange={(event) => setDraft({ ...draft, pinned: event.target.checked })} className="h-4 w-4 accent-brand-orange" /><Pin size={17} />Pin this note</label><Button type="submit"><Plus size={16} />{editing ? 'Save note' : 'Create note'}</Button></div></form>

    <section className="flex flex-col gap-3 lg:flex-row"><label className="flex min-h-11 flex-1 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 shadow-sm"><Search size={18} className="text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Search title, content, folder, or tag" /></label><select value={folderFilter} onChange={(event) => setFolderFilter(event.target.value)} className="min-h-11 rounded-md border border-gray-200 bg-white px-3 font-semibold shadow-sm lg:w-56">{folders.map((folder) => <option key={folder}>{folder === 'All' ? 'All folders' : folder}</option>)}</select></section>

    {visible.length ? <section className="grid gap-5 md:grid-cols-2">{visible.map((note) => <article key={note.id} className={`rounded-md border bg-white p-5 shadow-sm ${note.pinned ? 'border-orange-200' : 'border-gray-200'}`}><div className="flex items-start justify-between"><NotebookText className="text-brand-orange" size={22} /><button type="button" onClick={() => togglePin(note)} className={`grid h-9 w-9 place-items-center rounded-md ${note.pinned ? 'bg-orange-50 text-brand-orange' : 'text-gray-300 hover:bg-gray-50'}`} aria-label="Toggle pin"><Pin size={18} /></button></div><h2 className="mt-4 text-xl font-black">{note.title}</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-gray-500">{note.body}</p><div className="mt-4 flex flex-wrap gap-2"><Chip icon={Folder} text={note.folder} />{note.tags.map((tag) => <Chip key={tag} icon={Tag} text={tag} orange />)}{linkedName(note) ? <Chip icon={Link2} text={`${note.linkedType}: ${linkedName(note)}`} blue /> : null}</div><div className="mt-5 flex items-center justify-between gap-3"><p className="text-sm font-semibold text-gray-400">Updated {formatShortDate(note.updatedAt)}</p><div className="flex gap-2"><Button type="button" variant="secondary" className="h-9 w-9 px-0" onClick={() => edit(note)} aria-label="Edit note"><Edit3 size={16} /></Button><Button type="button" variant="danger" className="h-9 w-9 px-0" onClick={() => deleteNote(note.id)} aria-label="Delete note"><Trash2 size={16} /></Button></div></div></article>)}</section> : <section className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center"><p className="text-lg font-black">No notes found</p><p className="mt-2 text-sm text-gray-500">Create a note or change the search and folder filter.</p></section>}
  </div>;
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) { return <label className={`space-y-2 ${wide ? 'lg:col-span-2' : ''}`}><span className="text-sm font-semibold text-gray-700">{label}</span>{children}</label>; }
function Chip({ icon: Icon, text, orange, blue }: { icon: typeof Folder; text: string; orange?: boolean; blue?: boolean }) { return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${orange ? 'bg-orange-50 text-orange-700' : blue ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}><Icon size={12} />{text}</span>; }
