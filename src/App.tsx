import { AppProvider } from './store/AppContext'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ToastContainer } from './components/ui/Toast'
import { GamificationNotifier } from './components/gamification/GamificationNotifier'
import { OfflineNotifier } from './components/ui/OfflineNotifier'

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <RouterProvider router={router} />
            <ToastContainer />
            <GamificationNotifier />
            <OfflineNotifier />
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
