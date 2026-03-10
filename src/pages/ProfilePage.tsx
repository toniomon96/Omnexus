import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { LogOut, Save, ChevronDown, Download, Trash2, AlertTriangle, Bell, BellOff, Lock, Camera, Zap, HelpCircle, ChevronRight } from 'lucide-react';
import { apiBase } from '../lib/api';
import { useApp } from '../store/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useSubscription } from '../hooks/useSubscription';
import { setUser, clearAppStorage, getWeightUnit, setWeightUnit } from '../utils/localStorage';
import type { Goal, ExperienceLevel, WeightUnit } from '../types';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import {
  getPushPermission,
  isSubscribed,
  subscribeToPush,
  unsubscribeFromPush,
} from '../lib/pushSubscription';

const GOAL_LABELS: Record<Goal, string> = {
  hypertrophy: 'Build Muscle',
  'fat-loss': 'Lose Fat',
  'general-fitness': 'General Fitness',
};

const LEVEL_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

async function updateProfileInDb(userId: string, name: string, goal: Goal, level: ExperienceLevel) {
  const { supabase } = await import('../lib/supabase');
  return supabase
    .from('profiles')
    .update({ name, goal, experience_level: level })
    .eq('id', userId);
}

async function uploadAvatarAndPersist(userId: string, file: File, path: string) {
  const [{ supabase }, { updateAvatarUrl }] = await Promise.all([
    import('../lib/supabase'),
    import('../lib/db'),
  ]);

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  await updateAvatarUrl(userId, data.publicUrl);
  return data.publicUrl;
}

async function updatePasswordInAuth(password: string) {
  const { supabase } = await import('../lib/supabase');
  return supabase.auth.updateUser({ password });
}

