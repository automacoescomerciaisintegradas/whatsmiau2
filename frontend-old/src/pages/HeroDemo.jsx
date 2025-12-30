import React from 'react';
import CinematicHero from '../components/shared/CinematicHero';

const HeroDemo = () => {
  const sampleImages = [
    'https://62e8a90b2b0a16b3b8c4098924d1a273.r2.cloudflarestorage.com/webp/A_smooth_cinematic_1080p_202512231739-ezgif.com-video-to-webp-converter.webp',
    'https://62e8a90b2b0a16b3b8c4098924d1a273.r2.cloudflarestorage.com/webp/ezgif-266f5f1c2ebda5f7.webp',
    'https://62e8a90b2b0a16b3b8c4098924d1a273.r2.cloudflarestorage.com/webp/whatsmiau2.png'
  ];

  return (
    <div className="relative">
      <CinematicHero 
        images={sampleImages}
        introText="Olá, bem-vindo(a) ao"
        title="WHATS\nMIAU 2"
        subtitle="Transforme sua comunicação com nossa poderosa API de WhatsApp, compatível com Evolution API"
        accentColor="#8b5cf6"
        transitionDuration={0.05}
      />
      
      {/* Conteúdo adicional para demonstrar o efeito de scroll */}
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center p-8 text-white">
        <div className="max-w-4xl text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold">Seção de Conteúdo Adicional</h2>
          <p className="text-xl text-gray-300">
            Esta seção demonstra como o efeito parallax funciona quando você rola a página.
            O componente hero se mantém fixo enquanto você rola, criando um efeito cinematográfico impressionante.
          </p>
          <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold mb-2">Recurso {item}</h3>
                <p className="text-gray-300">
                  Descrição do recurso do WhatsMiau 2 que demonstra a funcionalidade e benefícios.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroDemo;