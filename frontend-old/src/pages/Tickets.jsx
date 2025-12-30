import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
    Search,
    Plus,
    MoreVertical,
    MessageSquare,
    Send,
    Paperclip,
    Smile,
    Image,
    Mic,
    Phone,
    Video,
    User,
    Loader2,
    RefreshCw,
} from 'lucide-react'
import { groupService, messageService } from '../services/api'

export default function Tickets() {
    const [selectedChat, setSelectedChat] = useState(null)
    const [message, setMessage] = useState('')
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [messages, setMessages] = useState([])

    // Fetch groups as chats
    const { data: groupsData, isLoading, refetch } = useQuery({
        queryKey: ['groups'],
        queryFn: async () => {
            try {
                const result = await groupService.list()
                return result?.groups || []
            } catch {
                return []
            }
        },
        refetchInterval: 30000,
    })

    // Send message mutation
    const sendMutation = useMutation({
        mutationFn: async ({ number, text }) => {
            return messageService.sendText(number, text)
        },
        onSuccess: (data) => {
            // Add message to local state
            setMessages(prev => [...prev, {
                id: Date.now(),
                body: message,
                fromMe: true,
                time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                status: 'sent'
            }])
            setMessage('')
        },
    })

    const groups = groupsData || []

    const filteredGroups = groups.filter(group => {
        const name = group.subject || group.name || ''
        return name.toLowerCase().includes(search.toLowerCase())
    })

    const handleSend = () => {
        if (!message.trim() || !selectedChat) return

        const jid = selectedChat.id || selectedChat.jid
        sendMutation.mutate({ number: jid, text: message })
    }

    const handleSelectChat = (group) => {
        setSelectedChat(group)
        // Reset messages for demo
        setMessages([
            { id: 1, body: 'Olá! Bem-vindo ao grupo.', fromMe: false, time: '10:30', sender: 'Admin' },
            { id: 2, body: 'Obrigado! Estou aqui para ajudar.', fromMe: true, time: '10:31' },
        ])
    }

    return (
        <div className="flex h-[calc(100vh-7rem)] gap-4">
            {/* Chats List */}
            <div className="w-96 flex flex-col card">
                {/* Header */}
                <div className="p-4 border-b border-[var(--border)]">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold">Conversas</h1>
                        <button onClick={() => refetch()} className="btn btn-ghost p-2">
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar conversa..."
                            className="w-full pl-10 py-2 text-sm"
                        />
                    </div>
                    {/* Filters */}
                    <div className="flex gap-2 mt-3">
                        {['all', 'groups', 'contacts'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1 text-sm rounded-full transition-colors ${filter === f
                                        ? 'bg-[var(--primary)] text-white'
                                        : 'bg-[var(--surface-light)] text-[var(--text-muted)] hover:text-[var(--text)]'
                                    }`}
                            >
                                {f === 'all' ? 'Todos' : f === 'groups' ? 'Grupos' : 'Contatos'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
                    </div>
                )}

                {/* Chats List */}
                {!isLoading && (
                    <div className="flex-1 overflow-y-auto">
                        {filteredGroups.length === 0 ? (
                            <div className="p-8 text-center text-[var(--text-muted)]">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Nenhuma conversa encontrada</p>
                            </div>
                        ) : (
                            filteredGroups.map((group) => (
                                <div
                                    key={group.id || group.jid}
                                    onClick={() => handleSelectChat(group)}
                                    className={`p-4 border-b border-[var(--border)] cursor-pointer transition-colors hover:bg-[var(--surface-light)]/30 ${selectedChat?.id === group.id ? 'bg-[var(--surface-light)]/50' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="avatar relative bg-blue-500">
                                            {(group.subject || group.name || 'G').charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-sm truncate">
                                                    {group.subject || group.name || 'Grupo'}
                                                </span>
                                                <span className="text-xs text-[var(--text-muted)]">
                                                    {group.size || group.participants?.length || 0} membros
                                                </span>
                                            </div>
                                            <p className="text-sm text-[var(--text-muted)] truncate">
                                                {group.desc || 'Clique para ver as mensagens'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="badge badge-primary text-xs">Grupo</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Chat Area */}
            {selectedChat ? (
                <div className="flex-1 card flex flex-col">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="avatar avatar-lg bg-blue-500">
                                {(selectedChat.subject || selectedChat.name || 'G').charAt(0)}
                            </div>
                            <div>
                                <h2 className="font-semibold">{selectedChat.subject || selectedChat.name || 'Grupo'}</h2>
                                <p className="text-sm text-[var(--text-muted)]">
                                    {selectedChat.size || selectedChat.participants?.length || 0} participantes
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="btn btn-ghost p-2">
                                <Phone className="w-5 h-5" />
                            </button>
                            <button className="btn btn-ghost p-2">
                                <Video className="w-5 h-5" />
                            </button>
                            <button className="btn btn-ghost p-2">
                                <User className="w-5 h-5" />
                            </button>
                            <button className="btn btn-ghost p-2">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`chat-bubble ${msg.fromMe ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
                                    {!msg.fromMe && msg.sender && (
                                        <p className="text-xs text-[var(--primary)] mb-1 font-medium">{msg.sender}</p>
                                    )}
                                    <p className="text-sm">{msg.body}</p>
                                    <div className="flex items-center justify-end gap-1 mt-1">
                                        <span className={`text-xs ${msg.fromMe ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                                            {msg.time}
                                        </span>
                                        {msg.fromMe && msg.status === 'sent' && (
                                            <span className="text-white/70">✓</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-[var(--border)]">
                        <div className="flex items-center gap-2">
                            <button className="btn btn-ghost p-2">
                                <Smile className="w-5 h-5" />
                            </button>
                            <button className="btn btn-ghost p-2">
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <button className="btn btn-ghost p-2">
                                <Image className="w-5 h-5" />
                            </button>
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Digite sua mensagem..."
                                className="flex-1"
                                disabled={sendMutation.isPending}
                            />
                            {message ? (
                                <button
                                    onClick={handleSend}
                                    className="btn btn-primary p-3"
                                    disabled={sendMutation.isPending}
                                >
                                    {sendMutation.isPending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </button>
                            ) : (
                                <button className="btn btn-primary p-3">
                                    <Mic className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        {sendMutation.isError && (
                            <p className="text-red-400 text-sm mt-2">
                                Erro ao enviar mensagem: {sendMutation.error?.message}
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 card flex items-center justify-center">
                    <div className="text-center">
                        <MessageSquare className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Selecione uma conversa</h2>
                        <p className="text-[var(--text-muted)]">
                            Escolha um grupo para visualizar e enviar mensagens
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
