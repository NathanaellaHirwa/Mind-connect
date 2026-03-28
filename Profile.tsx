import { useEffect, useState, type FormEvent } from 'react';
import type { Booking, Task } from '../types';

interface Props {
  user: { id: string; email: string; recoveryEmail?: string | null; name: string; role?: string };
  bookings: Booking[];
  tasks: Task[];
  onUpdateProfile: (payload: { name: string; email: string; recoveryEmail?: string }) => Promise<void>;
  onChangePassword: (payload: { currentPassword: string; newPassword: string }) => Promise<void>;
  onDeleteAccount: (password: string) => Promise<void>;
}

export default function Profile({
  user,
  bookings,
  tasks,
  onUpdateProfile,
  onChangePassword,
  onDeleteAccount
}: Props) {
  const completed = tasks.filter((t) => t.completed).length;
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    email: user.email,
    recoveryEmail: user.recoveryEmail ?? ''
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [deleteForm, setDeleteForm] = useState({ password: '', confirmText: '' });

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setProfileForm({ name: user.name, email: user.email, recoveryEmail: user.recoveryEmail ?? '' });
  }, [user.name, user.email, user.recoveryEmail]);

  const submitProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileMessage(null);
    try {
      await onUpdateProfile({
        name: profileForm.name.trim(),
        email: profileForm.email.trim().toLowerCase(),
        recoveryEmail: profileForm.recoveryEmail.trim().toLowerCase()
      });
      setProfileMessage('Profile updated successfully.');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Could not update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const submitPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordMessage(null);
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      setPasswordLoading(false);
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      setPasswordLoading(false);
      return;
    }
    try {
      await onChangePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setPasswordMessage('Password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Could not update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const submitDelete = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDeleteLoading(true);
    setDeleteError(null);
    setDeleteMessage(null);
    if (deleteForm.confirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Type DELETE to confirm account deletion.');
      setDeleteLoading(false);
      return;
    }
    try {
      await onDeleteAccount(deleteForm.password);
      setDeleteMessage('Account deleted.');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete account.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card p-6 bg-white/90">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-slate-900">Profile & Settings</h2>
          <span className="text-xs bg-brand-50 text-brand-700 px-3 py-1 rounded-full border border-brand-100">{user.role ?? 'user'}</span>
        </div>
        <p className="text-sm text-slate-700">Name: {user.name}</p>
        <p className="text-sm text-slate-700">Email: {user.email}</p>
        <p className="text-sm text-slate-700">Recovery Email: {user.recoveryEmail || 'Not set'}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5 bg-white/90">
          <p className="text-sm text-slate-500">Tasks</p>
          <p className="text-2xl font-bold text-slate-900">{completed}/{tasks.length} completed</p>
        </div>
        <div className="card p-5 bg-white/90">
          <p className="text-sm text-slate-500">Bookings</p>
          <p className="text-2xl font-bold text-slate-900">{bookings.length}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <form className="card p-5 bg-white/90 space-y-3" onSubmit={submitProfile}>
          <h3 className="text-lg font-semibold text-slate-900">Update Profile</h3>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Name</label>
            <input
              className="w-full"
              value={profileForm.name}
              onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Email</label>
            <input
              className="w-full"
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Recovery Email (optional)</label>
            <input
              className="w-full"
              type="email"
              value={profileForm.recoveryEmail}
              onChange={(e) => setProfileForm((f) => ({ ...f, recoveryEmail: e.target.value }))}
              placeholder="recovery@example.com"
            />
            <p className="text-xs text-slate-500">Forgot password can use this email or your main email.</p>
          </div>
          {profileError && <p className="text-xs text-red-600">{profileError}</p>}
          {profileMessage && <p className="text-xs text-emerald-700">{profileMessage}</p>}
          <button className="btn" type="submit" disabled={profileLoading}>
            {profileLoading ? 'Saving...' : 'Save profile'}
          </button>
        </form>

        <form className="card p-5 bg-white/90 space-y-3" onSubmit={submitPassword}>
          <h3 className="text-lg font-semibold text-slate-900">Security</h3>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Current password</label>
            <input
              className="w-full"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">New password</label>
            <input
              className="w-full"
              type="password"
              minLength={8}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Confirm new password</label>
            <input
              className="w-full"
              type="password"
              minLength={8}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              required
            />
          </div>
          {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}
          {passwordMessage && <p className="text-xs text-emerald-700">{passwordMessage}</p>}
          <button className="btn" type="submit" disabled={passwordLoading}>
            {passwordLoading ? 'Updating...' : 'Change password'}
          </button>
        </form>
      </div>

      <form className="card p-5 bg-red-50 border border-red-100 space-y-3" onSubmit={submitDelete}>
        <h3 className="text-lg font-semibold text-red-700">Danger Zone</h3>
        <p className="text-sm text-red-700/80">
          Delete your account permanently. This removes your profile data, tasks, goals, bookings, and wellness history.
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-red-700">Password</label>
            <input
              className="w-full border-red-200 focus:border-red-300 focus:ring-red-200"
              type="password"
              value={deleteForm.password}
              onChange={(e) => setDeleteForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-red-700">Type DELETE to confirm</label>
            <input
              className="w-full border-red-200 focus:border-red-300 focus:ring-red-200"
              value={deleteForm.confirmText}
              onChange={(e) => setDeleteForm((f) => ({ ...f, confirmText: e.target.value }))}
              required
            />
          </div>
        </div>
        {deleteError && <p className="text-xs text-red-700">{deleteError}</p>}
        {deleteMessage && <p className="text-xs text-emerald-700">{deleteMessage}</p>}
        <button type="submit" className="btn bg-red-600 hover:bg-red-700" disabled={deleteLoading}>
          {deleteLoading ? 'Deleting...' : 'Delete account'}
        </button>
      </form>
    </div>
  );
}
