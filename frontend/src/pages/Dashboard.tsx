import type { Booking, Notification, Professional, Task, Goal, WellnessCheck } from '../types';
import { EmptyState } from '../components/EmptyState';
import { useNavigate } from 'react-router-dom';

interface Props {
  user: { name: string; email: string };
  tasks: Task[];
  reminders: Task[];
  bookings: Booking[];
  notifications: Notification[];
  professionals: Professional[];
  goals: Goal[];
  wellnessChecks: WellnessCheck[];
  onMarkDone: (id: string) => void;
  onMarkRead: (id: string) => void;
}

export default function Dashboard({
  user,
  tasks,
  reminders,
  bookings,
  notifications,
  professionals,
  goals,
  wellnessChecks,
  onMarkDone,
  onMarkRead
}: Props) {
  const navigate = useNavigate();
  const open = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);
  const wellnessScore = computeWellnessScore(wellnessChecks);
  const userName = user?.name?.split(' ')[0] || 'Friend';
  const activeGoals = goalsActive(goals);
  const avgGoal = averageGoalProgress(goals);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-slate-500 flex items-center gap-2">✴️ Good evening</p>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">{userName} <span>👋</span></h1>
        <p className="text-sm text-slate-600">Here’s how you’re doing today.</p>
      </header>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Tasks Done" value={`${completed.length}/${tasks.length || 0}`} icon="✅" onClick={() => navigate('/tasks')} />
        <StatCard label="Active Goals" value={`${activeGoals}`} icon="🎯" onClick={() => navigate('/goals')} />
        <StatCard label="Wellness Score" value={`${wellnessScore}%`} icon="💖" onClick={() => navigate('/wellness-check')} />
        <StatCard label="Upcoming Sessions" value={`${bookings.length}`} icon="👥" onClick={() => navigate('/book')} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Goal Progress" onClick={() => navigate('/goals')}>
          <ProgressRing value={avgGoal} />
          <p className="text-sm text-slate-500 text-center mt-2">avg. completion</p>
        </Panel>
        <Panel title="Recent Tasks" action="View all" onClick={() => navigate('/tasks')}>
          {tasks.length === 0 ? (
            <EmptyState title="No tasks yet." message="Add one to get started." />
          ) : (
            <ul className="space-y-2 text-sm text-slate-800">
              {tasks.slice(0, 4).map((t) => (
                <li key={t.id} className="flex items-center gap-2">
                  <span className="text-emerald-600">•</span>
                  {t.title}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Upcoming Sessions" action="Book" onClick={() => navigate('/book')}>
          {bookings.length === 0 ? (
            <EmptyState title="No sessions booked." message="Find a professional." />
          ) : (
            bookings.slice(0, 3).map((b) => {
              const pro = professionals.find((p) => p.id === b.professionalId);
              return (
                <div key={b.id} className="rounded-xl border border-slate-100 px-3 py-2 flex justify-between text-sm text-slate-700">
                  <span>{pro?.name || 'Professional'}</span>
                  <span className="text-slate-500">{new Date(b.requestedAt).toLocaleDateString()}</span>
                </div>
              );
            })
          )}
        </Panel>

        <div className="card p-6 bg-gradient-to-br from-emerald-700 to-emerald-600 text-white rounded-3xl">
          <p className="text-sm mb-2">Ready to grow today?</p>
          <h3 className="text-xl font-semibold mb-3">Your mental wellness and productivity go hand in hand. Take a small step toward your goals.</h3>
          <button className="btn bg-white text-emerald-700 font-bold w-full" onClick={() => navigate('/wellness-check')}>Log Wellness Check-in</button>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ label, value, icon, onClick }: { label: string; value: string; icon: string; onClick?: () => void }) => (
  <button onClick={onClick} className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm flex items-center gap-3 text-left w-full hover:border-emerald-200 transition">
    <span className="text-xl">{icon}</span>
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  </button>
);

const Panel = ({ title, action, children, onClick }: { title: string; action?: string; children: React.ReactNode; onClick?: () => void }) => (
  <div className="card p-5 bg-white/90">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {action && <button className="text-xs text-brand-700 font-semibold" onClick={onClick}>{action} →</button>}
    </div>
    {children}
  </div>
);

const ProgressRing = ({ value }: { value: number }) => {
  const clamped = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="h-32 w-32 rounded-full"
        style={{
          background: `conic-gradient(#23bd69 ${clamped}%, #e5e7eb ${clamped}% 100%)`,
          mask: 'radial-gradient(circle at center, transparent 55%, black 56%)'
        }}
      />
      <p className="text-2xl font-bold text-emerald-700 mt-2">{clamped}%</p>
    </div>
  );
};

const goalsActive = (goals: any[]) => goals.filter((g) => !g.completed).length || 0;
const averageGoalProgress = (goals: any[]) => {
  if (!goals.length) return 0;
  const sum = goals.reduce((acc, g) => acc + (g.progress || 0), 0);
  return Math.round(sum / goals.length);
};

const computeWellnessScore = (checks: any[]) => {
  if (!checks.length) return 0;
  const latest = checks[checks.length - 1];
  const moodScore = moodToScore(latest.mood);
  const stressScore = latest.stressLevel ? 100 - Math.min(100, latest.stressLevel * 10) : 60;
  const sleepScore = latest.sleepHours ? Math.min(100, (latest.sleepHours / 8) * 100) : 60;
  return Math.round((moodScore + stressScore + sleepScore) / 3);
};

const moodToScore = (mood: string) => {
  const map: Record<string, number> = { verylow: 20, low: 40, okay: 60, good: 80, great: 100 };
  return map[mood?.toLowerCase?.()] ?? 60;
};
