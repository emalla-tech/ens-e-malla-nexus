interface LogoProps {
  dark?: boolean;
}

export function Logo({ dark = false }: LogoProps) {
  return (
    <img
      src={dark ? '/icons/ens-logo-dark.svg' : '/icons/ens-logo-light.svg'}
      alt="ENs, E-Malla Nexus"
      className="h-10 w-auto max-w-[170px] sm:h-12 sm:max-w-[205px]"
    />
  );
}
