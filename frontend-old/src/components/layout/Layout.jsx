import { NavLink, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    MessageSquare,
    Users,
    Wifi,
    Columns3,
    ListTree,
    Tag,
    Megaphone,
    CalendarClock,
    ShoppingCart,
    Package,
    Bot,
    Brain,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    Zap,
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'

const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/tickets', icon: MessageSquare, label: 'Atendimentos' },
    { path: '/contacts', icon: Users, label: 'Contatos' },
    { path: '/connections', icon: Wifi, label: 'Conexões' },
    { path: '/kanban', icon: Columns3, label: 'Kanban' },
    { path: '/queues', icon: ListTree, label: 'Filas' },
    { path: '/tags', icon: Tag, label: 'Tags' },
    { divider: true },
    { path: '/campaigns', icon: Megaphone, label: 'Campanhas' },
    { path: '/schedules', icon: CalendarClock, label: 'Agendamentos' },
    { path: '/chatbot', icon: Bot, label: 'Chatbot' },
    { path: '/ai-agents', icon: Brain, label: 'Agentes IA' },
    { divider: true },
    { path: '/sales', icon: ShoppingCart, label: 'Vendas' },
    { path: '/catalog', icon: Package, label: 'Catálogo' },
    { path: '/reports', icon: BarChart3, label: 'Relatórios' },
    { divider: true },
    { path: '/settings', icon: Settings, label: 'Configurações' },
]

export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const location = useLocation()
    const { user, logout } = useAuthStore()

    const handleLogout = () => {
        logout()
        window.location.href = '/login'
    }

    return (
        <div className="flex min-h-screen bg-[var(--background)]">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`sidebar ${sidebarOpen ? 'open' : ''} flex flex-col z-40 transition-transform duration-300`}
            >
                {/* Logo */}
                <div className="p-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-[var(--text)]">CRM Automação</h1>
                            <p className="text-xs text-[var(--text-muted)]">WhatsApp Premium</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 overflow-y-auto">
                    {menuItems.map((item, index) =>
                        item.divider ? (
                            <div key={index} className="h-px bg-[var(--border)] my-2 mx-4" />
                        ) : (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `sidebar-item ${isActive ? 'active' : ''}`
                                }
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </NavLink>
                        )
                    )}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-[var(--border)]">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="avatar">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{user?.name || 'Usuário'}</p>
                            <p className="text-xs text-[var(--text-muted)] truncate">{user?.email || 'admin@email.com'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full btn btn-ghost text-sm justify-start text-red-400 hover:bg-red-500/10"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content flex-1">
                {/* Mobile Header */}
                <div className="lg:hidden flex items-center justify-between mb-4 -mt-2">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="btn btn-ghost p-2"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold">CRM Automação</span>
                    </div>
                    <div className="w-10" />
                </div>

                {/* Page Content */}
                <div className="animate-fadeIn">{children}</div>
            </main>
        </div>
    )
}
