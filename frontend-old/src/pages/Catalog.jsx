import { Plus, Edit, Trash2, Package } from 'lucide-react'

const mockProducts = [
    { id: 1, name: 'Produto Premium', price: 299.90, category: 'Premium', active: true, image: '📦' },
    { id: 2, name: 'Serviço Básico', price: 99.90, category: 'Serviços', active: true, image: '🛠️' },
    { id: 3, name: 'Consultoria', price: 500.00, category: 'Serviços', active: true, image: '💼' },
    { id: 4, name: 'Produto Standard', price: 149.90, category: 'Standard', active: false, image: '📦' },
]

export default function Catalog() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Catálogo</h1>
                    <p className="text-[var(--text-muted)]">Gerencie seus produtos e serviços</p>
                </div>
                <button className="btn btn-primary"><Plus className="w-4 h-4" />Novo Produto</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mockProducts.map((product) => (
                    <div key={product.id} className={`card p-6 ${!product.active && 'opacity-60'}`}>
                        <div className="text-4xl mb-4">{product.image}</div>
                        <h3 className="font-semibold mb-1">{product.name}</h3>
                        <p className="text-sm text-[var(--text-muted)] mb-2">{product.category}</p>
                        <p className="text-xl font-bold text-green-500 mb-4">R$ {product.price.toFixed(2)}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                            <span className={`badge ${product.active ? 'badge-success' : 'badge-warning'}`}>
                                {product.active ? 'Ativo' : 'Inativo'}
                            </span>
                            <div className="flex gap-1">
                                <button className="btn btn-ghost p-2"><Edit className="w-4 h-4" /></button>
                                <button className="btn btn-ghost p-2 text-red-400"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
