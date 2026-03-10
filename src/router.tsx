import { createBrowserRouter, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useApp } from './store/AppContext'
import { setUser, setCustomPrograms, getCustomPrograms, getGuestProfile } from './utils/localStorage'
import { fetchCustomPrograms, fetchHistory, fetchLearningProgress } from './lib/dbHydration'
import { runMigrationIfNeeded } from './lib/dataMigration'
import { CookieConsent } from './components/ui/CookieConsent'
import { GuestBanner } from './components/ui/GuestBanner'
import { AppTutorial } from './components/onboarding/AppTutorial'
import { resumeIfNeeded, getGenerationState } from './lib/programGeneration'
import { RouterErrorBoundary } from './components/ui/RouterErrorBoundary'
import { ensureProfileUser } from './lib/profileRecovery'
import { shouldAutoShowTutorial } from './lib/tutorial'

// Module-level set — survives component unmount/remount cycles.
// Prevents repeated 406 profile queries for users who have a Supabase session
// but no profiles row (e.g. mid-onboarding, broken account).
const sessionsWithNoProfile = new Set<string>()

// ─── Critical-path pages — kept eager (auth flow, tiny footprint) ─────────────

import { OnboardingPage } from './pages/OnboardingPage'
import { LoginPage } from './pages/LoginPage'
import { GuestSetupPage } from './pages/GuestSetupPage'
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'

// ─── Feature pages — lazy-loaded to reduce initial bundle size ────────────────

const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ProgramsPage = lazy(() => import('./pages/ProgramsPage').then(m => ({ default: m.ProgramsPage })))
const ProgramDetailPage = lazy(() => import('./pages/ProgramDetailPage').then(m => ({ default: m.ProgramDetailPage })))
const ExerciseLibraryPage = lazy(() => import('./pages/ExerciseLibraryPage').then(m => ({ default: m.ExerciseLibraryPage })))
const ExerciseDetailPage = lazy(() => import('./pages/ExerciseDetailPage').then(m => ({ default: m.ExerciseDetailPage })))
const ActiveWorkoutPage = lazy(() => import('./pages/ActiveWorkoutPage').then(m => ({ default: m.ActiveWorkoutPage })))
const HistoryPage = lazy(() => import('./pages/HistoryPage').then(m => ({ default: m.HistoryPage })))
const LearnPage = lazy(() => import('./pages/LearnPage').then(m => ({ default: m.LearnPage })))
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage').then(m => ({ default: m.CourseDetailPage })))
const LessonPage = lazy(() => import('./pages/LessonPage').then(m => ({ default: m.LessonPage })))
const InsightsPage = lazy(() => import('./pages/InsightsPage').then(m => ({ default: m.InsightsPage })))
const AskPage = lazy(() => import('./pages/AskPage').then(m => ({ default: m.AskPage })))
const ProgramBuilderPage = lazy(() => import('./pages/ProgramBuilderPage').then(m => ({ default: m.ProgramBuilderPage })))
const AiProgramGenerationPage = lazy(() => import('./pages/AiProgramGenerationPage').then(m => ({ default: m.AiProgramGenerationPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const ActivityFeedPage = lazy(() => import('./pages/ActivityFeedPage').then(m => ({ default: m.ActivityFeedPage })))
const FriendsPage = lazy(() => import('./pages/FriendsPage').then(m => ({ default: m.FriendsPage })))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })))
const ChallengesPage = lazy(() => import('./pages/ChallengesPage').then(m => ({ default: m.ChallengesPage })))
const NutritionPage = lazy(() => import('./pages/NutritionPage').then(m => ({ default: m.NutritionPage })))
const MeasurementsPage = lazy(() => import('./pages/MeasurementsPage').then(m => ({ default: m.MeasurementsPage })))
const QuickLogPage = lazy(() => import('./pages/QuickLogPage').then(m => ({ default: m.QuickLogPage })))
const PlateCalculatorPage = lazy(() => import('./pages/PlateCalculatorPage').then(m => ({ default: m.PlateCalculatorPage })))
const PreWorkoutBriefingPage = lazy(() => import('./pages/PreWorkoutBriefingPage').then(m => ({ default: m.PreWorkoutBriefingPage })))
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage').then(m => ({ default: m.SubscriptionPage })))
const TrainPage = lazy(() => import('./pages/TrainPage').then(m => ({ default: m.TrainPage })))
const CommunityPage = lazy(() => import('./pages/CommunityPage').then(m => ({ default: m.CommunityPage })))
const HelpPage = lazy(() => import('./pages/HelpPage').then(m => ({ default: m.HelpPage })))
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })))
const GuidedPathwaysPage = lazy(() => import('./pages/GuidedPathwaysPage').then(m => ({ default: m.GuidedPathwaysPage })))

function RootLayout() {
  return (
    <>
      <Outlet />
      <CookieConsent />
    </>
  )
}

function LoadingScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-brand-500" />
    </div>
  )
}

