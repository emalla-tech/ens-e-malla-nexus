import { Bell, Download, Menu, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { Logo } from './Logo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
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
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-brand-gray/90 px-4 py-4 backdrop-blur md:px-6 lg:px-8">
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
