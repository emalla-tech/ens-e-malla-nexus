import { Bell, Building2, ChevronDown, Download, Menu, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { Logo } from './Logo';
import { useWorkspace } from '../hooks/useWorkspace';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { workspaces, activeWorkspace, switchWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  async function handleInstall() {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    setInstallPrompt(null);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-brand-gray/90 px-4 py-4 backdrop-blur print:hidden md:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/notifications"
            className="grid h-10 w-10 place-items-center rounded-md bg-white text-brand-black shadow-sm lg:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu size={21} />
          </Link>
          <Logo dark />
          {activeWorkspace ? <label className="relative hidden items-center md:flex"><Building2 size={16} className="pointer-events-none absolute left-3 text-brand-orange" /><select aria-label="Active workspace" value={activeWorkspace.id} onChange={(event) => event.target.value === '__new__' ? navigate('/onboarding?new=1') : switchWorkspace(event.target.value)} className="min-h-10 max-w-52 appearance-none rounded-md border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm font-bold outline-none focus:border-brand-orange">{workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}<option value="__new__">+ Create workspace</option></select><ChevronDown size={14} className="pointer-events-none absolute right-3 text-gray-400" /></label> : null}
        </div>

        <div className="hidden min-h-10 w-full max-w-sm items-center gap-2 rounded-md bg-white px-3 text-gray-500 shadow-sm md:flex">
          <Search size={18} />
          <input
            className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-gray-400"
            placeholder="Search work, customers, or notes"
          />
        </div>

        <div className="flex items-center gap-2">
          {installPrompt ? (
            <Button variant="secondary" className="hidden sm:inline-flex" onClick={handleInstall}>
              <Download size={17} />
              Install
            </Button>
          ) : null}
          <Button className="hidden sm:inline-flex">
            <Plus size={17} />
            New Task
          </Button>
          <button
            className="relative grid h-10 w-10 place-items-center rounded-md bg-white text-brand-black shadow-sm"
            aria-label="Open notifications"
          >
            <Bell size={19} />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-brand-orange" />
          </button>
        </div>
      </div>
    </header>
  );
}
