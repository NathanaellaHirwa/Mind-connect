interface Stat {
  label: string;
  value: string | number;
  hint?: string;
}

export function StatsRow({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl bg-white/80 border border-white/70 shadow-[0_10px_30px_-16px_rgba(15,23,42,0.35)] p-4">
          <p className="text-xs text-slate-500 tracking-wide">{stat.label}</p>
          <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          {stat.hint && <p className="text-[11px] text-slate-500 mt-1">{stat.hint}</p>}
        </div>
      ))}
    </div>
  );
}
