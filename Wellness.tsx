import type { Resource } from '../types';

interface Props {
  resources: Resource[];
}

const habits = [
  'Daily check-in: write 3 wins + 1 worry',
  '5-minute guided breathing before sleep',
  '25-minute focus blocks, 5-minute reset',
  'Get sunlight before 10am for mood regulation'
];

export default function Wellness({ resources }: Props) {
  const curated = resources.slice(0, 4);
  return (
    <div className="space-y-4">
      <section className="card p-6 bg-gradient-to-br from-brand-50 via-white to-white/90">
        <h2 className="text-xl font-semibold text-slate-900">Wellness routines</h2>
        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1 mt-3">
          {habits.map((h) => <li key={h}>{h}</li>)}
        </ul>
      </section>

      <section className="card p-6 bg-white/90">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-md font-semibold text-slate-900">Curated resources</h3>
          <span className="text-xs text-slate-500">{curated.length} picks</span>
        </div>
        {curated.length === 0 && <p className="text-sm text-slate-500">No content yet.</p>}
        <div className="grid sm:grid-cols-2 gap-3">
          {curated.map((r) => (
            <div key={r.id} className="rounded-lg border border-slate-200 px-3 py-2">
              <p className="font-semibold text-slate-900">{r.title}</p>
              <p className="text-xs text-slate-500">{r.tag} • {r.language}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
