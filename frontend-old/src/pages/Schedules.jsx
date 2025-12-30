import { Plus, Calendar, Clock, Edit, Trash2, Send } from 'lucide-react'

const mockSchedules = [
    { id: 1, contact: 'João Silva', message: 'Olá! Lembrando sobre nossa reunião...', date: '2024-01-20', time: '10:00', status: 'pending' },
    { id: 2, contact: 'Maria Santos', message: 'Bom dia! Seu pedido foi enviado...', date: '2024-01-20', time: '14:00', status: 'pending' },
    { id: 3, contact: 'Carlos Oliveira', message: 'Feliz aniversário!', date: '2024-01-21', time: '08:00', status: 'pending' },
]

export default function Schedules() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Agendamentos</h1>
                    <p className="text-[var(--text-muted)]">Programe mensagens para envio futuro</p>
                </div>
                <button className="btn btn-primary"><Plus className="w-4 h-4" />Novo Agendamento</button>
            </div>

            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Contato</th>
                            <th>Mensagem</th>
                            <th>Data/Hora</th>
                            <th>Status</th>
                            <th className="w-20">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockSchedules.map((schedule) => (
                            <tr key={schedule.id}>
                                <td className="font-medium">{schedule.contact}</td>
                                <td className="text-[var(--text-muted)] max-w-xs truncate">{schedule.message}</td>
                                <td>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="w-4 h-4" />{schedule.date}
                                        <Clock className="w-4 h-4 ml-2" />{schedule.time}
                                    </div>
                                </td>
                                <td><span className="badge badge-warning">Agendado</span></td>
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
