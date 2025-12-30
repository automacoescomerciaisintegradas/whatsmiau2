import { Plus, Bot, Play, Pause, Edit, Trash2, GitBranch } from 'lucide-react'

const mockBots = [
    { id: 1, name: 'Atendimento Inicial', active: true, triggers: ['oi', 'olá', 'bom dia'], responses: 5 },
    { id: 2, name: 'FAQ Automático', active: true, triggers: ['preço', 'valor', 'quanto custa'], responses: 12 },
    { id: 3, name: 'Fora do Expediente', active: false, triggers: [], responses: 2 },
]

export default function Chatbot() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Chatbot</h1>
                    <p className="text-[var(--text-muted)]">Configure bots de atendimento automático</p>
                </div>
                <button className="btn btn-primary"><Plus className="w-4 h-4" />Novo Bot</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockBots.map((bot) => (
                    <div key={bot.id} className="card p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bot.active ? 'bg-green-500/20' : 'bg-[var(--surface-light)]'}`}>
                                <Bot className={`w-6 h-6 ${bot.active ? 'text-green-500' : 'text-[var(--text-muted)]'}`} />
                            </div>
                            <button className={`btn btn-ghost p-2 ${bot.active ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>
                                {bot.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{bot.name}</h3>
                        <div className="flex flex-wrap gap-1 mb-4">
                            {bot.triggers.slice(0, 3).map((t, i) => (
                                <span key={i} className="badge badge-primary text-xs">{t}</span>
                            ))}
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                <GitBranch className="w-4 h-4" />{bot.responses} respostas
                            </div>
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
