import { Plus, DollarSign, ShoppingCart, TrendingUp, Eye } from 'lucide-react'

const mockSales = [
    { id: 1, contact: 'João Silva', total: 2500, status: 'paid', date: '2024-01-15', items: 3 },
    { id: 2, contact: 'Maria Santos', total: 1800, status: 'pending', date: '2024-01-14', items: 2 },
    { id: 3, contact: 'Carlos Oliveira', total: 5000, status: 'paid', date: '2024-01-13', items: 5 },
]

export default function Sales() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Vendas</h1>
                    <p className="text-[var(--text-muted)]">Gerencie suas vendas</p>
                </div>
                <button className="btn btn-primary"><Plus className="w-4 h-4" />Nova Venda</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stat-card">
                    <div className="stat-icon bg-green-500"><DollarSign className="w-6 h-6 text-white" /></div>
                    <div><p className="stat-label">Total Vendido</p><p className="stat-value">R$ 45.230</p></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-blue-500"><ShoppingCart className="w-6 h-6 text-white" /></div>
                    <div><p className="stat-label">Vendas do Mês</p><p className="stat-value">156</p></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-purple-500"><TrendingUp className="w-6 h-6 text-white" /></div>
                    <div><p className="stat-label">Ticket Médio</p><p className="stat-value">R$ 290</p></div>
                </div>
            </div>

            <div className="card">
                <table className="table">
                    <thead>
                        <tr><th>Cliente</th><th>Itens</th><th>Total</th><th>Status</th><th>Data</th><th>Ações</th></tr>
                    </thead>
                    <tbody>
                        {mockSales.map((sale) => (
                            <tr key={sale.id}>
                                <td className="font-medium">{sale.contact}</td>
                                <td>{sale.items} itens</td>
                                <td className="font-semibold text-green-500">R$ {sale.total.toLocaleString()}</td>
                                <td><span className={`badge ${sale.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{sale.status === 'paid' ? 'Pago' : 'Pendente'}</span></td>
                                <td className="text-[var(--text-muted)]">{sale.date}</td>
                                <td><button className="btn btn-ghost p-2"><Eye className="w-4 h-4" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
