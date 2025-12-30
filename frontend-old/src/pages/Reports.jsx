import { BarChart3, Users, MessageSquare, TrendingUp, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const weekData = [
    { name: 'Seg', atendimentos: 45, leads: 23 },
    { name: 'Ter', atendimentos: 52, leads: 28 },
    { name: 'Qua', atendimentos: 48, leads: 21 },
    { name: 'Qui', atendimentos: 61, leads: 35 },
    { name: 'Sex', atendimentos: 55, leads: 30 },
    { name: 'Sáb', atendimentos: 38, leads: 18 },
    { name: 'Dom', atendimentos: 22, leads: 10 },
]

export default function Reports() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Relatórios</h1>
                    <p className="text-[var(--text-muted)]">Análise detalhada do seu atendimento</p>
                </div>
                <div className="flex gap-2">
                    <select className="py-2 px-3">
                        <option>Últimos 7 dias</option>
                        <option>Últimos 30 dias</option>
                        <option>Este mês</option>
                    </select>
                    <button className="btn btn-secondary"><Download className="w-4 h-4" />Exportar</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="stat-card"><div className="stat-icon bg-blue-500"><Users className="w-6 h-6 text-white" /></div><div><p className="stat-label">Novos Leads</p><p className="stat-value">165</p></div></div>
                <div className="stat-card"><div className="stat-icon bg-purple-500"><MessageSquare className="w-6 h-6 text-white" /></div><div><p className="stat-label">Atendimentos</p><p className="stat-value">321</p></div></div>
                <div className="stat-card"><div className="stat-icon bg-green-500"><TrendingUp className="w-6 h-6 text-white" /></div><div><p className="stat-label">Taxa de Conversão</p><p className="stat-value">23%</p></div></div>
                <div className="stat-card"><div className="stat-icon bg-yellow-500"><BarChart3 className="w-6 h-6 text-white" /></div><div><p className="stat-label">Tempo Médio</p><p className="stat-value">4min</p></div></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <div className="card-header"><h2 className="font-semibold">Atendimentos por Dia</h2></div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={weekData}>
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                <Bar dataKey="atendimentos" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><h2 className="font-semibold">Leads por Dia</h2></div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={weekData}>
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                <Line type="monotone" dataKey="leads" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}
