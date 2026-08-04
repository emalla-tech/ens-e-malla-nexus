interface LogoProps {
  dark?: boolean;
}

export function Logo({ dark = false }: LogoProps) {
  return (
    <div className="flex items-center gap-3" aria-label="ENs, E-Malla Nexus">
      <div className="grid h-10 w-10 place-items-center rounded-md bg-brand-orange text-lg font-black text-white">
        E
      </div>
      <div className="text-2xl font-black tracking-normal">
        <span className="text-brand-orange">E</span>
        <span className={dark ? 'text-brand-black' : 'text-white'}>N</span>
        <span className="text-brand-orange">s</span>
      </div>
    </div>
  );
}
