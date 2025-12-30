import { NavLink } from 'react-router-dom'
import {
    LayoutDashboard,
    MessageSquare,
    Users,
    Settings,
    Webhook,
    Link2,
    Bot,
    Zap,
    Megaphone,
    Calendar,
    Layers,
    ShoppingBag,
    Store,
    BarChart3,
    Split,
    Kanban,
    Tags,
    BadgeDollarSign
} from 'lucide-react'
import { clsx } from 'clsx'
import styles from './Sidebar.module.css'

const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Tickets', icon: MessageSquare, path: '/tickets' },
    { label: 'Kanban', icon: Kanban, path: '/kanban' },
    { label: 'Contatos', icon: Users, path: '/contacts' },
    { label: 'Chat Interno', icon: Split, path: '/internal-chat' },
    { label: 'Fluxos', icon: Zap, path: '/flows' },
    { label: 'Agentes de IA', icon: Bot, path: '/ai-agents' },
    { label: 'Campanhas', icon: Megaphone, path: '/campaigns' },
    { label: 'Agendamentos', icon: Calendar, path: '/schedules' },
    { label: 'Vendas', icon: BadgeDollarSign, path: '/sales' },
    { label: 'Catálogo', icon: ShoppingBag, path: '/catalog' },
    { label: 'Loja', icon: Store, path: '/store' },
    { label: 'Relatórios', icon: BarChart3, path: '/reports' },
    { label: 'Conexões', icon: Webhook, path: '/connections' },
    { label: 'Filas', icon: Layers, path: '/queues' },
    { label: 'Tags', icon: Tags, path: '/tags' },
    { label: 'Configurações', icon: Settings, path: '/settings' },
]

export const Sidebar = () => {
    return (
        <aside className={clsx(styles.sidebar, 'glass')}>
            <div className={styles.logo}>
                <div className={styles.logoIcon}>🎯</div>
                <span className={styles.logoText}>WhatsMiau2</span>
            </div>

            <nav className={styles.nav}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            clsx(styles.navItem, isActive && styles.active)
                        }
                    >
                        <item.icon size={20} className={styles.icon} />
                        <span className={styles.label}>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    )
}
