import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import styles from './CinematicHero.module.css';

interface CinematicHeroProps {
    totalFrames: number;
    baseUrl: string;
    frameExtension?: string;
}

export const CinematicHero = ({
    totalFrames = 60,
    baseUrl,
    frameExtension = '.webp'
}: CinematicHeroProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Hook do Framer Motion para detectar scroll no container
    // scrollYProgress vai de 0 a 1 conforme o usuário rola o container
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Mapeia o progresso do scroll (0 a 1) para o índice do frame (0 a totalFrames - 1)
    const frameIndex = useTransform(scrollYProgress, [0, 1], [0, totalFrames - 1]);

    // Pre-load de todas as imagens para performance cinematográfica
    useEffect(() => {
        let isMounted = true;
        const loadedImages: HTMLImageElement[] = [];
        let loadedCount = 0;

        const loadImage = (index: number) => {
            const img = new Image();
            // Tenta carregar o frame. Se falhar, usa uma imagem base como fallback ou apenas ignora
            img.src = `${baseUrl}/frame_${index}${frameExtension}`;

            img.onload = () => {
                if (!isMounted) return;
                loadedCount++;
                if (loadedCount >= totalFrames / 2) { // Carrega pelo menos metade antes de mostrar
                    setIsLoading(false);
                }
            };

            img.onerror = () => {
                if (!isMounted) return;
                // Se falhar o primeiro frame, tenta usar o arquivo específico fornecido pelo usuário como fundo fixo
                if (index === 1) {
                    console.warn("Sequência de frames não encontrada. Usando arquivo base como fallback.");
                    img.src = `${baseUrl}/A_smooth_cinematic_1080p_202512231739-ezgif.com-video-to-webp-converter.webp`;
                    setIsLoading(false);
                }
                loadedCount++;
            }
            loadedImages.push(img);
        };

        for (let i = 1; i <= totalFrames; i++) {
            loadImage(i);
        }
        setImages(loadedImages);

        return () => { isMounted = false; };
    }, [totalFrames, baseUrl, frameExtension]);

    // Atualiza o frame atual quando o scroll muda
    useEffect(() => {
        const unsubscribe = frameIndex.on("change", (v) => {
            setCurrentFrame(Math.round(v));
        });
        return () => unsubscribe();
    }, [frameIndex]);

    return (
        <div ref={containerRef} className={styles.heroContainer}>
            <div className={styles.stickyWrapper}>
                {/* Camada das Imagens */}
                <div className={styles.imageSequence}>
                    {images.length > 0 ? (
                        images.map((img, index) => (
                            <img
                                key={index}
                                src={img.src}
                                alt={`Frame ${index}`}
                                className={styles.frame}
                                style={{
                                    opacity: currentFrame === index || (images.length === 1 && index === 0) ? 1 : 0,
                                    zIndex: currentFrame === index ? 10 : 1
                                }}
                            />
                        ))
                    ) : (
                        <div className={styles.fallbackBg} style={{ backgroundImage: `url(${baseUrl}/A_smooth_cinematic_1080p_202512231739-ezgif.com-video-to-webp-converter.webp)` }}></div>
                    )}

                    {isLoading && (
                        <div className={styles.loader}>
                            <div className={styles.spinner}></div>
                            <p>Sincronizando Experiência...</p>
                        </div>
                    )}
                </div>

                {/* Overlay de Texto (Bloco à esquerda, preto transparente) */}
                <div className={styles.contentOverlay}>
                    <motion.div
                        initial={{ opacity: 0, x: -100 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }}
                        className={styles.textBlock}
                    >
                        <div className={styles.introWrapper}>
                            <div className={styles.introLine}>TECNOLOGIA DE PRÓXIMA GERAÇÃO</div>
                            <div className={styles.accentText}>PLATAFORMA 2025</div>
                        </div>

                        <h1 className={styles.mainTitle}>
                            WhatsMiau<span className={styles.highlight}>2</span>
                        </h1>

                        <p className={styles.description}>
                            A expansão definitiva do sistema de atendimento.
                            Sincronia multicanal, IA nativa e automação cinematográfica.
                        </p>

                        <div className={styles.scrollIndicator}>
                            <div className={styles.mouse}>
                                <div className={styles.wheel}></div>
                            </div>
                            <span>ROLAR PARA EXPLORAR</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Spacer para habilitar o scroll */}
            <div className={styles.scrollSpacer} style={{ height: `${Math.max(totalFrames * 15, 200)}vh` }}></div>
        </div>
    );
};
