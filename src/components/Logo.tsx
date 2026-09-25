interface LogoProps {
  dark?: boolean;
}

export function Logo({ dark = false }: LogoProps) {
  return (
    <img
      src={dark ? '/icons/ens-logo-right.png' : '/icons/ens-logo-left.png'}
      alt="ENs, E-Malla Nexus"
      className="h-11 w-auto max-w-[150px] object-contain sm:h-14 sm:max-w-[180px]"
    />
  );
}