/**
 * Allows both authenticated Supabase users AND local guest users.
 * Supabase users get full cloud hydration; guests load from localStorage only.
 * Community routes use AuthOnlyGuard instead.
 */
function GuestOrAuthGuard() {
  const { session, loading: authLoading } = useAuth()
  const { state, dispatch } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [syncing, setSyncing] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const hydratedRef = useRef(false)

  useEffect(() => {
    if (location.pathname !== '/' && showTutorial) {
      setShowTutorial(false)
    }
  }, [location.pathname, showTutorial])

  useEffect(() => {
    if (session || authLoading || state.user) return

    const guest = getGuestProfile()
    if (guest) {
      dispatch({ type: 'SET_USER', payload: guest })
    }
  }, [session, authLoading, state.user, dispatch])

  useEffect(() => {
    // Signed-out authenticated user — clear state
    if (!session && !authLoading && state.user && !state.user.isGuest) {
      dispatch({ type: 'CLEAR_USER' })
      hydratedRef.current = false
      return
    }

    // Guest already loaded — nothing to do
    if (!session && !authLoading && state.user?.isGuest) return

    // Supabase session hydration
    if (!session || authLoading || hydratedRef.current) return

    // If we already know this session has no profile row, skip the 406 query
    // and go straight to onboarding. The module-level Set survives remounts.
    // BUT: skip this redirect if state.user is already set — the user just
    // completed onboarding and the dispatch has already populated the profile.
    if (sessionsWithNoProfile.has(session.user.id) && !state.user) {
      navigate('/onboarding', { replace: true })
      return
    }

    async function hydrate() {
      if (!session) return
      setSyncing(true)
      try {
        let user = state.user

        if (!user || user.isGuest) {
          user = await ensureProfileUser(session)

          if (!user) {
            // Remember this session has no profile so remounts skip the 406 query
            sessionsWithNoProfile.add(session.user.id)
            hydratedRef.current = true
            navigate('/onboarding', { replace: true })
            return
          }

          // Profile found — clear stale cache entry if present
          sessionsWithNoProfile.delete(session.user.id)

          setUser(user)
          dispatch({ type: 'SET_USER', payload: user })
        }

        await runMigrationIfNeeded(user.id)

        const [history, learningProgress, customPrograms] = await Promise.all([
          fetchHistory(user.id),
          fetchLearningProgress(user.id),
          fetchCustomPrograms(user.id),
        ])

        dispatch({ type: 'SET_HISTORY', payload: history })
        if (learningProgress) {
          dispatch({ type: 'SET_LEARNING_PROGRESS', payload: learningProgress })
        }
        // Safety net: if generation was 'ready' but the Supabase upsert hadn't
        // landed yet, the fetch returns [] and would wipe the locally-stored program.
        // Preserve any locally-stored generated program that Supabase doesn't have yet.
        const genState = getGenerationState();
        if (genState?.userId === user.id && genState.status === 'ready') {
          const local = getCustomPrograms();
          const localGen = local.find(p => p.id === genState.programId);
          if (localGen && !customPrograms.some(p => p.id === genState.programId)) {
            setCustomPrograms([...customPrograms, localGen]);
          } else {
            setCustomPrograms(customPrograms);
          }
        } else {
          setCustomPrograms(customPrograms);
        }

        // Resume background program generation if the page was reloaded mid-generation
        resumeIfNeeded(user.id).catch(() => {})

        // Show tutorial once on first login after account creation
        if (shouldAutoShowTutorial(user)) {
          setShowTutorial(true)
        }

        hydratedRef.current = true
      } catch (err) {
        console.error('[GuestOrAuthGuard] Hydration failed:', err)
        hydratedRef.current = true
      } finally {
        setSyncing(false)
      }
    }

    hydrate()
  }, [session, authLoading, dispatch, navigate])

  if (authLoading || syncing) return <LoadingScreen />

  // No Supabase session — check for guest profile
  if (!session) {
    const guest = getGuestProfile()
    if (guest) {
      return (
        <>
          <GuestBanner />
          <div className="pt-9">
            <Suspense fallback={<LoadingScreen />}>
              <Outlet />
            </Suspense>
          </div>
        </>
      )
    }
    return <Navigate to="/login" replace />
  }

  if (!state.user) return <LoadingScreen />
  return (
    <>
      <Suspense fallback={<LoadingScreen />}>
        <Outlet />
      </Suspense>
      {showTutorial && location.pathname === '/' && (
        <AppTutorial onDismiss={() => setShowTutorial(false)} />
      )}
    </>
  )
}

/**
 * Hard auth required — community features need a real Supabase account.
 * Guests see an upgrade prompt instead of a broken page.
 *
 * When a user navigates directly to a community route (e.g. bookmark or E2E
 * test goto()), GuestOrAuthGuard never mounts, so state.user is never
 * populated.  This guard therefore runs its own lightweight profile fetch
 * so the page renders instead of showing a permanent loading screen.
 */
