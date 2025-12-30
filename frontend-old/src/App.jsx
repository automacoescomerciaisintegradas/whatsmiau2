import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Tickets from './pages/Tickets'
import Contacts from './pages/Contacts'
import Connections from './pages/Connections'
import Kanban from './pages/Kanban'
import Queues from './pages/Queues'
import Tags from './pages/Tags'
import Campaigns from './pages/Campaigns'
import Schedules from './pages/Schedules'
import Sales from './pages/Sales'
import Catalog from './pages/Catalog'
import Chatbot from './pages/Chatbot'
import AIAgents from './pages/AIAgents'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Login from './pages/Login'
import HeroDemo from './pages/HeroDemo'
import { useAuthStore } from './store/authStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/tickets" element={<Tickets />} />
                    <Route path="/contacts" element={<Contacts />} />
                    <Route path="/connections" element={<Connections />} />
                    <Route path="/kanban" element={<Kanban />} />
                    <Route path="/queues" element={<Queues />} />
                    <Route path="/tags" element={<Tags />} />
                    <Route path="/campaigns" element={<Campaigns />} />
                    <Route path="/schedules" element={<Schedules />} />
                    <Route path="/sales" element={<Sales />} />
                    <Route path="/catalog" element={<Catalog />} />
                    <Route path="/chatbot" element={<Chatbot />} />
                    <Route path="/ai-agents" element={<AIAgents />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/hero-demo" element={<HeroDemo />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
