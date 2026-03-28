import type { Task } from '../types';
import { useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import Modal from '../components/Modal';

interface Props {
  tasks: Task[];
  onAdd: (task: { title: string; description?: string; dueDate?: string }) => void;
  onComplete: (id: string) => void;
  onUpdate: (task: Partial<Task> & { id: string }) => void;
  onDelete: (id: string) => void;
}

type TaskFilter = 'All' | 'Pending' | 'In Progress' | 'Completed';

export default function Tasks({ tasks, onAdd, onComplete, onUpdate, onDelete }: Props) {
  const open = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);
  const pending = tasks.filter((t) => !t.completed && (!t.progress || t.progress === 0));
  const inProgress = tasks.filter((t) => !t.completed && t.progress > 0 && t.progress < 100);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('All');
  const [form, setForm] = useState<{ title: string; description: string; dueDate: string }>({ title: '', description: '', dueDate: '' });

  const openCreateModal = () => {
    setEditing(null);
    setForm({ title: '', description: '', dueDate: '' });
    setModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditing(task);
    setForm({ title: task.title, description: task.description, dueDate: task.dueDate || '' });
    setModalOpen(true);
  };

  const filteredTasks = (() => {
    switch (activeFilter) {
      case 'Pending':
        return pending;
      case 'In Progress':
        return inProgress;
      case 'Completed':
        return completed;
      default:
        return tasks;
    }
  })();

  const filterTabs: TaskFilter[] = ['All', 'Pending', 'In Progress', 'Completed'];

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Tasks</h1>
          <p className="text-sm text-slate-500">
            {pending.length} pending • {inProgress.length} in progress • {completed.length} done
          </p>
          <div className="flex gap-2 mt-3 text-xs">
            {filterTabs.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1 rounded-full border transition ${
                  activeFilter === f
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <button className="btn" onClick={openCreateModal}>+ New Task</button>
      </header>

      {tasks.length === 0 ? (
        <div className="card p-10 text-center space-y-3">
          <div className="text-4xl text-slate-300">⚪</div>
          <p className="text-slate-600">No tasks here yet.</p>
          <button className="text-emerald-700 font-semibold" onClick={openCreateModal}>
            Create your first task
          </button>
        </div>
      ) : activeFilter === 'All' ? (
        <div className="grid lg:grid-cols-2 gap-4">
          <TaskColumn title="Open" tasks={open} onComplete={onComplete} onUpdate={onUpdate} onEdit={openEditModal} onDelete={onDelete} />
          <TaskColumn title="Completed" tasks={completed} onComplete={onComplete} onUpdate={onUpdate} onEdit={openEditModal} onDelete={onDelete} />
        </div>
      ) : (
        <TaskColumn title={activeFilter} tasks={filteredTasks} onComplete={onComplete} onUpdate={onUpdate} onEdit={openEditModal} onDelete={onDelete} />
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Edit Task' : 'New Task'}
        onClose={() => setModalOpen(false)}
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (editing) {
              onUpdate({ id: editing.id, title: form.title, description: form.description, dueDate: form.dueDate || null });
            } else {
              onAdd({ title: form.title, description: form.description, dueDate: form.dueDate });
            }
            setModalOpen(false);
          }}
        >
          <input className="w-full" placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          <input className="w-full" placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <input type="date" className="w-full" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <button type="button" className="text-sm text-slate-500" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn">{editing ? 'Save changes' : 'Create task'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function TaskColumn({
  title,
  tasks,
  onComplete,
  onUpdate,
  onEdit,
  onDelete
}: {
  title: string;
  tasks: Task[];
  onComplete: (id: string) => void;
  onUpdate: (task: Partial<Task> & { id: string }) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h3>
        <span className="text-xs text-slate-400">{tasks.length} items</span>
      </div>
      {tasks.length === 0 && <EmptyState title="No tasks" message="Add your first task to get moving." />}
      {tasks.map((task) => (
        <article key={task.id} className="rounded-2xl border border-slate-100 px-4 py-3 space-y-2 bg-white/80 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-900">{task.title}</p>
              {task.description && <p className="text-sm text-slate-600">{task.description}</p>}
              <p className="text-xs text-slate-500">Created {new Date(task.createdAt).toLocaleDateString()}</p>
              {task.dueDate && <p className="text-xs text-amber-600">Due {new Date(task.dueDate).toLocaleDateString()}</p>}
            </div>
            {!task.completed && (
              <button className="text-xs font-semibold text-brand-700" onClick={() => onComplete(task.id)}>
                Mark done
              </button>
            )}
            <div className="flex gap-2 text-xs">
              <button className="text-emerald-700 font-semibold" onClick={() => onEdit(task)}>Edit</button>
              <button className="text-red-600 font-semibold" onClick={() => onDelete(task.id)}>Remove</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={task.progress}
              onChange={(e) => onUpdate({ id: task.id, progress: Number(e.target.value) })}
              className="w-full"
            />
            <span className="text-xs text-slate-600 w-10 text-right">{task.progress}%</span>
          </div>
        </article>
      ))}
    </div>
  );
}
