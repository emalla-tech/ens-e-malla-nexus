import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  caption: string;
}

export function StatCard({ label, value, icon: Icon, caption }: StatCardProps) {
  return (
    <section className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-brand-black">{value}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-md bg-orange-50 text-brand-orange">
          <Icon size={21} />
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-500">{caption}</p>
    </section>
  );
}
