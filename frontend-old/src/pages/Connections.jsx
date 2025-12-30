import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Wifi, WifiOff, QrCode, RefreshCw, Trash2, MoreVertical, Loader2, X, Check, Copy } from 'lucide-react'
import { instanceService } from '../services/api'

export default function Connections() {
    const [showModal, setShowModal] = useState(false)
    const [showQRModal, setShowQRModal] = useState(false)
    const [showPairCodeModal, setShowPairCodeModal] = useState(false)
    const [pairingPhone, setPairingPhone] = useState('')
    const [pairingCode, setPairingCode] = useState('')
    const [selectedInstance, setSelectedInstance] = useState(null)
    const [newInstanceName, setNewInstanceName] = useState('')
    const [qrCode, setQrCode] = useState(null)
    const [copied, setCopied] = useState(false)
    const queryClient = useQueryClient()

    // Fetch instances
    const { data: instances, isLoading, error, refetch } = useQuery({
        queryKey: ['instances'],
        queryFn: async () => {
            try {
                const result = await instanceService.list()
                return result || []
            } catch (err) {
                console.error('Error fetching instances:', err)
                return []
            }
        },
        refetchInterval: 5000, // Refresh every 5 seconds
    })

    // Create instance mutation
    const createMutation = useMutation({
        mutationFn: (name) => instanceService.create(name, true),
        onSuccess: (data) => {
            queryClient.invalidateQueries(['instances'])
            setShowModal(false)
            setNewInstanceName('')
            // If QR code returned, show it
            if (data?.qrcode) {
                setQrCode(data.qrcode)
                setSelectedInstance(data.instance?.instanceName)
                setShowQRModal(true)
            }
        },
    })

    // Delete instance mutation
    const deleteMutation = useMutation({
        mutationFn: (name) => instanceService.delete(name),
        onSuccess: () => {
            queryClient.invalidateQueries(['instances'])
        },
    })

    // Get QR Code
    const handleGetQRCode = async (instanceName) => {
        try {
            setSelectedInstance(instanceName)
            const result = await instanceService.getQRCode(instanceName)
            if (result?.qrcode || result?.base64) {
                setQrCode(result.qrcode || result)
                setShowQRModal(true)
            }
        } catch (err) {
            console.error('Error getting QR code:', err)
        }
    }

    // Pair with Phone
    const handlePairPhone = async (phoneNumber) => {
        try {
            const result = await instanceService.pairPhone(selectedInstance, phoneNumber)
            if (result?.code) {
                setPairingCode(result.code)
            } else {
                alert('Erro ao gerar código. Verifique se o número está no formato correto (ex: 5511999999999)')
            }
        } catch (err) {
            console.error('Error pairing phone:', err)
            alert('Erro: ' + (err.response?.data?.message || err.message))
        }
    }

    // Disconnect instance
    const handleDisconnect = async (instanceName) => {
        if (confirm(`Deseja desconectar a instância "${instanceName}"?`)) {
            try {
                await instanceService.disconnect(instanceName)
                queryClient.invalidateQueries(['instances'])
            } catch (err) {
                console.error('Error disconnecting:', err)
            }
        }
    }

    // Copy to clipboard
    const handleCopy = (text) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Determine connection status
    const getStatus = (instance) => {
        const state = instance?.connectionStatus ||
            instance?.state ||
            instance?.status ||
            instance?.instance?.status ||
            instance?.instance?.connectionStatus

        if (state === 'open' || state === 'connected') return 'connected'
        if (state === 'connecting' || state === 'qrcode') return 'connecting'
        return 'disconnected'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Conexões WhatsApp</h1>
                    <p className="text-[var(--text-muted)]">Gerencie suas instâncias do WhatsApp</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => refetch()} className="btn btn-secondary">
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">
                        <Plus className="w-4 h-4" />
                        Nova Conexão
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                    Erro ao carregar instâncias: {error.message}
                </div>
            )}

            {/* Loading State */}
            {isLoading && !instances && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
                </div>
            )}

            {/* Connections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {instances?.map((instance, idx) => {
                    const status = getStatus(instance)
                    const name = instance.instanceName || instance.name || instance.instance?.instanceName || `inst-${idx}`
                    const key = `${name}-${idx}`

                    return (
                        <div key={key} className="card p-6 hover:border-[var(--primary)] transition-colors">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${status === 'connected' ? 'bg-green-500/20' :
                                    status === 'connecting' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                                    }`}>
                                    <span key={`icon-${status}`} className="flex items-center justify-center">
                                        {status === 'connected' ? (
                                            <Wifi className="w-6 h-6 text-green-500" />
                                        ) : status === 'connecting' ? (
                                            <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
                                        ) : (
                                            <WifiOff className="w-6 h-6 text-red-500" />
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleCopy(name)}
                                        className="btn btn-ghost p-2"
                                        title="Copiar nome"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                    <button className="btn btn-ghost p-2">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-semibold text-lg mb-1">{name}</h3>
                            <p className="text-sm text-[var(--text-muted)] mb-4">
                                {instance.owner || instance.profileName || instance.instance?.owner || 'Sem número'}
                            </p>

                            <div className="flex items-center justify-between mb-4">
                                <span className={`badge ${status === 'connected' ? 'badge-success' :
                                    status === 'connecting' ? 'badge-warning' : 'badge-danger'
                                    }`}>
                                    {status === 'connected' ? 'Conectado' :
                                        status === 'connecting' ? 'Conectando...' : 'Desconectado'}
                                </span>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
                                {status !== 'connected' ? (
                                    <div className="flex flex-1 gap-2">
                                        <button
                                            onClick={() => handleGetQRCode(name)}
                                            className="btn btn-primary flex-1"
                                            title="Conectar via QR Code"
                                        >
                                            <QrCode className="w-4 h-4" />
                                            QR Code
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedInstance(name)
                                                setShowPairCodeModal(true)
                                                setPairingCode('')
                                            }}
                                            className="btn btn-secondary"
                                            title="Conectar via Código de Telefone"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Fone
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleDisconnect(name)}
                                        className="btn btn-secondary flex-1"
                                    >
                                        <WifiOff className="w-4 h-4" />
                                        Desconectar
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        if (confirm(`Deseja excluir a instância "${name}"?`)) {
                                            deleteMutation.mutate(name)
                                        }
                                    }}
                                    className="btn btn-ghost p-2 text-red-400 hover:text-red-500"
                                    disabled={deleteMutation.isPending}
                                >
                                    {deleteMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    )
                })}

                {/* Add New Card */}
                <div
                    onClick={() => setShowModal(true)}
                    className="card p-6 border-dashed border-2 flex flex-col items-center justify-center cursor-pointer hover:border-[var(--primary)] transition-colors min-h-[200px]"
                >
                    <div key="add-new-card-icon" className="w-12 h-12 rounded-xl bg-[var(--surface-light)] flex items-center justify-center mb-3">
                        <Plus className="w-6 h-6 text-[var(--text-muted)]" />
                    </div>
                    <p className="font-medium">Adicionar Conexão</p>
                    <p className="text-sm text-[var(--text-muted)]">Conecte um novo WhatsApp</p>
                </div>
            </div>

            {/* Create Instance Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="font-semibold text-lg">Nova Conexão</h3>
                            <button onClick={() => setShowModal(false)} className="btn btn-ghost p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Nome da instância</label>
                                <input
                                    type="text"
                                    value={newInstanceName}
                                    onChange={(e) => setNewInstanceName(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                                    placeholder="minha-instancia"
                                    className="w-full"
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                    Use apenas letras, números, hífen e underscore
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                                Cancelar
                            </button>
                            <button
                                onClick={() => createMutation.mutate(newInstanceName)}
                                disabled={!newInstanceName || createMutation.isPending}
                                className="btn btn-primary"
                            >
                                {createMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Criando...
                                    </>
                                ) : (
                                    'Criar e Conectar'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQRModal && (
                <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="font-semibold text-lg">Conectar WhatsApp</h3>
                            <button onClick={() => setShowQRModal(false)} className="btn btn-ghost p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="modal-body text-center">
                            <p className="text-sm text-[var(--text-muted)] mb-4">
                                Instância: <strong>{selectedInstance}</strong>
                            </p>

                            {qrCode?.base64 ? (
                                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                                    <img
                                        src={qrCode.base64.startsWith('data:') ? qrCode.base64 : `data:image/png;base64,${qrCode.base64}`}
                                        alt="QR Code"
                                        className="w-48 h-48"
                                    />
                                </div>
                            ) : (
                                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                                    <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                                        <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
                                    </div>
                                </div>
                            )}

                            <p className="text-sm text-[var(--text-muted)] mb-4">
                                Abra o WhatsApp no seu celular e escaneie o QR Code
                            </p>

                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => handleGetQRCode(selectedInstance)}
                                    className="btn btn-secondary"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Atualizar QR
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Pair Code Modal */}
            {showPairCodeModal && (
                <div className="modal-overlay" onClick={() => setShowPairCodeModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="font-semibold text-lg">Conectar via Código</h3>
                            <button onClick={() => setShowPairCodeModal(false)} className="btn btn-ghost p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="text-sm text-[var(--text-muted)] mb-4">
                                Digite o número do WhatsApp (ex: 5511999999999) para gerar o código de pareamento.
                            </p>

                            {!pairingCode ? (
                                <div className="space-y-4">
                                    <input
                                        type="tel"
                                        value={pairingPhone}
                                        onChange={(e) => setPairingPhone(e.target.value.replace(/\D/g, ''))}
                                        placeholder="5511999999999"
                                        className="w-full text-center text-lg tracking-wider"
                                    />
                                    <button
                                        onClick={() => handlePairPhone(pairingPhone)}
                                        disabled={!pairingPhone || pairingPhone.length < 10}
                                        className="btn btn-primary w-full"
                                    >
                                        Gerar Código
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-sm text-[var(--text-muted)] mb-2">Digite este código no seu WhatsApp:</p>
                                    <div className="text-4xl font-mono font-bold tracking-[0.5em] text-[var(--primary)] bg-[var(--surface-light)] p-4 rounded-lg mb-4">
                                        {pairingCode.slice(0, 4)}-{pairingCode.slice(4)}
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        No WhatsApp: Configurações &gt; Aparelhos Conectados &gt; Conectar um aparelho &gt; Conectar com número de telefone
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => {
                                setShowPairCodeModal(false)
                                setPairingCode('')
                            }} className="btn btn-secondary w-full">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
