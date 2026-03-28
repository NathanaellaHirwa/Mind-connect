import type { Goal } from '../types';
import { useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import Modal from '../components/Modal';

interface Props {
  goals: Goal[];
  onUpdate: (id: string, patch: Partial<Goal>) => void;
  onCreate: (goal: { title: string; description?: string; targetDate?: string }) => void;
  onDelete: (id: string) => void;
}

export default function Goals({ goals, onUpdate, onCreate, onDelete }: Props) {
  const active = goals.filter((g) => !g.completed);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState<{ title: string; description: string; targetDate: string }>({ title: '', description: '', targetDate: '' });

  const openCreateModal = () => {
    setEditing(null);
    setForm({ title: '', description: '', targetDate: '' });
    setModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditing(goal);
    setForm({ title: goal.title, description: goal.description || '', targetDate: goal.targetDate || '' });
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Goals</h1>
          <p className="text-sm text-slate-500">{goals.length} active • {goals.filter((g) => g.completed).length} achieved</p>
        </div>
        <button className="btn" onClick={openCreateModal}>+ New Goal</button>
      </header>

      {active.length === 0 ? (
        <div className="card p-10 text-center space-y-3">
          <div className="text-4xl text-slate-300">🎯</div>
          <p className="text-slate-600">No goals yet. Set your first goal!</p>
          <button className="text-emerald-700 font-semibold" onClick={openCreateModal}>Add a goal</button>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((goal) => (
            <div key={goal.id} className="card p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{goal.title}</p>
                {goal.description && <p className="text-sm text-slate-600">{goal.description}</p>}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={goal.progress}
                  onChange={(e) => onUpdate(goal.id, { progress: Number(e.target.value) })}
                  className="w-40"
                />
                <span className="text-sm font-semibold text-emerald-700">{goal.progress}%</span>
                <button className="text-xs text-brand-700 font-semibold" onClick={() => onUpdate(goal.id, { completed: !goal.completed, progress: goal.completed ? goal.progress : 100 })}>{goal.completed ? 'Reopen' : 'Complete'}</button>
                <button className="text-xs text-slate-500" onClick={() => openEditModal(goal)}>Edit</button>
                <button className="text-xs text-red-600" onClick={() => onDelete(goal.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title={editing ? 'Edit Goal' : 'New Goal'} onClose={() => setModalOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (editing) {
              onUpdate(editing.id, { title: form.title, description: form.description, targetDate: form.targetDate });
            } else {
              onCreate({ title: form.title, description: form.description, targetDate: form.targetDate });
            }
            setModalOpen(false);
          }}
        >
          <input className="w-full" placeholder="Goal title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          <input className="w-full" placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <input type="date" className="w-full" value={form.targetDate} onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <button type="button" className="text-sm text-slate-500" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn">{editing ? 'Save changes' : 'Create goal'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
