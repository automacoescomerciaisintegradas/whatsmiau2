import { Plus, GripVertical, MoreVertical, User } from 'lucide-react'

const columns = [
    {
        id: 'lead',
        title: 'Leads',
        color: 'bg-blue-500',
        cards: [
            { id: 1, name: 'João Silva', phone: '+55 11 99999-9999', value: 'R$ 2.500' },
            { id: 2, name: 'Maria Santos', phone: '+55 11 88888-8888', value: 'R$ 1.800' },
        ]
    },
    {
        id: 'contact',
        title: 'Contato',
        color: 'bg-yellow-500',
        cards: [
            { id: 3, name: 'Carlos Oliveira', phone: '+55 11 77777-7777', value: 'R$ 5.000' },
        ]
    },
    {
        id: 'proposal',
        title: 'Proposta',
        color: 'bg-purple-500',
        cards: [
            { id: 4, name: 'Ana Costa', phone: '+55 11 66666-6666', value: 'R$ 3.200' },
            { id: 5, name: 'Pedro Souza', phone: '+55 11 55555-5555', value: 'R$ 4.100' },
        ]
    },
    {
        id: 'closed',
        title: 'Fechado',
        color: 'bg-green-500',
        cards: [
            { id: 6, name: 'Lucas Lima', phone: '+55 11 44444-4444', value: 'R$ 8.500' },
        ]
    },
]

export default function Kanban() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Kanban</h1>
                    <p className="text-[var(--text-muted)]">Visualize e gerencie seus leads</p>
                </div>
                <button className="btn btn-primary">
                    <Plus className="w-4 h-4" />
                    Novo Lead
                </button>
            </div>

            {/* Kanban Board */}
            <div className="flex gap-4 overflow-x-auto pb-4">
                {columns.map((column) => (
                    <div key={column.id} className="kanban-column min-w-[300px] flex-shrink-0">
                        {/* Column Header */}
                        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--surface)]">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                                <h3 className="font-semibold">{column.title}</h3>
                                <span className="text-sm text-[var(--text-muted)]">({column.cards.length})</span>
                            </div>
                            <button className="btn btn-ghost p-1">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Cards */}
                        <div className="p-2 space-y-2">
                            {column.cards.map((card) => (
                                <div key={card.id} className="kanban-card group">
                                    <div className="flex items-start gap-3">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                                            <GripVertical className="w-4 h-4 text-[var(--text-muted)]" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium">{card.name}</span>
                                                <button className="btn btn-ghost p-1 opacity-0 group-hover:opacity-100">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-sm text-[var(--text-muted)] mb-2">{card.phone}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-green-500">{card.value}</span>
                                                <div className="avatar avatar-sm">
                                                    <User className="w-3 h-3" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Add Column */}
                <div className="min-w-[300px] flex-shrink-0">
                    <button className="w-full h-32 border-2 border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[var(--primary)] transition-colors">
                        <Plus className="w-6 h-6 text-[var(--text-muted)]" />
                        <span className="text-[var(--text-muted)]">Adicionar coluna</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