async function getSessionAccessToken() {
  const { supabase } = await import('../lib/supabase');
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export function ProfilePage() {
  const { state, dispatch } = useApp();
  const { user: authUser, signOut } = useAuth();
  const navigate = useNavigate();
  const { status: subStatus } = useSubscription();

  const currentUser = state.user;

  const [name, setName] = useState(currentUser?.name ?? '');
  const [goal, setGoal] = useState<Goal>(currentUser?.goal ?? 'general-fitness');
  const [level, setLevel] = useState<ExperienceLevel>(currentUser?.experienceLevel ?? 'beginner');
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>(() => getWeightUnit());
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushDenied, setPushDenied] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const isGuest = !!currentUser?.isGuest;

  useEffect(() => {
    if (isGuest) return;
    async function checkPush() {
      const permission = await getPushPermission();
      if (permission === 'unsupported') return;
      setPushSupported(true);
      setPushDenied(permission === 'denied');
      if (permission === 'granted') {
        setPushEnabled(await isSubscribed());
      }
    }
    checkPush();
  }, [isGuest]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  async function handleSave() {
    if (!currentUser || !name.trim()) return;
    setSaving(true);

    try {
      const updated = {
        ...currentUser,
        name: name.trim(),
        goal,
        experienceLevel: level,
      } satisfies typeof currentUser;

      if (!isGuest) {
        const { error } = await updateProfileInDb(currentUser.id, name.trim(), goal, level);
        if (error) {
          toast(error.message, 'error');
          return;
        }
      }

      setUser(updated);
      dispatch({ type: 'SET_USER', payload: updated });
      toast('Profile saved', 'success');
    } finally {
      setSaving(false);
    }
  }

  function handleWeightUnitChange(nextUnit: WeightUnit) {
    setWeightUnit(nextUnit);
    setWeightUnitState(nextUnit);
    toast(`Weight unit set to ${nextUnit.toUpperCase()}`, 'success');
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentUser || isGuest) return;
    // iOS Safari may return an empty type for some photos (HEIC, web-saved images).
    // Allow empty type or explicit image/* types; reject clearly non-image types.
    if (file.type && !file.type.startsWith('image/')) {
      toast('Please select an image file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('Image must be smaller than 5 MB', 'error');
      return;
    }
    setUploading(true);
    try {
      const rawExt = file.name.split('.').pop()?.toLowerCase() ?? '';
      // Normalize HEIC/HEIF (from iPhone camera) to jpg for broad browser support.
      const ext = rawExt === 'heic' || rawExt === 'heif' || !rawExt ? 'jpg' : rawExt;
      const path = `${currentUser.id}/${Date.now()}.${ext}`;
      const avatarUrl = await uploadAvatarAndPersist(currentUser.id, file, path);
      const updated = { ...currentUser, avatarUrl };
      setUser(updated);
      dispatch({ type: 'SET_USER', payload: updated });
      toast('Profile picture updated', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSignOut() {
    if (isGuest) {
      // Clear all app-owned keys so no guest data lingers after exit.
      // Third-party entries (e.g. cookie consent) are preserved.
      clearAppStorage();
      dispatch({ type: 'CLEAR_USER' });
      navigate('/login', { replace: true });
      return;
    }
    clearAppStorage();
    dispatch({ type: 'CLEAR_USER' });
    await signOut();
    navigate('/login', { replace: true });
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await updatePasswordInAuth(newPassword);
      if (error) {
        setPasswordError(error.message);
      } else {
        toast('Password updated successfully', 'success');
        setNewPassword('');
        setConfirmPassword('');
      }
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleTogglePush() {
    if (!currentUser) return;
    setPushLoading(true);
    try {
      if (pushEnabled) {
        await unsubscribeFromPush(currentUser.id);
        setPushEnabled(false);
      } else {
        const ok = await subscribeToPush(currentUser.id);
        if (ok) {
          setPushEnabled(true);
          setPushDenied(false);
        } else {
          const perm = await getPushPermission();
          if (perm === 'denied') setPushDenied(true);
        }
      }
    } finally {
      setPushLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const accessToken = await getSessionAccessToken();
      if (!accessToken) return;

      const res = await fetch(`${apiBase}/api/export-data`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        toast('Export failed. Please try again.', 'error');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `omnexus-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast('Export failed. Please try again.', 'error');
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const accessToken = await getSessionAccessToken();
      if (!accessToken) return;

      const res = await fetch(`${apiBase}/api/delete-account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        toast('Failed to delete account. Please try again.', 'error');
        return;
      }

      clearAppStorage();
      await signOut();
      navigate('/login', { replace: true });
    } catch {
      toast('Failed to delete account. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const isDirty =
    name.trim() !== currentUser.name ||
    goal !== currentUser.goal ||
    level !== currentUser.experienceLevel;

  return (
    <AppShell>
      <TopBar title="Profile" showBack />

      <div className="px-4 pb-6 space-y-4 mt-2">
        {/* Avatar */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="relative">
            <Avatar url={currentUser.avatarUrl} name={currentUser.name} size="lg" />
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!isGuest && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                aria-label="Change profile picture"
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-brand-500 hover:bg-brand-600 flex items-center justify-center shadow-md transition-colors disabled:opacity-60"
              >
                <Camera size={13} className="text-white" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label="Upload profile picture"
              title="Upload profile picture"
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        {/* Account info */}
        {authUser?.email && (
          <Card>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              Account
            </p>
            <p className="text-sm text-slate-300">{authUser.email}</p>
          </Card>
        )}

        {/* Subscription */}
        {!isGuest && (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                  Subscription
                </p>
                {subStatus?.tier === 'premium' ? (
                  <div className="flex items-center gap-1.5">
                    <Zap size={14} className="text-brand-500" fill="currentColor" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      Premium
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-600 dark:text-slate-300">Free plan</span>
                )}
                {subStatus?.tier === 'premium' && subStatus.periodEnd && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {subStatus.cancelAtPeriodEnd
                      ? `Cancels ${new Date(subStatus.periodEnd).toLocaleDateString()}`
                      : `Renews ${new Date(subStatus.periodEnd).toLocaleDateString()}`}
                  </p>
                )}
              </div>
              <Link
                to="/subscription"
                className="text-xs font-semibold text-brand-500 hover:text-brand-400 transition-colors"
              >
                {subStatus?.tier === 'premium' ? 'Manage' : 'Upgrade →'}
              </Link>
            </div>
          </Card>
        )}

        {/* Help & Support */}
        <button type="button" onClick={() => navigate('/help')} className="w-full text-left">
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <HelpCircle size={18} className="text-slate-500 dark:text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Help & Support</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">FAQs, bug reports, contact</p>
              </div>
              <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
            </div>
          </Card>
        </button>

        {/* Edit profile */}
        <Card>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
            Profile
          </p>

          <div className="space-y-4">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />

            <div>
              <label htmlFor="profile-goal" className="block text-sm font-medium text-slate-300 mb-1.5">
                Goal
              </label>
              <div className="relative">
                <select
                  id="profile-goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as Goal)}
                  aria-label="Goal"
                  title="Goal"
                  className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 pr-8"
                >
                  {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
                    <option key={g} value={g}>
                      {GOAL_LABELS[g]}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile-experience-level" className="block text-sm font-medium text-slate-300 mb-1.5">
                Experience Level
              </label>
              <div className="relative">
                <select
                  id="profile-experience-level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as ExperienceLevel)}
                  aria-label="Experience Level"
                  title="Experience Level"
                  className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 pr-8"
                >
                  {(Object.keys(LEVEL_LABELS) as ExperienceLevel[]).map((l) => (
                    <option key={l} value={l}>
                      {LEVEL_LABELS[l]}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile-weight-unit" className="block text-sm font-medium text-slate-300 mb-1.5">
                Weight Unit
              </label>
              <div className="relative">
                <select
                  id="profile-weight-unit"
                  value={weightUnit}
                  onChange={(e) => handleWeightUnitChange(e.target.value as WeightUnit)}
                  aria-label="Weight Unit"
                  title="Weight Unit"
                  className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 pr-8"
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="lbs">Pounds (lbs)</option>
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !isDirty}
              fullWidth
            >
              <Save size={16} />
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </Card>

        {/* Guest upgrade CTA */}
        {isGuest && (
          <Card className="border-brand-500/40 bg-brand-500/5">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
              Guest Mode
            </p>
            <p className="text-xs text-slate-400 mb-3">
              Your data is saved on this device only. Create a free account to sync across devices, export your data, and join the community.
            </p>
            <Button
              onClick={() => navigate('/onboarding')}
              fullWidth
            >
              Create Free Account
            </Button>
          </Card>
        )}

        {/* Change password — authenticated users only */}
        {!isGuest && (
          <Card>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              Change Password
            </p>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              {passwordError && (
                <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
                  {passwordError}
                </p>
              )}
              <Button
                type="submit"
                fullWidth
                disabled={changingPassword || !newPassword || !confirmPassword}
              >
                <Lock size={16} />
                {changingPassword ? 'Updating…' : 'Update Password'}
              </Button>
            </form>
          </Card>
        )}

        {/* Data export — authenticated users only */}
        {!isGuest && (
          <Card>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              Your Data
            </p>
            <p className="text-xs text-slate-500 mb-3">
              Download a copy of all your workout history, personal records, and progress.
            </p>
            <Button
              variant="ghost"
              onClick={handleExport}
              disabled={exporting}
              fullWidth
            >
              <Download size={16} />
              {exporting ? 'Preparing export…' : 'Export My Data'}
            </Button>
          </Card>
        )}

        {/* Notifications — authenticated users only, if browser supports push */}
        {!isGuest && pushSupported && (
          <Card>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              Notifications
            </p>
            <p className="text-xs text-slate-500 mb-3">
              {pushEnabled
                ? 'You\'ll receive reminders, community activity, and progress milestone alerts.'
                : 'Get training reminders, missed-day nudges, community updates, and milestone alerts.'}
            </p>
            {pushDenied && (
              <p className="text-xs text-amber-400 mb-2">
                Notifications blocked by your browser. Enable them in your browser settings to continue.
              </p>
            )}
            <Button
              variant="ghost"
              onClick={handleTogglePush}
              disabled={pushLoading || pushDenied}
              fullWidth
              className={pushEnabled ? 'text-brand-400' : ''}
            >
              {pushEnabled ? <Bell size={16} /> : <BellOff size={16} />}
              {pushLoading
                ? 'Updating…'
                : pushEnabled
                  ? 'Notifications On'
                  : 'Enable Notifications'}
            </Button>
          </Card>
        )}

        {/* Sign out / Leave guest mode */}
        <Card>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            fullWidth
            className="text-red-400 hover:bg-red-900/20"
          >
            <LogOut size={16} />
            {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
          </Button>
        </Card>

        {/* Danger zone — authenticated users only */}
        {!isGuest && (
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-red-400 shrink-0" />
              <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
                Danger Zone
              </p>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Permanently deletes your account and all associated data. This cannot be undone.
            </p>

            {!showDeleteConfirm ? (
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                fullWidth
                className="text-red-400 hover:bg-red-900/20 border border-red-900/40"
              >
                <Trash2 size={16} />
                Delete Account
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-red-300 font-medium text-center">
                  Are you sure? This will erase everything.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowDeleteConfirm(false)}
                    fullWidth
                    className="text-slate-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    fullWidth
                    className="text-red-400 hover:bg-red-900/30 border border-red-700"
                  >
                    <Trash2 size={14} />
                    {deleting ? 'Deleting…' : 'Yes, Delete'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </AppShell>
  );
}
