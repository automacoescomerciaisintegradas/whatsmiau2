import { Plus, Play, Pause, BarChart, Edit, Trash2 } from 'lucide-react'

const mockCampaigns = [
    { id: 1, name: 'Black Friday', status: 'completed', contacts: 1500, sent: 1450, error: 50, date: '2024-11-29' },
    { id: 2, name: 'Promoção Janeiro', status: 'running', contacts: 800, sent: 320, error: 5, date: '2024-01-15' },
    { id: 3, name: 'Lançamento Produto', status: 'pending', contacts: 2000, sent: 0, error: 0, date: '2024-01-20' },
]

export default function Campaigns() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Campanhas</h1>
                    <p className="text-[var(--text-muted)]">Dispare mensagens em massa</p>
                </div>
                <button className="btn btn-primary"><Plus className="w-4 h-4" />Nova Campanha</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockCampaigns.map((campaign) => (
                    <div key={campaign.id} className="card p-6">
                        <div className="flex items-start justify-between mb-4">
                            <span className={`badge ${campaign.status === 'completed' ? 'badge-success' :
                                    campaign.status === 'running' ? 'badge-primary' : 'badge-warning'
                                }`}>
                                {campaign.status === 'completed' ? 'Concluída' :
                                    campaign.status === 'running' ? 'Em execução' : 'Agendada'}
                            </span>
                            <div className="flex gap-1">
                                {campaign.status === 'pending' && <button className="btn btn-ghost p-2 text-green-500"><Play className="w-4 h-4" /></button>}
                                {campaign.status === 'running' && <button className="btn btn-ghost p-2 text-yellow-500"><Pause className="w-4 h-4" /></button>}
                                <button className="btn btn-ghost p-2"><Edit className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{campaign.name}</h3>
                        <p className="text-sm text-[var(--text-muted)] mb-4">{campaign.date}</p>
                        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[var(--border)] text-center">
                            <div><p className="text-lg font-bold">{campaign.contacts}</p><p className="text-xs text-[var(--text-muted)]">Total</p></div>
                            <div><p className="text-lg font-bold text-green-500">{campaign.sent}</p><p className="text-xs text-[var(--text-muted)]">Enviadas</p></div>
                            <div><p className="text-lg font-bold text-red-500">{campaign.error}</p><p className="text-xs text-[var(--text-muted)]">Erros</p></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
