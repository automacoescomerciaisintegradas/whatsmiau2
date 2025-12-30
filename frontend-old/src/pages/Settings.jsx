import { User, Bell, Lock, Palette, Globe, Save } from 'lucide-react'

export default function Settings() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Configurações</h1>
                <p className="text-[var(--text-muted)]">Gerencie as configurações do sistema</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="card p-4">
                    <nav className="space-y-1">
                        {[
                            { icon: User, label: 'Perfil', active: true },
                            { icon: Bell, label: 'Notificações' },
                            { icon: Lock, label: 'Segurança' },
                            { icon: Palette, label: 'Aparência' },
                            { icon: Globe, label: 'Idioma' },
                        ].map((item, i) => (
                            <button key={i} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${item.active ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'hover:bg-[var(--surface-light)]'}`}>
                                <item.icon className="w-5 h-5" />{item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="lg:col-span-3 card p-6">
                    <h2 className="text-xl font-semibold mb-6">Informações do Perfil</h2>

                    <div className="flex items-center gap-6 mb-8">
                        <div className="avatar avatar-lg w-20 h-20 text-2xl">A</div>
                        <div>
                            <button className="btn btn-secondary mb-2">Alterar foto</button>
                            <p className="text-sm text-[var(--text-muted)]">JPG, GIF ou PNG. Máximo 2MB.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Nome completo</label>
                            <input type="text" defaultValue="Admin" className="w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <input type="email" defaultValue="admin@pagia.com" className="w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Telefone</label>
                            <input type="text" defaultValue="+55 11 99999-9999" className="w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Cargo</label>
                            <input type="text" defaultValue="Administrador" className="w-full" />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-[var(--border)]">
                        <button className="btn btn-primary"><Save className="w-4 h-4" />Salvar alterações</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
