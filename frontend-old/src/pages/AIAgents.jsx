import { Plus, Brain, Play, Pause, Edit, Trash2, Zap, MessageSquare } from 'lucide-react'

const mockAgents = [
    { id: 1, name: 'Assistente de Vendas', model: 'gpt-4o-mini', active: true, conversations: 234, queue: 'Vendas' },
    { id: 2, name: 'Suporte Técnico', model: 'gpt-4o', active: true, conversations: 156, queue: 'Suporte' },
    { id: 3, name: 'SDR Qualificação', model: 'gpt-4o-mini', active: false, conversations: 0, queue: 'Leads' },
]

export default function AIAgents() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Agentes de IA</h1>
                    <p className="text-[var(--text-muted)]">Configure agentes inteligentes com IA</p>
                </div>
                <button className="btn btn-primary"><Plus className="w-4 h-4" />Novo Agente</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockAgents.map((agent) => (
                    <div key={agent.id} className="card p-6 hover:border-[var(--primary)] transition-colors">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${agent.active ? 'gradient-primary' : 'bg-[var(--surface-light)]'}`}>
                                <Brain className={`w-6 h-6 ${agent.active ? 'text-white' : 'text-[var(--text-muted)]'}`} />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`badge ${agent.active ? 'badge-success' : 'badge-warning'}`}>
                                    {agent.active ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                        </div>

                        <h3 className="font-semibold text-lg mb-1">{agent.name}</h3>
                        <p className="text-sm text-[var(--text-muted)] mb-4">{agent.model}</p>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-1 text-sm">
                                <Zap className="w-4 h-4 text-[var(--primary)]" />
                                <span className="text-[var(--text-muted)]">{agent.queue}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                                <MessageSquare className="w-4 h-4 text-green-500" />
                                <span className="text-[var(--text-muted)]">{agent.conversations}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
                            <button className="btn btn-secondary flex-1">
                                <Edit className="w-4 h-4" />Editar
                            </button>
                            <button className={`btn ${agent.active ? 'btn-ghost text-yellow-500' : 'btn-primary'} p-2`}>
                                {agent.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
