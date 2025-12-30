import { Card } from '@components/ui/Card'
import {
    Users,
    MessageSquare,
    Clock,
    CheckCircle2,
    TrendingUp,
    Activity
} from 'lucide-react'
import styles from './Dashboard.module.css'

export const Dashboard = () => {
    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Bem-vindo de volta, Pc Admin 👋</h1>
                    <p className={styles.subtitle}>Veja o que está acontecendo nas suas operações hoje.</p>
                </div>
                <div className={styles.date}>
                    28 de Dezembro, 2025
                </div>
            </header>

            <div className={styles.statsGrid}>
                <Card className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Contatos Totais</span>
                        <span className={styles.statValue}>1,284</span>
                        <span className={styles.statTrend}>
                            <TrendingUp size={14} /> +12% este mês
                        </span>
                    </div>
                    <div className={clsx(styles.statIcon, styles.indigo)}>
                        <Users size={24} />
                    </div>
                </Card>

                <Card className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Tickets Ativos</span>
                        <span className={styles.statValue}>42</span>
                        <span className={styles.statTrend}>
                            <Activity size={14} /> 8 em aguardo
                        </span>
                    </div>
                    <div className={clsx(styles.statIcon, styles.success)}>
                        <MessageSquare size={24} />
                    </div>
                </Card>

                <Card className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Tempo Médio</span>
                        <span className={styles.statValue}>4m 12s</span>
                        <span className={styles.statTrend}>
                            <Clock size={14} /> -30s de ontem
                        </span>
                    </div>
                    <div className={clsx(styles.statIcon, styles.warning)}>
                        <Clock size={24} />
                    </div>
                </Card>

                <Card className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Finalizados</span>
                        <span className={styles.statValue}>156</span>
                        <span className={styles.statTrend}>
                            <CheckCircle2 size={14} /> 98% satisfação
                        </span>
                    </div>
                    <div className={clsx(styles.statIcon, styles.error)}>
                        <CheckCircle2 size={24} />
                    </div>
                </Card>
            </div>

            <div className={styles.mainGrid}>
                <Card className={styles.chartSection}>
                    <h3 className={styles.sectionTitle}>Atividade de Mensagens</h3>
                    <div className={styles.placeholderChart}>
                        {/* Aqui entraria o gráfico do Recharts */}
                        <Activity size={48} className={styles.chartIcon} />
                        <p>Gráfico de performance em tempo real</p>
                    </div>
                </Card>

                <Card className={styles.leadsSection}>
                    <h3 className={styles.sectionTitle}>Últimos Leads</h3>
                    <div className={styles.leadsList}>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className={styles.leadItem}>
                                <div className={styles.leadAvatar}>
                                    <img src={`https://i.pravatar.cc/150?u=${i}`} alt="Lead" />
                                </div>
                                <div className={styles.leadInfo}>
                                    <span className={styles.leadName}>Cliente Potencial {i}</span>
                                    <span className={styles.leadSource}>WhatsApp • Campanha Natal</span>
                                </div>
                                <div className={styles.leadStatus}>
                                    <span className={styles.badge}>Novo</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    )
}

// Auxiliar para clsx no Dashboard já que não importamos no início do arquivo
function clsx(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}
