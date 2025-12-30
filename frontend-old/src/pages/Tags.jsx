import { Plus, Edit, Trash2 } from 'lucide-react'

const mockTags = [
    { id: 1, name: 'Lead', color: '#3b82f6', count: 45 },
    { id: 2, name: 'Cliente', color: '#22c55e', count: 123 },
    { id: 3, name: 'VIP', color: '#f59e0b', count: 12 },
    { id: 4, name: 'Prospect', color: '#8b5cf6', count: 34 },
    { id: 5, name: 'Inativo', color: '#ef4444', count: 8 },
]

export default function Tags() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Tags</h1>
                    <p className="text-[var(--text-muted)]">Organize seus contatos com etiquetas</p>
                </div>
                <button className="btn btn-primary"><Plus className="w-4 h-4" />Nova Tag</button>
            </div>

            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Cor</th>
                            <th>Nome</th>
                            <th>Contatos</th>
                            <th className="w-20">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockTags.map((tag) => (
                            <tr key={tag.id}>
                                <td><div className="w-6 h-6 rounded-full" style={{ backgroundColor: tag.color }} /></td>
                                <td className="font-medium">{tag.name}</td>
                                <td>{tag.count} contatos</td>
                                <td>
                                    <div className="flex gap-1">
                                        <button className="btn btn-ghost p-2"><Edit className="w-4 h-4" /></button>
                                        <button className="btn btn-ghost p-2 text-red-400"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
