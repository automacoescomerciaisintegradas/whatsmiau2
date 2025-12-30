import { useState } from 'react'
import { Search, Plus, Filter, MoreVertical, Mail, Phone, Tag, Edit, Trash2, Upload, Download, X } from 'lucide-react'

const mockContacts = [
    { id: 1, name: 'João Silva', phone: '+55 11 99999-9999', email: 'joao@email.com', tags: ['Lead', 'VIP'], createdAt: '2024-01-15' },
    { id: 2, name: 'Maria Santos', phone: '+55 11 88888-8888', email: 'maria@email.com', tags: ['Cliente'], createdAt: '2024-01-14' },
    { id: 3, name: 'Carlos Oliveira', phone: '+55 11 77777-7777', email: 'carlos@email.com', tags: ['Lead'], createdAt: '2024-01-13' },
    { id: 4, name: 'Ana Costa', phone: '+55 11 66666-6666', email: 'ana@email.com', tags: ['Cliente', 'VIP'], createdAt: '2024-01-12' },
    { id: 5, name: 'Pedro Souza', phone: '+55 11 55555-5555', email: 'pedro@email.com', tags: ['Prospect'], createdAt: '2024-01-11' },
]

export default function Contacts() {
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)

    const filteredContacts = mockContacts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.email.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Contatos</h1>
                    <p className="text-[var(--text-muted)]">Gerencie seus leads e clientes</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="btn btn-secondary">
                        <Upload className="w-4 h-4" />
                        Importar
                    </button>
                    <button className="btn btn-secondary">
                        <Download className="w-4 h-4" />
                        Exportar
                    </button>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">
                        <Plus className="w-4 h-4" />
                        Novo Contato
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="card p-4">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nome, telefone ou email..."
                            className="w-full pl-10"
                        />
                    </div>
                    <button className="btn btn-secondary">
                        <Filter className="w-4 h-4" />
                        Filtros
                    </button>
                </div>
            </div>

            {/* Contacts Table */}
            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Telefone</th>
                            <th>Email</th>
                            <th>Tags</th>
                            <th>Criado em</th>
                            <th className="w-20">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredContacts.map((contact) => (
                            <tr key={contact.id}>
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div className="avatar avatar-sm">{contact.name.charAt(0)}</div>
                                        <span className="font-medium">{contact.name}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                        <Phone className="w-4 h-4" />
                                        {contact.phone}
                                    </div>
                                </td>
                                <td>
                                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                        <Mail className="w-4 h-4" />
                                        {contact.email}
                                    </div>
                                </td>
                                <td>
                                    <div className="flex gap-1 flex-wrap">
                                        {contact.tags.map((tag, i) => (
                                            <span key={i} className="badge badge-primary">{tag}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="text-[var(--text-muted)]">{contact.createdAt}</td>
                                <td>
                                    <div className="flex items-center gap-1">
                                        <button className="btn btn-ghost p-2">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button className="btn btn-ghost p-2 text-red-400 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="font-semibold text-lg">Novo Contato</h3>
                            <button onClick={() => setShowModal(false)} className="btn btn-ghost p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="modal-body space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Nome</label>
                                <input type="text" placeholder="Nome completo" className="w-full" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Telefone</label>
                                <input type="text" placeholder="+55 11 99999-9999" className="w-full" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Email</label>
                                <input type="email" placeholder="email@exemplo.com" className="w-full" />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
                            <button className="btn btn-primary">Salvar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
