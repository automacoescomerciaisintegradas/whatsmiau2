import { Plus, Edit, Trash2, Users } from 'lucide-react'

const mockQueues = [
    { id: 1, name: 'Vendas', color: '#22c55e', users: 5, tickets: 23 },
    { id: 2, name: 'Suporte', color: '#3b82f6', users: 3, tickets: 15 },
    { id: 3, name: 'Financeiro', color: '#f59e0b', users: 2, tickets: 8 },
    { id: 4, name: 'Marketing', color: '#8b5cf6', users: 4, tickets: 12 },
]

export default function Queues() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Filas de Atendimento</h1>
                    <p className="text-[var(--text-muted)]">Organize seus atendentes em filas</p>
                </div>
                <button className="btn btn-primary"><Plus className="w-4 h-4" />Nova Fila</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockQueues.map((queue) => (
                    <div key={queue.id} className="card p-6 hover:border-[var(--primary)] transition-colors">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: queue.color + '20' }}>
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: queue.color }} />
                            </div>
                            <div className="flex gap-1">
                                <button className="btn btn-ghost p-2"><Edit className="w-4 h-4" /></button>
                                <button className="btn btn-ghost p-2 text-red-400"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <h3 className="font-semibold text-lg mb-4">{queue.name}</h3>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
                            <div className="text-center">
                                <p className="text-2xl font-bold">{queue.users}</p>
                                <p className="text-xs text-[var(--text-muted)]">Atendentes</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold">{queue.tickets}</p>
                                <p className="text-xs text-[var(--text-muted)]">Tickets</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
