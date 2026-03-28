import { useState } from 'react';
import Modal from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import type { WellnessCheck } from '../types';

const moodOptions = [
  { key: 'verylow', label: 'Very Low', icon: '😞' },
  { key: 'low', label: 'Low', icon: '☁️' },
  { key: 'okay', label: 'Okay', icon: '🙂' },
  { key: 'good', label: 'Good', icon: '😊' },
  { key: 'great', label: 'Great', icon: '🤩' }
];

interface Props {
  checks: WellnessCheck[];
  onSubmit: (payload: {
    mood: string;
    stressLevel: number;
    energyLevel: number;
    sleepHours: number;
    note?: string;
    grateful?: string;
  }) => Promise<void>;
}

export default function WellnessCheckPage({ checks, onSubmit }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    mood: 'okay',
    stressLevel: 3,
    energyLevel: 3,
    sleepHours: 7,
    note: '',
    grateful: ''
  });
  const [modalOpen, setModalOpen] = useState(false);

  const submit = async () => {
    setSaving(true);
    await onSubmit(form);
    setSaved(true);
    setSaving(false);
    setModalOpen(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const latest = checks.length ? checks[checks.length - 1] : undefined;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Wellness Check-in</h1>
          <p className="text-sm text-slate-500">Track how you’re feeling to understand your patterns.</p>
        </div>
        <button className="btn" onClick={() => setModalOpen(true)}>Log Check-in</button>
      </header>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900">Latest Check</h3>
          {saved && <span className="text-xs text-emerald-700">Saved ✓</span>}
        </div>
        {latest ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-slate-700">
            <Stat label="Mood" value={moodLabel(latest.mood)} />
            <Stat label="Energy" value={`${latest.energyLevel ?? 3}/5`} />
            <Stat label="Stress" value={`${latest.stressLevel ?? 3}/5`} />
            <Stat label="Sleep" value={`${latest.sleepHours ?? 7}h`} />
          </div>
        ) : (
          <EmptyState title="No check-ins yet" message="Log your first check-in to see trends." />
        )}
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Recent Check-ins</h3>
        {checks.length === 0 ? (
          <EmptyState title="No data" message="Submit a check-in to view history." />
        ) : (
          <ul className="space-y-2 text-sm text-slate-700">
            {[...checks].reverse().slice(0, 10).map((c) => (
              <li key={c.id} className="flex justify-between border-b border-slate-100 pb-1">
                <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                <span className="text-slate-500">{moodLabel(c.mood)} • stress {c.stressLevel ?? 3}/5 • energy {c.energyLevel ?? 3}/5</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={modalOpen} title="Wellness Check-in" onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-2">Mood</p>
            <div className="flex flex-wrap gap-2">
              {moodOptions.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setForm((f) => ({ ...f, mood: m.key }))}
                  className={`px-4 py-2 rounded-xl border text-sm flex items-center gap-2 ${form.mood === m.key ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}
                >
                  <span>{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <Slider label="Energy Level" value={form.energyLevel} onChange={(v) => setForm((f) => ({ ...f, energyLevel: v }))} max={5} />
          <Slider label="Stress Level" value={form.stressLevel} onChange={(v) => setForm((f) => ({ ...f, stressLevel: v }))} max={5} />
          <Slider label="Sleep Hours" value={form.sleepHours} onChange={(v) => setForm((f) => ({ ...f, sleepHours: v }))} max={12} step={0.5} />

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Journal Entry</label>
              <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={3} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">I’m grateful for…</label>
              <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={3} value={form.grateful} onChange={(e) => setForm((f) => ({ ...f, grateful: e.target.value }))} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button className="text-sm text-slate-500" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn" onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Submit Check-in'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const Slider = ({ label, value, onChange, max, step = 1 }: { label: string; value: number; onChange: (v: number) => void; max: number; step?: number }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <span className="text-emerald-700">{value}{label.includes('Sleep') ? 'h' : '/5'}</span>
    </div>
    <input type="range" min={label.includes('Sleep') ? 0 : 1} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-emerald-600" />
    <div className="flex justify-between text-xs text-slate-500">
      <span>{label.includes('Sleep') ? '0h' : 'Low'}</span>
      <span>{label.includes('Sleep') ? `${max}h` : 'High'}</span>
    </div>
  </div>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-slate-100 bg-white/90 p-3">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="text-lg font-semibold text-slate-900">{value}</p>
  </div>
);

const moodLabel = (mood?: string) => {
  const found = moodOptions.find((m) => m.key === mood);
  return found ? found.label : 'Okay';
};
