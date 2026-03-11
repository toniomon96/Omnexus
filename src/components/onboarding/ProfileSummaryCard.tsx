import { Sparkles, Dumbbell, Calendar, Wrench, AlertCircle, Target, LayoutGrid } from 'lucide-react';
import type { UserTrainingProfile } from '../../types';
import { Button } from '../ui/Button';
import { formatLabel } from '../../utils/formatUtils';

interface Props {
  profile: UserTrainingProfile;
  onGenerate: () => void;
  generating: boolean;
  generatingIdx: number;
  error: string;
}

const GOAL_LABELS: Record<string, string> = {
  'hypertrophy': 'Muscle Building',
  'fat-loss': 'Fat Loss',
  'general-fitness': 'General Fitness',
};

const SPLIT_LABELS: Record<string, string> = {
  'full-body': 'Full Body',
  'upper-lower': 'Upper / Lower',
  'push-pull-legs': 'Push / Pull / Legs',
  'any': 'Best for me',
};

const GENERATING_MESSAGES = [
  'Building your personalized plan... this usually takes about 5-10 seconds.',
  'Analyzing your training profile…',
  'Designing your periodized split…',
  'Writing your 8-week program…',
  'Adding week-by-week progression…',
];

export function ProfileSummaryCard({ profile, onGenerate, generating, generatingIdx, error }: Props) {
  const goalLabels = profile.goals
    .map((g) => GOAL_LABELS[g] ?? g)
    .join(' · ');

  const showPriorityMuscles = profile.priorityMuscles && profile.priorityMuscles.length > 0
    && !(profile.priorityMuscles.length === 1 && /balanced/i.test(profile.priorityMuscles[0]));

  const showProgramStyle = profile.programStyle && profile.programStyle !== 'any';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Your profile is ready</h1>
        <p className="mt-2 text-slate-400">
          Review your profile below, then generate your personalised 8-week program.
        </p>
      </div>

      {/* AI Summary card */}
      <div className="rounded-2xl border border-brand-500/30 bg-brand-900/20 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-brand-400" />
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">
            AI Profile Summary
          </p>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed">{profile.aiSummary}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-3">
          <Dumbbell size={16} className="text-brand-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Goal</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight truncate">{goalLabels}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-3">
          <Calendar size={16} className="text-brand-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Schedule</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight">
              {profile.daysPerWeek}×/week · {profile.sessionDurationMinutes} min
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-3">
          <Wrench size={16} className="text-brand-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Equipment</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight truncate">
              {profile.equipment.length > 0
                ? profile.equipment.slice(0, 2).map(formatLabel).join(', ')
                : 'Full Gym'}
              {profile.equipment.length > 2 && ` +${profile.equipment.length - 2} more`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-3">
          <Dumbbell size={16} className="text-brand-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Experience</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight">
              {profile.trainingAgeYears === 0
                ? 'Beginner'
                : profile.trainingAgeYears <= 2
                  ? `${profile.trainingAgeYears} yr(s) lifting`
                  : `${profile.trainingAgeYears} yrs lifting`}
            </p>
          </div>
        </div>
      </div>

      {/* Priority muscles */}
      {showPriorityMuscles && (
        <div className="flex items-start gap-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-3">
          <Target size={16} className="text-brand-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Priority Muscles</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.priorityMuscles!.map((m) => (
                <span
                  key={m}
                  className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-500/15 text-brand-300 border border-brand-500/30 capitalize"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Program style preference */}
      {showProgramStyle && (
        <div className="flex items-center gap-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-3">
          <LayoutGrid size={16} className="text-brand-400 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Preferred Split</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight">
              {SPLIT_LABELS[profile.programStyle!] ?? profile.programStyle}
            </p>
          </div>
        </div>
      )}

      {/* Injury notice */}
      {profile.injuries.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-900/20 border border-amber-800/40 px-4 py-3">
          <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300">
            Limitations noted: {profile.injuries.join(', ')}. Your program will be adjusted accordingly.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button
        onClick={onGenerate}
        disabled={generating}
        fullWidth
        size="lg"
      >
        {generating ? (
          <span className="flex items-center gap-2.5">
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
            <span>{GENERATING_MESSAGES[generatingIdx]}</span>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles size={18} />
            Generate My 8-Week Program
          </span>
        )}
      </Button>

      <p className="text-center text-xs text-slate-500">
        Your program is generated by AI and can be changed anytime from the Programs tab.
      </p>
    </div>
  );
}
