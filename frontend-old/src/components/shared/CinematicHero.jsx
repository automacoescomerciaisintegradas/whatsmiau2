/**
 * Cinematic Hero Section Component
 * 
 * Um componente de seção hero com efeito parallax cinematico que muda as imagens com base na posição de scroll.
 * Inclui animações de texto avançadas usando GSAP SplitText.
 * 
 * Props:
 * - images: Array de URLs das imagens para a sequência
 * - introText: Texto introdutório acima do título
 * - title: Título principal (suporta \n para quebras de linha)
 * - subtitle: Subtítulo descritivo
 * - logoUrl: URL opcional para imagem do logo
 * - accentColor: Cor para os elementos de destaque
 * - transitionDuration: Duração da transição entre imagens
 */

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(SplitText);

const CinematicHero = ({ 
  images = [
    'https://62e8a90b2b0a16b3b8c4098924d1a273.r2.cloudflarestorage.com/webp/A_smooth_cinematic_1080p_202512231739-ezgif.com-video-to-webp-converter.webp',
    'https://62e8a90b2b0a16b3b8c4098924d1a273.r2.cloudflarestorage.com/webp/ezgif-266f5f1c2ebda5f7.webp',
    'https://62e8a90b2b0a16b3b8c4098924d1a273.r2.cloudflarestorage.com/webp/whatsmiau2.png'
  ], 
  introText = "Olá, bem-vindo(a) ao", 
  title = "WHATS\nMIAU 2", 
  subtitle = "Transforme sua comunicação com nossa poderosa API de WhatsApp", 
  logoUrl = undefined, 
  accentColor = "#6366f1",
  transitionDuration = 0.01
}) => {
  const heroRef = useRef(null);
  const imagesRef = useRef([]);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const splitTextRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Pré-carregar imagens
    const preloadImages = async () => {
      const imagePromises = images.map(src => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = reject;
          img.src = src;
        });
      });
      
      try {
        await Promise.all(imagePromises);
        setIsLoaded(true);
      } catch (error) {
        console.error('Erro ao carregar imagens:', error);
        setIsLoaded(true); // Continuar mesmo se houver erro
      }
    };

    preloadImages();
  }, [images]);

  useEffect(() => {
    if (!isLoaded) return;

    // Configurar animação com GSAP e ScrollTrigger
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
        pin: true,
        anticipatePin: 1,
      }
    });

    // Animação das imagens
    images.forEach((_, index) => {
      if (index === 0) {
        tl.to(imagesRef.current[index], { opacity: 1, duration: transitionDuration });
      } else {
        tl.to(imagesRef.current[index - 1], { opacity: 0, duration: transitionDuration }, `+=${transitionDuration}`)
          .to(imagesRef.current[index], { opacity: 1, duration: transitionDuration }, `-=${transitionDuration}`);
      }
    });

    // Animação de texto com SplitText se os elementos estiverem presentes
    if (titleRef.current && !logoUrl) {
      splitTextRef.current = new SplitText(titleRef.current, { type: "words,chars" });
      gsap.set(splitTextRef.current.chars, { opacity: 0 });
      
      tl.from(splitTextRef.current.chars, {
        opacity: 0,
        y: 80,
        rotationX: -90,
        transformOrigin: "50% 50% -50",
        stagger: 0.02,
        duration: 1.5,
        ease: "power2.out",
        delay: 0.2
      }, "<0.5");
    }
    
    if (subtitleRef.current) {
      tl.from(subtitleRef.current, {
        opacity: 0,
        y: 30,
        duration: 1,
        ease: "power2.out",
        delay: 0.1
      }, "<0.3");
    }

    // Cleanup
    return () => {
      if (ScrollTrigger.getAll().length > 0) {
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      }
      if (tl) tl.kill();
      
      // Limpar SplitText se existir
      if (splitTextRef.current) {
        splitTextRef.current.revert();
        splitTextRef.current = null;
      }
    };
  }, [isLoaded, images, logoUrl]);

  return (
    <section 
      ref={heroRef}
      className="relative w-full h-screen overflow-hidden bg-black"
      style={{ minHeight: '100vh' }}
    >
      {/* Container de imagens */}
      <div className="absolute inset-0">
        {images.map((img, index) => (
          <div
            key={index}
            ref={el => imagesRef.current[index] = el}
            className="absolute inset-0 w-full h-full transition-opacity duration-300"
            style={{ opacity: index === 0 ? 1 : 0 }}
          >
            <img
              src={img}
              alt={`Background ${index + 1}`}
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          </div>
        ))}
      </div>

      {/* Overlay de efeito cinematico */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-indigo-900/20"></div>

      {/* Conteúdo centralizado */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
        <div className="max-w-4xl w-full space-y-6 md:space-y-8">
          {/* Intro text */}
          <div 
            className="text-sm md:text-base font-light tracking-wider uppercase"
            style={{ color: accentColor }}
          >
            {introText}
          </div>

          {/* Logo ou título */}
          {logoUrl ? (
            <div className="mb-4">
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="max-h-24 mx-auto rounded-lg shadow-xl"
              />
            </div>
          ) : (
            <h1 
              ref={titleRef}
              className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight"
              style={{ 
                color: 'white',
                textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                lineHeight: '1.2'
              }}
            >
              {title.split('\n').map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h1>
          )}

          {/* Subtítulo */}
          <p 
            ref={subtitleRef}
            className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto px-4"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
          >
            {subtitle}
          </p>

          {/* Botão de call-to-action */}
          <div className="pt-6 md:pt-8">
            <button
              className="px-8 py-4 rounded-full font-semibold text-white backdrop-blur-lg bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 shadow-2xl hover:shadow-purple-500/25"
              style={{ backgroundColor: `${accentColor}20`, borderColor: `${accentColor}30` }}
            >
              Começar Agora
            </button>
          </div>
        </div>
      </div>

      {/* Efeito de borda cinematica */}
      <div className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none"></div>
      
      {/* Indicador de scroll */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex flex-col items-center space-y-2 text-white/70">
          <span className="text-xs uppercase tracking-wider">Role para continuar</span>
          <div className="w-8 h-12 rounded-full border-2 border-white/30 flex justify-center p-1">
            <div className="w-1 h-3 rounded-full bg-white/50 animate-bounce"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CinematicHero;