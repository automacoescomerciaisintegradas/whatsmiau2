import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
    Users,
    MessageSquare,
    Clock,
    DollarSign,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    Wifi,
    WifiOff,
    MoreVertical,
    Loader2,
    RefreshCw,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { instanceService, statusService, groupService } from '../services/api'

// Chart data (mock for now - can be replaced with real data later)
const chartData = [
    { name: 'Seg', atendimentos: 40, leads: 24 },
    { name: 'Ter', atendimentos: 30, leads: 18 },
    { name: 'Qua', atendimentos: 45, leads: 29 },
    { name: 'Qui', atendimentos: 50, leads: 35 },
    { name: 'Sex', atendimentos: 65, leads: 42 },
    { name: 'Sáb', atendimentos: 35, leads: 22 },
    { name: 'Dom', atendimentos: 20, leads: 12 },
]

const pieData = [
    { name: 'Conectados', value: 65, color: '#22c55e' },
    { name: 'Desconectados', value: 25, color: '#ef4444' },
    { name: 'Aguardando', value: 10, color: '#f59e0b' },
]

export default function Dashboard() {
    // Fetch API status
    const { data: apiStatus, isLoading: loadingStatus } = useQuery({
        queryKey: ['apiStatus'],
        queryFn: statusService.getApiStatus,
        refetchInterval: 10000,
        retry: 1,
    })

    // Fetch instances
    const { data: instances, isLoading: loadingInstances, refetch: refetchInstances } = useQuery({
        queryKey: ['instances'],
        queryFn: async () => {
            try {
                return await instanceService.list() || []
            } catch {
                return []
            }
        },
        refetchInterval: 10000,
    })

    // Fetch groups
    const { data: groupsData } = useQuery({
        queryKey: ['groups'],
        queryFn: async () => {
            try {
                return await groupService.list()
            } catch {
                return { groups: [] }
            }
        },
        refetchInterval: 30000,
    })

    // Calculate stats
    const connectedInstances = instances?.filter(i =>
        i.connectionStatus === 'open' || i.state === 'connected' || i.status === 'connected'
    ).length || 0

    const totalInstances = instances?.length || 0
    const totalGroups = groupsData?.groups?.length || 0

    const stats = [
        {
            label: 'Instâncias Conectadas',
            value: `${connectedInstances}/${totalInstances}`,
            icon: Wifi,
            color: 'bg-green-500',
            change: connectedInstances > 0 ? '+' + connectedInstances : '0',
            up: connectedInstances > 0
        },
        {
            label: 'Grupos',
            value: totalGroups.toString(),
            icon: Users,
            color: 'bg-blue-500',
            change: totalGroups > 0 ? '+' + totalGroups : '0',
            up: totalGroups > 0
        },
        {
            label: 'Status API',
            value: apiStatus?.state || 'Offline',
            icon: MessageSquare,
            color: apiStatus?.state === 'open' ? 'bg-purple-500' : 'bg-gray-500',
            change: apiStatus?.state === 'open' ? 'Online' : 'Offline',
            up: apiStatus?.state === 'open'
        },
        {
            label: 'Instância Padrão',
            value: apiStatus?.instance || 'N/A',
            icon: Clock,
            color: 'bg-yellow-500',
            change: apiStatus?.success ? 'Ativa' : 'Inativa',
            up: apiStatus?.success
        },
    ]

    const isLoading = loadingStatus || loadingInstances

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-[var(--text-muted)]">Visão geral do seu sistema</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refetchInstances()}
                        className="btn btn-secondary"
                        disabled={isLoading}
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>
                    <select className="text-sm py-2 px-3">
                        <option>Últimos 7 dias</option>
                        <option>Últimos 30 dias</option>
                        <option>Este mês</option>
                    </select>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-card group hover:border-[var(--primary)] transition-colors">
                        <div className={`stat-icon ${stat.color}`}>
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            ) : (
                                <stat.icon className="w-6 h-6 text-white" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="stat-label">{stat.label}</p>
                            <div className="flex items-center gap-2">
                                <span className="stat-value text-xl">{stat.value}</span>
                                <span className={`text-sm flex items-center ${stat.up ? 'text-green-500' : 'text-red-500'}`}>
                                    {stat.up ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                                    {stat.change}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Area Chart */}
                <div className="card lg:col-span-2">
                    <div className="card-header flex items-center justify-between">
                        <h2 className="font-semibold">Atividade da Semana</h2>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[var(--primary)]" />
                                <span className="text-[var(--text-muted)]">Mensagens</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-[var(--text-muted)]">Contatos</span>
                            </div>
                        </div>
                    </div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorAtendimentos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="atendimentos"
                                    stroke="#6366f1"
                                    fillOpacity={1}
                                    fill="url(#colorAtendimentos)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="leads"
                                    stroke="#22c55e"
                                    fillOpacity={1}
                                    fill="url(#colorLeads)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Overview */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="font-semibold">Status das Conexões</h2>
                    </div>
                    <div className="card-body flex flex-col items-center">
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Conectados', value: connectedInstances || 1, color: '#22c55e' },
                                        { name: 'Desconectados', value: Math.max(0, totalInstances - connectedInstances) || 1, color: '#ef4444' },
                                    ]}
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill="#22c55e" />
                                    <Cell fill="#ef4444" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap justify-center gap-4 mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-sm text-[var(--text-muted)]">Conectados</span>
                                <span className="text-sm font-medium">{connectedInstances}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="text-sm text-[var(--text-muted)]">Desconectados</span>
                                <span className="text-sm font-medium">{totalInstances - connectedInstances}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Groups List */}
                <div className="card">
                    <div className="card-header flex items-center justify-between">
                        <h2 className="font-semibold">Grupos WhatsApp</h2>
                        <span className="badge badge-primary">{totalGroups} grupos</span>
                    </div>
                    <div className="divide-y divide-[var(--border)] max-h-[300px] overflow-y-auto">
                        {groupsData?.groups?.slice(0, 5).map((group, index) => (
                            <div key={index} className="p-4 flex items-center gap-3 hover:bg-[var(--surface-light)]/30 transition-colors">
                                <div className="avatar">
                                    {group.subject?.charAt(0) || 'G'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="font-medium text-sm block truncate">{group.subject || 'Grupo sem nome'}</span>
                                    <span className="text-xs text-[var(--text-muted)]">
                                        {group.size || group.participants?.length || 0} participantes
                                    </span>
                                </div>
                            </div>
                        )) || (
                                <div className="p-8 text-center text-[var(--text-muted)]">
                                    Nenhum grupo encontrado
                                </div>
                            )}
                    </div>
                </div>

                {/* Connections */}
                <div className="card">
                    <div className="card-header flex items-center justify-between">
                        <h2 className="font-semibold">Conexões WhatsApp</h2>
                        <Link to="/connections" className="text-sm text-[var(--primary)] flex items-center gap-1 hover:underline">
                            Gerenciar <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                        {instances?.slice(0, 4).map((instance, index) => {
                            const name = instance.instanceName || instance.name || instance.instance?.instanceName
                            const isConnected = instance.connectionStatus === 'open' || instance.state === 'connected'

                            return (
                                <div key={index} className="p-4 flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isConnected ? 'bg-green-500/20' : 'bg-red-500/20'
                                        }`}>
                                        {isConnected ? (
                                            <Wifi className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <WifiOff className="w-5 h-5 text-red-500" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{name}</p>
                                        <p className="text-sm text-[var(--text-muted)]">
                                            {instance.owner || instance.profileName || 'Sem número'}
                                        </p>
                                    </div>
                                    <span className={`badge ${isConnected ? 'badge-success' : 'badge-danger'}`}>
                                        {isConnected ? 'Conectado' : 'Desconectado'}
                                    </span>
                                </div>
                            )
                        }) || (
                                <div className="p-8 text-center text-[var(--text-muted)]">
                                    Nenhuma conexão encontrada
                                </div>
                            )}
                    </div>
                </div>
            </div>
        </div>
    )
}
