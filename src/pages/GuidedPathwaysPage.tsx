import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface Pathway {
  id: string;
  title: string;
  summary: string;
  firstStep: string;
  nextActionLabel: string;
  nextRoute: string;
}

const PATHWAYS: Pathway[] = [
  {
    id: 'healthier',
    title: 'Get Healthier',
    summary: 'Build simple weekly habits for movement, sleep, and recovery.',
    firstStep: 'Start with 3 short workouts this week and one 10-minute walk after meals.',
    nextActionLabel: 'Start with beginner workouts',
    nextRoute: '/programs',
  },
  {
    id: 'weight-loss',
    title: 'Lose Weight',
    summary: 'Use realistic training and nutrition habits, not extreme plans.',
    firstStep: 'Begin with consistent meals and a sustainable calorie target.',
    nextActionLabel: 'Start a nutrition plan',
    nextRoute: '/nutrition',
  },
  {
    id: 'muscle',
    title: 'Gain Muscle',
    summary: 'Progressive strength training and protein-focused meals.',
    firstStep: 'Pick a guided training plan and stay consistent for 4-8 weeks.',
    nextActionLabel: 'Choose a muscle-focused program',
    nextRoute: '/programs',
  },
  {
    id: 'energy',
    title: 'Improve Energy',
    summary: 'Combine low-stress movement with better recovery patterns.',
    firstStep: 'Start with moderate training and avoid all-out sessions early on.',
    nextActionLabel: 'Open quick, low-stress training',
    nextRoute: '/train',
  },
  {
    id: 'busy',
    title: 'Stay Active While Busy',
    summary: 'Short sessions you can complete in 20-30 minutes.',
    firstStep: 'Use quick logs and simple sessions on your busiest days.',
    nextActionLabel: 'Start a quick session',
    nextRoute: '/workout/quick',
  },
  {
    id: 'no-gym',
    title: 'No Gym / On-the-Road',
    summary: 'Bodyweight and minimal-equipment structure for travel or no gym access.',
    firstStep: 'Prioritize bodyweight sessions, walking, and consistency over complexity.',
    nextActionLabel: 'Open no-gym training flow',
    nextRoute: '/train',
  },
  {
    id: 'consistency',
    title: 'Build Consistency First',
    summary: 'Lower pressure, easier wins, and steady momentum.',
    firstStep: 'Set a weekly minimum you can actually sustain, then build from there.',
    nextActionLabel: 'Start with one guided workout',
    nextRoute: '/train',
  },
];

export function GuidedPathwaysPage() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <TopBar title="Guided Pathways" showBack />
      <div className="px-4 pt-4 pb-6 space-y-3">
        <Card className="border-brand-400/30 bg-brand-50/50 dark:bg-brand-900/15">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Not sure where to start?</p>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Pick a pathway that matches your real life. Omnexus will keep things simple first, then add depth as you progress.
          </p>
        </Card>

        {PATHWAYS.map((pathway) => (
          <Card key={pathway.id}>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{pathway.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{pathway.summary}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
              <span className="font-semibold">First step:</span> {pathway.firstStep}
            </p>
            <Button
              className="mt-3"
              size="sm"
              onClick={() => navigate(pathway.nextRoute)}
            >
              {pathway.nextActionLabel}
            </Button>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