function AuthOnlyGuard() {
  const { session, loading } = useAuth()
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    // Only hydrate when we have a session but no user yet (direct navigation)
    if (!session || loading || state.user) return

    if (sessionsWithNoProfile.has(session.user.id)) {
      navigate('/onboarding', { replace: true })
      return
    }

    async function hydrate() {
      if (!session) return
      setSyncing(true)
      try {
        const user = await ensureProfileUser(session)
        if (!user) {
          sessionsWithNoProfile.add(session.user.id)
          navigate('/onboarding', { replace: true })
          return
        }

        sessionsWithNoProfile.delete(session.user.id)
        dispatch({
          type: 'SET_USER',
          payload: user,
        })
      } catch (err) {
        console.error('[AuthOnlyGuard] Profile fetch failed:', err)
      } finally {
        setSyncing(false)
      }
    }

    hydrate()
  }, [session, loading, state.user, dispatch, navigate])

  if (loading || syncing) return <LoadingScreen />

  if (!session) {
    return (
      <div className="flex flex-col min-h-dvh bg-slate-50 dark:bg-slate-950 items-center justify-center px-6 text-center gap-4">
        <span className="text-4xl">👥</span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Community requires an account
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">
          Create a free account to connect with friends, compete on the leaderboard, and join challenges.
        </p>
        <a
          href="/onboarding"
          className="mt-2 inline-block rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          Create Free Account
        </a>
        <a href="/login" className="text-sm text-brand-400 hover:text-brand-300">
          Already have an account? Sign in
        </a>
      </div>
    )
  }

  if (!state.user) return <LoadingScreen />
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  )
}

function OnboardingGuard() {
  const { session, loading } = useAuth()
  const { state } = useApp()
  if (loading) return <LoadingScreen />
  // Only redirect away if the user actually has a loaded profile in state.
  // A session without a profile row (new device / broken onboarding) should
  // be allowed to complete onboarding instead of bouncing back to /.
  if (session && state.user && !state.user.isGuest) return <Navigate to="/" replace />
  return <OnboardingPage />
}

function LoginGuard() {
  const { session, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (session) return <Navigate to="/" replace />
  return <LoginPage />
}

function GuestGuard() {
  const { session, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (session) return <Navigate to="/" replace />
  if (getGuestProfile()) return <Navigate to="/" replace />
  return <GuestSetupPage />
}

export const router = createBrowserRouter([
  {
    errorElement: <RouterErrorBoundary />,
    element: <RootLayout />,
    children: [
      { path: '/onboarding', element: <OnboardingGuard /> },
      { path: '/login', element: <LoginGuard /> },
      { path: '/guest', element: <GuestGuard /> },
      { path: '/privacy', element: <PrivacyPolicyPage /> },
      { path: '/auth/callback', element: <AuthCallbackPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      // Public marketing landing page — no auth required
      { path: '/landing', element: <Suspense fallback={<LoadingScreen />}><LandingPage /></Suspense> },
      {
        // Accessible to guests and authenticated users
        element: <GuestOrAuthGuard />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/programs', element: <ProgramsPage /> },
          { path: '/programs/ai/new', element: <AiProgramGenerationPage /> },
          { path: '/programs/builder', element: <ProgramBuilderPage /> },
          { path: '/programs/:programId', element: <ProgramDetailPage /> },
          { path: '/library', element: <ExerciseLibraryPage /> },
          { path: '/library/:exerciseId', element: <ExerciseDetailPage /> },
          { path: '/workout/active', element: <ActiveWorkoutPage /> },
          { path: '/history', element: <HistoryPage /> },
          { path: '/learn', element: <LearnPage /> },
          { path: '/learn/:courseId', element: <CourseDetailPage /> },
          { path: '/learn/:courseId/:moduleId', element: <LessonPage /> },
          { path: '/insights', element: <InsightsPage /> },
          { path: '/ask', element: <AskPage /> },
          { path: '/nutrition', element: <NutritionPage /> },
          { path: '/measurements', element: <MeasurementsPage /> },
          { path: '/workout/quick', element: <QuickLogPage /> },
          { path: '/tools/plate-calculator', element: <PlateCalculatorPage /> },
          { path: '/briefing', element: <PreWorkoutBriefingPage /> },
          { path: '/subscription', element: <SubscriptionPage /> },
          { path: '/train', element: <TrainPage /> },
          { path: '/help', element: <HelpPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/guided-pathways', element: <GuidedPathwaysPage /> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
      {
        // Community — full Supabase account required
        element: <AuthOnlyGuard />,
        children: [
          // /community is the hub; /feed, /leaderboard, /challenges, /friends are sub-pages
          // All are AuthOnly so guests see a prompt to create an account
          { path: '/community', element: <CommunityPage /> },
          { path: '/feed', element: <ActivityFeedPage /> },
          { path: '/friends', element: <FriendsPage /> },
          { path: '/leaderboard', element: <LeaderboardPage /> },
          { path: '/challenges', element: <ChallengesPage /> },
        ],
      },
    ],
  },
])
