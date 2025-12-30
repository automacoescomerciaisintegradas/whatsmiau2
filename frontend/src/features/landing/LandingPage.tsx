import { CinematicHero } from './CinematicHero';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styles from './LandingPage.module.css';

export const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.page}>
            {/* Nav Minimalista */}
            <nav className={styles.minimalNav}>
                <div className={styles.logo}>🎯 WhatsMiau2</div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                    Painel do Gestor
                </Button>
            </nav>

            {/* Cinematic Hero Section */}
            <section className={styles.heroSection}>
                <CinematicHero
                    totalFrames={30} // Ajuste para o número real de frames disponíveis
                    baseUrl="https://62e8a90b2b0a16b3b8c4098924d1a273.r2.cloudflarestorage.com/webp"
                    frameExtension=".webp"
                />
            </section>

            {/* Features Section (Aparece após o scroll do hero) */}
            <div className={styles.contentSections}>
                <section className={styles.featureHighlight}>
                    <div className="container">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className={styles.grid}
                        >
                            <Card variant="glass" padding="lg" hover className={styles.mainCard}>
                                <h2 className="gradient-text">Atendimento que não dorme</h2>
                                <p>Sua empresa conectada 24/7 com inteligência artificial de ponta.</p>
                                <Button variant="primary" onClick={() => navigate('/dashboard')}>
                                    Iniciar Configuração
                                </Button>
                            </Card>
                        </motion.div>
                    </div>
                </section>
            </div>

            <footer className={styles.footer}>
                <p>&copy; 2025 WhatsMiau2 - Inteligência Artificial para Negócios</p>
            </footer>
        </div>
    );
};
