import React, { useEffect, useRef, useState, useCallback } from 'react';
import { soundManager } from '../utils/audioAlert';

interface IntroOverlayProps {
  onEnter?: () => void;
}

interface Particle {
  angle: number;
  radius: number;
  initialRadius: number;
  curve: number;
  decayRate: number;
  color: string;
  glowColor: string;
  size: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
}

// 1. Precarga anticipada y decodificación de la imagen en memoria antes de la animación
if (typeof window !== 'undefined') {
  const preloader = new Image();
  preloader.src = '/logo_serenazgo.png';
  if ('decode' in preloader) {
    preloader.decode().catch(() => {});
  }
}

export const IntroOverlay: React.FC<IntroOverlayProps> = ({ onEnter }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);
  const [logoStatic, setLogoStatic] = useState(false);

  const hasEnteredRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  // Desvanecimiento suave y acceso al dashboard principal - RESTRINGIDO EXCLUSIVAMENTE AL ESCUDO
  const handleDismiss = useCallback(() => {
    if (hasEnteredRef.current) return;
    hasEnteredRef.current = true;

    try {
      soundManager.playSuccess();
    } catch {
      // Ignorar errores de contexto de audio
    }

    setIsFadingOut(true);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
      if (onEnter) onEnter();
    }, 450);
  }, [onEnter]);

  // Teclado opcional para accesibilidad (Escape, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [handleDismiss]);

  // Ciclo de animación optimizado con Delta Time y Cero Re-renders de React
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let resizeHandler: (() => void) | null = null;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let screenW = window.innerWidth;
    let screenH = window.innerHeight;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      screenW = window.innerWidth;
      screenH = window.innerHeight;
      canvas.width = screenW * dpr;
      canvas.height = screenH * dpr;
      canvas.style.width = `${screenW}px`;
      canvas.style.height = `${screenH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Fondo 100% negro puro absoluto (#000000)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, screenW, screenH);
    };

    resize();
    resizeHandler = resize;
    window.addEventListener('resize', resizeHandler);

    // 1. Precálculo de todas las partículas UNA SOLA VEZ fuera del bucle RAF
    const numParticles = 180;
    const particles: Particle[] = [];
    const centerX = screenW / 2;
    const centerY = screenH / 2;
    const maxDist = Math.hypot(screenW, screenH) * 0.58;

    const blueColors = [
      { core: '#ffffff', glow: 'rgba(0, 210, 255, 0.7)' },
      { core: '#00e5ff', glow: 'rgba(0, 102, 255, 0.6)' },
      { core: '#38bdf8', glow: 'rgba(56, 189, 248, 0.6)' },
      { core: '#00d2ff', glow: 'rgba(0, 210, 255, 0.8)' },
    ];

    for (let i = 0; i < numParticles; i++) {
      const palette = blueColors[i % blueColors.length];
      const angle = Math.random() * Math.PI * 2;
      const radius = 100 + Math.random() * maxDist;
      const curve = (Math.random() > 0.48 ? 1 : -1) * (1.8 + Math.random() * 2.2);
      const startX = centerX + Math.cos(angle) * radius;
      const startY = centerY + Math.sin(angle) * radius;

      particles.push({
        angle,
        radius,
        initialRadius: radius,
        curve,
        decayRate: 0.972 - Math.random() * 0.008,
        color: palette.core,
        glowColor: palette.glow,
        size: 1.4 + Math.random() * 1.6,
        x: startX,
        y: startY,
        prevX: startX,
        prevY: startY,
      });
    }

    // Timers sincronizados fuera de la ejecución frame a frame
    const revealTimeout = setTimeout(() => {
      setLogoVisible(true);
    }, 1500);

    const staticTimeout = setTimeout(() => {
      setLogoStatic(true);
    }, 2500);

    // 3. Variables de tiempo delta para 60/120 FPS sin tirones
    let lastTime = performance.now();
    const startTime = lastTime;

    const loop = (currentTime: number) => {
      if (hasEnteredRef.current) return;

      // Delta time con límite seguro
      const dt = Math.min(Math.max((currentTime - lastTime) / 1000, 0.001), 0.04);
      lastTime = currentTime;

      const elapsed = (currentTime - startTime) / 1000;
      const curCenterX = window.innerWidth / 2;
      const curCenterY = window.innerHeight / 2;

      // Fondo negro puro continuo (#000000) con estela ultrarrápida
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      if (elapsed < 2.5) {
        // Fase de cometas orbitando y colapsando hacia el centro
        const progress = elapsed / 2.5;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.prevX = p.x;
          p.prevY = p.y;

          // Movimiento angular y reducción de radio con delta time fluido
          const closeness = 1 - p.radius / p.initialRadius;
          const accel = 1 + closeness * 3.2;

          p.angle += p.curve * dt * 1.3 * accel;
          p.radius *= Math.pow(p.decayRate, dt * 60 * (1 + progress * 0.4));

          p.x = curCenterX + Math.cos(p.angle) * p.radius;
          p.y = curCenterY + Math.sin(p.angle) * p.radius;

          // Aceleración por hardware: Doble trazo puro sin shadowBlur (0ms lag)
          // 1) Capa exterior difusa de resplandor
          ctx.beginPath();
          ctx.moveTo(p.prevX, p.prevY);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = p.glowColor;
          ctx.lineWidth = p.size * 2.2;
          ctx.lineCap = 'round';
          ctx.stroke();

          // 2) Núcleo brillante
          ctx.beginPath();
          ctx.moveTo(p.prevX, p.prevY);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size * 0.9;
          ctx.stroke();

          // 3) Cabeza del cometa
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }

        animationFrameRef.current = requestAnimationFrame(loop);
      } else {
        // DETENCIÓN TOTAL Y LIMPIEZA: Al segundo 2.5 se cancela RAF definitivamente
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      clearTimeout(revealTimeout);
      clearTimeout(staticTimeout);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
      }
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      id="intro-overlay"
      className={`fixed inset-0 z-50 bg-[#000000] flex flex-col items-center justify-center p-6 cursor-default select-none overflow-hidden transition-opacity duration-500 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 1. Canvas acelerado por hardware sobre fondo negro puro (sin eventos en fondo) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none z-10 will-change-transform"
      />

      {/* 2. Resplandor radial azul optimizado por GPU (pre-renderizado, sin repaints) */}
      <div
        className={`absolute w-[320px] h-[320px] sm:w-[460px] sm:h-[460px] rounded-full bg-[radial-gradient(circle,rgba(0,210,255,0.22)_0%,rgba(0,102,255,0.08)_50%,transparent_70%)] pointer-events-none z-20 transform-gpu will-change-opacity transition-opacity duration-700 ${
          logoVisible ? 'opacity-100 animate-pulse' : 'opacity-0'
        }`}
      />

      {/* 3. Escudo Oficial Nítido Centrado con Aceleración por GPU */}
      <div
        className={`relative z-30 flex flex-col items-center justify-center text-center pointer-events-none transform-gpu will-change-transform will-change-opacity transition-all duration-700 ease-out ${
          logoVisible
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-90 translate-y-2'
        }`}
      >
        {/* Título superior institucional con tipografía limpia y brillante */}
        <div className="mb-4 text-center space-y-1">
          <p className="text-[10px] sm:text-xs font-black tracking-[0.25em] text-cyan-300 uppercase">
            Municipalidad Distrital de Nuevo Chimbote
          </p>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-[0.18em] text-white uppercase drop-shadow-[0_2px_10px_rgba(0,210,255,0.35)]">
            SUB GERENCIA DE SERENAZGO
          </h1>
          <p className="text-[10px] sm:text-xs font-medium tracking-wider text-slate-400 uppercase">
            Centro de Operaciones &bull; Seguridad Ciudadana
          </p>
        </div>

        {/* 4. INSIGNIA OFICIAL: EVENTO DE CLIC RESTRINGIDO EXCLUSIVAMENTE AQUÍ */}
        <div
          onClick={handleDismiss}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleDismiss();
            }
          }}
          className="relative group transition-transform duration-300 hover:scale-105 cursor-pointer pointer-events-auto transform-gpu will-change-transform"
          title="Haz clic en la insignia para ingresar al sistema de Serenazgo"
        >
          {/* Halo sutil perimetral pre-renderizado */}
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl group-hover:bg-cyan-300/40 transition-opacity duration-300 pointer-events-none transform-gpu will-change-opacity" />

          {/* Imagen oficial precargada, nítida y con cero tirones */}
          <img
            src="/logo_serenazgo.png"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src.includes('logo_serenazgo.png')) {
                target.src = '/logo-serenazgo.png';
              } else if (target.src.includes('logo-serenazgo.png')) {
                target.src = '/logo.png';
              }
            }}
            alt="Insignia Oficial de Serenazgo Nuevo Chimbote"
            className="w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 object-contain transition-transform duration-300 pointer-events-auto select-none"
            style={{
              filter: 'drop-shadow(0 0 25px rgba(0, 210, 255, 0.75))',
            }}
          />
        </div>

        {/* Indicador de clic cuando está estático */}
        {logoStatic && (
          <p
            onClick={handleDismiss}
            className="mt-5 text-[11px] font-bold text-cyan-400/80 tracking-widest uppercase animate-pulse pointer-events-auto cursor-pointer hover:text-white transition-colors"
          >
            &bull; Haz clic en la insignia para ingresar &bull;
          </p>
        )}
      </div>
    </div>
  );
};
