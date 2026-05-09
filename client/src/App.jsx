import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EmailProvider } from './context/EmailContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Home from './pages/homepage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Drafts from './pages/Drafts';
import Review from './pages/Review';
import Sent from './pages/Sent';
import Analytics from './pages/Analytics';
import ActivityDashboard from './pages/ActivityDashboard';
import Team from './pages/Team';
import Settings from './pages/Settings';
import EmailAccounts from './pages/EmailAccounts';
import InboxPage from './pages/InboxPage';
import EmailDetailPage from './pages/EmailDetailPage';
import EmailComposePage from './pages/Compose';

const RouteLoading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <RouteLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <RouteLoading />;
  }

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <PublicRoute>
        <Home />
      </PublicRoute>
    ),
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <Register />
      </PublicRoute>
    ),
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <EmailProvider>
          <Layout />
        </EmailProvider>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/app/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'inbox',
        element: <InboxPage />,
      },
      {
        path: 'compose',
        element: <EmailComposePage />,
      },
      {
        path: 'email/:id',
        element: <EmailDetailPage />,
      },
      {
        path: 'email/:id/reply',
        element: <EmailComposePage />,
      },
      {
        path: 'email/:id/forward',
        element: <EmailComposePage />,
      },
      {
        path: 'accounts',
        element: <EmailAccounts />,
      },
      {
        path: 'drafts',
        element: <Drafts />,
      },
      {
        path: 'review',
        element: <Review />,
      },
      {
        path: 'sent',
        element: <Sent />,
      },
      {
        path: 'team',
        element: <Team />,
      },
      {
        path: 'analytics',
        element: <Analytics />,
      },
      {
        path: 'activity',
        element: <ActivityDashboard />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '14px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
