import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Navigate, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import type { Task, Goal, Professional, Booking, Resource, Notification, WellnessCheck } from './types';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Goals from './pages/Goals';
import BookSession from './pages/BookSession';
import ProfessionalsPage from './pages/Professionals';
import ResourcesPage from './pages/Resources';
import WellnessPage from './pages/Wellness';
import WellnessCheckPage from './pages/WellnessCheck';
import Profile from './pages/Profile';
import AdminProfessionals from './pages/AdminProfessionals';
import AdminResources from './pages/AdminResources';
import Layout from './layout/Layout';
import { API_URL } from './config';

const EMAIL_VERIFICATION_ENABLED = false;
const PASSWORD_RESET_ENABLED = false;

function App() {
  const navigate = useNavigate();
  const { token, user, login, register, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [reminders, setReminders] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [wellnessChecks, setWellnessChecks] = useState<WellnessCheck[]>([]);

  const [bookingForm, setBookingForm] = useState({ professionalId: '', note: '' });

  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }),
    [token]
  );

  useEffect(() => {
    if (!token) return;
    
    const load = async () => {
      try {
        const [tasksRes, goalsRes, prosRes, bookingsRes, resourcesRes, remindersRes, notesRes, wellnessRes] = await Promise.all([
          fetch(`${API_URL}/tasks`, { headers }),
          fetch(`${API_URL}/goals`, { headers }),
          fetch(`${API_URL}/professionals`),
          fetch(`${API_URL}/bookings`, { headers }),
          fetch(`${API_URL}/resources`),
          fetch(`${API_URL}/reminders`, { headers }),
          fetch(`${API_URL}/notifications`, { headers }),
          fetch(`${API_URL}/wellness-checks`, { headers })
        ]);
        
        // Check for API errors
        if (!prosRes.ok) throw new Error(`Professionals API error: ${prosRes.status}`);
        if (!resourcesRes.ok) throw new Error(`Resources API error: ${resourcesRes.status}`);
        
        const tasksData = await tasksRes.json();
        const goalsData = await goalsRes.json();
        const prosData = await prosRes.json();
        const bookingsData = await bookingsRes.json();
        const resourcesData = await resourcesRes.json();
        const remindersData = await remindersRes.json();
        const notesData = await notesRes.json();
        const wellnessData = await wellnessRes.json();
        
        console.log('✅ Professionals from backend:', prosData.length);
        console.log('✅ Resources from backend:', resourcesData.length);
        
        setTasks(tasksData);
        setGoals(goalsData);
        setProfessionals(prosData);
        setBookings(bookingsData);
        setResources(resourcesData);
        setReminders(remindersData.dueSoon || []);
        setNotifications(notesData);
        setWellnessChecks(wellnessData);
      } catch (err) {
        console.error('❌ Failed to load data:', err);
        setError(err instanceof Error ? err.message : 'Unable to load data');
      }
    };
    load();
  }, [token, headers]);

  const refreshResources = async () => {
    try {
      const res = await fetch(`${API_URL}/resources`);
      if (!res.ok) throw new Error(`Resources API error: ${res.status}`);
      const data = await res.json();
      setResources(data);
    } catch (err) {
      console.error('Failed to refresh resources:', err);
    }
  };

  const refreshProfessionals = async () => {
    try {
      const res = await fetch(`${API_URL}/professionals`);
      if (!res.ok) throw new Error(`Professionals API error: ${res.status}`);
      const data = await res.json();
      setProfessionals(data);
    } catch (err) {
      console.error('Failed to refresh professionals:', err);
    }
  };

  const addTask = async (task: { title: string; description?: string; dueDate?: string }) => {
    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: task.title,
        description: task.description ?? '',
        dueDate: task.dueDate || null
      })
    });
    if (!res.ok) return setError('Could not create task');
    const data: Task = await res.json();
    setTasks((p) => [data, ...p]);
  };

  const completeTask = async (id: string) => {
    const res = await fetch(`${API_URL}/tasks/${id}/complete`, { method: 'PATCH', headers });
    if (!res.ok) return;
    const data: Task = await res.json();
    setTasks((p) => p.map((t) => (t.id === id ? data : t)));
  };

  const updateTask = async (patch: Partial<Task> & { id: string }) => {
    const { id, ...body } = patch;
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) return;
    const data: Task = await res.json();
    setTasks((p) => p.map((t) => (t.id === id ? data : t)));
  };

  const deleteTask = async (id: string) => {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) return;
    setTasks((p) => p.filter((t) => t.id !== id));
  };

  const addGoal = async (goal: { title: string; description?: string; targetDate?: string }) => {
    const res = await fetch(`${API_URL}/goals`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: goal.title,
        description: goal.description ?? '',
        targetDate: goal.targetDate || null
      })
    });
    if (!res.ok) return setError('Could not create goal');
    const data: Goal = await res.json();
    setGoals((p) => [data, ...p]);
  };

  const updateGoal = async (id: string, patch: Partial<Goal>) => {
    const res = await fetch(`${API_URL}/goals/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(patch)
    });
    if (!res.ok) return;
    const data: Goal = await res.json();
    setGoals((p) => p.map((g) => (g.id === id ? data : g)));
  };

  const deleteGoal = async (id: string) => {
    const res = await fetch(`${API_URL}/goals/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) return;
    setGoals((p) => p.filter((g) => g.id !== id));
  };

  const createBooking = async (note?: string, professionalId?: string) => {
    const proId = professionalId ?? bookingForm.professionalId;
    const bodyNote = note ?? bookingForm.note;
    if (!proId) return;
    const res = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ professionalId: proId, note: bodyNote })
    });
    if (!res.ok) return setError('Could not request booking');
    const data = await res.json();
    setBookings((p) => [data.booking, ...p]);
    setBookingForm({ professionalId: '', note: '' });
  };

  const markNotification = async (id: string) => {
    const res = await fetch(`${API_URL}/notifications/${id}/read`, { method: 'PATCH', headers });
    if (!res.ok) return;
    const data: Notification = await res.json();
    setNotifications((p) => p.map((n) => (n.id === id ? data : n)));
  };

  const submitWellnessCheck = async (payload: {
    mood: string;
    stressLevel: number;
    energyLevel: number;
    sleepHours: number;
    note?: string;
    grateful?: string;
  }) => {
    const res = await fetch(`${API_URL}/wellness-checks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        mood: payload.mood,
        stressLevel: payload.stressLevel,
        sleepHours: payload.sleepHours,
        note: payload.note,
        grateful: payload.grateful,
        energyLevel: payload.energyLevel
      })
    });
    if (!res.ok) return setError('Could not submit wellness check');
    const check: WellnessCheck = await res.json();
    setWellnessChecks((p) => [...p, check]);
  };

  const parseErrorMessage = async (res: Response, fallback: string) => {
    try {
      const data = await res.json();
      return data?.message || fallback;
    } catch {
      return fallback;
    }
  };

  const updateAccountProfile = async (payload: { name: string; email: string; recoveryEmail?: string }) => {
    const res = await fetch(`${API_URL}/me`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Could not update profile'));
    }
    const updated = await res.json();
    updateUser(updated);
  };

  const updateAccountPassword = async (payload: { currentPassword: string; newPassword: string }) => {
    const res = await fetch(`${API_URL}/me/password`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Could not update password'));
    }
  };

  const deleteAccount = async (password: string) => {
    const res = await fetch(`${API_URL}/me`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ password })
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Could not delete account'));
    }
    logout();
    navigate('/login', { replace: true });
  };

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!token || !user) {
    return (
      <Routes>
        <Route
          path="/signup"
          element={
            <AuthPage
              mode="signup"
              onSubmit={async (email, password, name) => {
                await register(name ?? '', email, password);
              }}
              loading={loading}
              setLoading={setLoading}
              error={error}
              setError={setError}
            />
          }
        />
        <Route path="/login" element={<AuthPage mode="login" onSubmit={(email, password) => login(email, password)} loading={loading} setLoading={setLoading} error={error} setError={setError} />} />
        {PASSWORD_RESET_ENABLED && <Route path="/forgot-password" element={<ForgotPasswordPage />} />}
        {PASSWORD_RESET_ENABLED && <Route path="/reset-password" element={<ResetPasswordPage />} />}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout user={user} onSignOut={handleSignOut}>
      <Routes>
        <Route path="/dashboard" element={
          <Dashboard
            user={user}
            tasks={tasks}
            reminders={reminders}
            bookings={bookings}
            notifications={notifications}
            professionals={professionals}
            goals={goals}
            wellnessChecks={wellnessChecks}
            onMarkDone={completeTask}
            onMarkRead={markNotification}
          />
        } />
        <Route path="/tasks" element={
          <Tasks tasks={tasks} onAdd={addTask} onComplete={completeTask} onUpdate={updateTask} onDelete={deleteTask} />
        } />
        <Route path="/goals" element={
          <Goals goals={goals} onUpdate={updateGoal} onCreate={addGoal} onDelete={deleteGoal} />
        } />
        <Route path="/book" element={
          <BookSession professionals={professionals} bookings={bookings} bookingForm={bookingForm} setBookingForm={setBookingForm} createBooking={createBooking} />
        } />
        <Route path="/professionals" element={<ProfessionalsPage professionals={professionals} onBook={createBooking} />} />
        <Route path="/resources" element={<ResourcesPage resources={resources} />} />
        <Route path="/wellness" element={<WellnessPage resources={resources} />} />
        <Route path="/wellness-check" element={<WellnessCheckPage checks={wellnessChecks} onSubmit={submitWellnessCheck} />} />
        {user?.role === 'admin' && (
          <>
<Route path="/admin/professionals" element={<AdminProfessionals token={token} refreshProfessionals={refreshProfessionals} />} />
<Route path="/admin/resources" element={<AdminResources token={token} refreshResources={refreshResources} />} />
          </>
        )}
        <Route
          path="/profile"
          element={
            <Profile
              user={user}
              bookings={bookings}
              tasks={tasks}
              onUpdateProfile={updateAccountProfile}
              onChangePassword={updateAccountPassword}
              onDeleteAccount={deleteAccount}
            />
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;

type AuthHandler = (email: string, password: string, name?: string) => Promise<void>;

function AuthPage({
  mode,
  onSubmit,
  loading,
  setLoading,
  error,
  setError
}: {
  mode: 'login' | 'signup';
  onSubmit: AuthHandler;
  loading: boolean;
  setLoading: (b: boolean) => void;
  error: string | null;
  setError: (s: string | null) => void;
}) {
  const navigate = useNavigate();
  const isLogin = mode === 'login';
  const [confirm, setConfirm] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendPreviewLink, setResendPreviewLink] = useState<string | null>(null);

  const handle = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get('email') ?? emailValue).trim();
    const password = String(data.get('password'));
    const name = String(data.get('name') ?? '');
    if (!isLogin && confirm !== password) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(email, password, name);
      if (isLogin) {
        navigate('/dashboard', { replace: true });
      } else if (EMAIL_VERIFICATION_ENABLED) {
        setError('Account created. Check your email and verify before signing in.');
        navigate('/login', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    const email = emailValue.trim();
    if (!email) {
      setResendError('Enter your email above first.');
      setResendMessage(null);
      setResendPreviewLink(null);
      return;
    }
    setResendLoading(true);
    setResendError(null);
    setResendMessage(null);
    setResendPreviewLink(null);
    try {
      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Could not resend verification email');
      setResendMessage(data?.message || 'Verification email sent.');
      if (data?.verificationLink) setResendPreviewLink(data.verificationLink);
    } catch (err) {
      setResendError(err instanceof Error ? err.message : 'Could not resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-[0_25px_80px_-35px_rgba(15,23,42,0.35)] border border-slate-100 px-8 py-9 space-y-6">
        <button
          type="button"
          onClick={() => navigate(isLogin ? '/signup' : '/login')}
          className="text-sm text-slate-500 hover:text-brand-700 flex items-center gap-2"
        >
          ← Back to {isLogin ? 'sign up' : 'sign in'}
        </button>
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-slate-900">{isLogin ? 'Welcome to MindConnect' : 'Create your account'}</h1>
          <p className="text-sm text-slate-500">{isLogin ? 'Sign in to continue' : 'Start your wellness + productivity journey'}</p>
        </div>

        <form className="space-y-4" onSubmit={handle}>
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Full name</label>
              <input name="name" required className="w-full" placeholder="Amina Diallo" />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full"
              placeholder="you@example.com"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input name="password" type="password" minLength={8} required className="w-full" placeholder="Min. 8 characters" />
            {isLogin && PASSWORD_RESET_ENABLED && (
              <div className="pt-1 text-right">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs text-brand-700 hover:text-brand-900"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Confirm Password</label>
              <input type="password" minLength={8} required className="w-full" placeholder="Re-enter password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
          )}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button className="btn w-full bg-slate-900 hover:bg-slate-800" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
          </button>
          {isLogin && EMAIL_VERIFICATION_ENABLED && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <p className="text-xs text-slate-500">Didn’t get your verification email?</p>
              <button
                type="button"
                onClick={resendVerification}
                disabled={resendLoading}
                className="text-xs text-brand-700 hover:text-brand-900 disabled:opacity-60"
              >
                {resendLoading ? 'Sending...' : 'Resend verification email'}
              </button>
              {resendError && <p className="text-xs text-red-600">{resendError}</p>}
              {resendMessage && <p className="text-xs text-emerald-700">{resendMessage}</p>}
              {resendPreviewLink && (
                <p className="text-xs text-slate-500 break-all">
                  Dev preview link: <a className="text-brand-700" href={resendPreviewLink}>{resendPreviewLink}</a>
                </p>
              )}
            </div>
          )}
        </form>

        <div className="text-center text-xs text-slate-500">
          By continuing you agree to our Terms and Privacy Policy.
        </div>
      </div>
    </div>
  );
}

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [previewLink, setPreviewLink] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setPreviewLink(null);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Could not send reset email');
      setMessage(data?.message || 'If that email is registered, a reset link has been sent.');
      if (data?.resetLink) setPreviewLink(data.resetLink);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-[0_25px_80px_-35px_rgba(15,23,42,0.35)] border border-slate-100 px-8 py-9 space-y-6">
        <button type="button" onClick={() => navigate('/login')} className="text-sm text-slate-500 hover:text-brand-700">
          ← Back to sign in
        </button>
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Reset your password</h1>
          <p className="text-sm text-slate-500">Enter your registered or recovery email to receive a reset link.</p>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input type="email" required className="w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {message && <p className="text-emerald-700 text-sm">{message}</p>}
          {previewLink && (
            <p className="text-xs text-slate-500 break-all">
              Dev preview link: <a className="text-brand-700" href={previewLink}>{previewLink}</a>
            </p>
          )}
          <button className="btn w-full bg-slate-900 hover:bg-slate-800" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    if (!token) {
      setError('Reset token is missing.');
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Could not reset password');
      setMessage(data?.message || 'Password reset successful.');
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-[0_25px_80px_-35px_rgba(15,23,42,0.35)] border border-slate-100 px-8 py-9 space-y-6">
        <button type="button" onClick={() => navigate('/login')} className="text-sm text-slate-500 hover:text-brand-700">
          ← Back to sign in
        </button>
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Set a new password</h1>
          <p className="text-sm text-slate-500">Choose a new password for your account.</p>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">New password</label>
            <input type="password" minLength={8} required className="w-full" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Confirm password</label>
            <input type="password" minLength={8} required className="w-full" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {message && <p className="text-emerald-700 text-sm">{message}</p>}
          <button className="btn w-full bg-slate-900 hover:bg-slate-800" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
}
