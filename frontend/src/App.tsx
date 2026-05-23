import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@components/layout/MainLayout'
import { Dashboard } from '@features/dashboard/Dashboard'
import { LandingPage } from '@features/landing/LandingPage'
import LoginPage from '@features/auth/LoginPage'
import RegisterPage from '@features/auth/RegisterPage'
import ProtectedRoute from '@components/ProtectedRoute'
import './App.css'

// Placeholder components for other routes
const Placeholder = ({ title }: { title: string }) => (
  <div style={{ padding: '20px' }}>
    <h1 style={{ marginBottom: '20px' }}>{title}</h1>
    <p style={{ color: 'var(--text-secondary)' }}>Esta página está em desenvolvimento...</p>
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas de autenticação - sem layout principal */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Landing Page Cinematográfica */}
        <Route path="/" element={<LandingPage />} />

        {/* Management Interface */}
        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tickets" element={<Placeholder title="Tickets (Conversas)" />} />
          <Route path="/kanban" element={<Placeholder title="Kanban" />} />
          <Route path="/contacts" element={<Placeholder title="Contatos (CRM)" />} />
          <Route path="/internal-chat" element={<Placeholder title="Chat Interno" />} />
          <Route path="/flows" element={<Placeholder title="Fluxos de Automação" />} />
          <Route path="/ai-agents" element={<Placeholder title="Agentes de IA" />} />
          <Route path="/campaigns" element={<Placeholder title="Campanhas" />} />
          <Route path="/schedules" element={<Placeholder title="Agendamentos" />} />
          <Route path="/sales" element={<Placeholder title="Vendas & Pipeline" />} />
          <Route path="/catalog" element={<Placeholder title="Catálogo de Produtos" />} />
          <Route path="/store" element={<Placeholder title="Minha Loja" />} />
          <Route path="/reports" element={<Placeholder title="Relatórios & Analytics" />} />
          <Route path="/connections" element={<Placeholder title="Conexões (WhatsApp, API)" />} />
          <Route path="/queues" element={<Placeholder title="Filas & Departamentos" />} />
          <Route path="/tags" element={<Placeholder title="Tags & Categorias" />} />
          <Route path="/settings" element={<Placeholder title="Configurações do Sistema" />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
