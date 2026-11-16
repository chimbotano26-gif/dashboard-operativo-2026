import React, { useState, useEffect, useRef } from 'react';
import { Wifi, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';

interface IntroSplashViewProps {
  onEnterDashboard: () => void;
  isDataLoaded: boolean;
  totalRecords: number;
}

export const IntroSplashView: React.FC<IntroSplashViewProps> = ({
  onEnterDashboard,
  isDataLoaded,
  totalRecords
}) => {
  const [animationProgress, setAnimationProgress] = useState<number>(0);
  const [canEnter, setCanEnter] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Precarga fluida en background
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2.5;
      });
    }, 35);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (animationProgress >= 100 && isDataLoaded) {
      setCanEnter(true);
    }
  }, [animationProgress, isDataLoaded]);

  // Animación Canvas de nodos y cubos interconectados
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 65 }, () => ({
      x: (Math.random() - 0.5) * 250,
      y: (Math.random() - 0.5) * 250,
      z: (Math.random() - 0.5) * 250,
      size: Math.random() * 3 + 1.5
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      angle += 0.008;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
      ctx.lineWidth = 0.8;

      particles.forEach((p1, i) => {
        const x1 = p1.x * cos - p1.z * sin;
        const z1 = p1.z * cos + p1.x * sin;
        const scale1 = 300 / (300 + z1);
        const px1 = cx + x1 * scale1;
        const py1 = cy + p1.y * scale1;

        particles.forEach((p2, j) => {
          if (i < j) {
            const x2 = p2.x * cos - p2.z * sin;
            const z2 = p2.z * cos + p2.x * sin;
            const scale2 = 300 / (300 + z2);
            const px2 = cx + x2 * scale1;
            const py2 = cy + p2.y * scale1;

            const dist = Math.hypot(px1 - px2, py1 - py2);
            if (dist < 65) {
              ctx.beginPath();
              ctx.moveTo(px1, py1);
              ctx.lineTo(px2, py2);
              ctx.stroke();
            }
          }
        });

        ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#34d399';
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 10;
        ctx.fillRect(px1 - p1.size / 2, py1 - p1.size / 2, p1.size * scale1, p1.size * scale1);
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[99999] bg-[#02060f] flex flex-col items-center justify-center p-4 select-none font-mono overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(2,6,15,0.4),rgba(2,6,15,0.92))] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-lg w-full text-center">
        
        <div className="text-[10px] sm:text-xs tracking-[0.25em] text-cyan-300 font-bold uppercase mb-1 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
          MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE
        </div>
        <div className="text-[11px] sm:text-sm tracking-[0.18em] text-emerald-300 font-black uppercase mb-6 border-b border-cyan-500/40 pb-2.5 w-full">
          SUB GERENCIA DE SERENAZGO // SICEP C2
        </div>

        {/* LOGO EXACTO DE SERENAZGO COMO BOTÓN DE ACCESO */}
        <div className="relative my-4 group">
          <div className="absolute -inset-4 rounded-full border-2 border-dashed border-cyan-400/60 animate-spin" style={{ animationDuration: '22s' }} />
          <div className="absolute -inset-8 rounded-full border border-emerald-400/40 animate-spin" style={{ animationDuration: '32s', animationDirection: 'reverse' }} />
          
          {canEnter && (
            <div className="absolute -inset-3 rounded-full bg-emerald-500/30 blur-xl animate-pulse" />
          )}

          <button
            onClick={() => {
              if (canEnter) onEnterDashboard();
            }}
            disabled={!canEnter}
            className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full p-2 bg-gradient-to-br from-cyan-950 via-[#061830] to-slate-950 border-4 ${
              canEnter 
                ? 'border-emerald-400 shadow-[0_0_65px_rgba(16,185,129,0.9)] cursor-pointer hover:scale-105' 
                : 'border-cyan-500/60 shadow-[0_0_35px_rgba(6,182,212,0.5)] cursor-wait'
            } transition-all duration-500 flex items-center justify-center overflow-hidden`}
            title={canEnter ? '¡Sistema listo! Haz clic en el escudo para ingresar' : 'Sincronizando telemetría y precargando base de datos...'}
          >
            <img
              src="/logo-serenazgo.png"
              alt="Escudo Oficial Sub Gerencia de Serenazgo Nuevo Chimbote"
              className="w-full h-full object-cover rounded-full filter contrast-115 drop-shadow-[0_0_15px_rgba(34,211,238,0.9)]"
            />

            {!canEnter && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center text-cyan-200">
                <Lock className="w-9 h-9 text-cyan-400 animate-bounce mb-1.5" />
                <span className="text-[10px] font-bold tracking-wider">CARGANDO DATOS...</span>
              </div>
            )}
          </button>
        </div>

        <div className="w-full bg-[#051326]/90 border border-cyan-500/50 rounded-xl p-3.5 mt-4 shadow-[inset_0_0_20px_rgba(6,182,212,0.2)] backdrop-blur-md">
          <div className="flex justify-between items-center text-[10px] text-cyan-200 mb-2 font-bold">
            <span className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              ESTADO DE PRECARGA:
            </span>
            <span className={canEnter ? 'text-emerald-300 font-black' : 'text-amber-300'}>
              {canEnter ? 'DATOS LISTOS' : `SINCRONIZANDO (${Math.round(animationProgress)}%)`}
            </span>
          </div>

          <div className="w-full bg-cyan-950 h-2 rounded-full overflow-hidden border border-cyan-400/40 mb-2.5">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-300 transition-all duration-200 shadow-[0_0_10px_#10b981]"
              style={{ width: `${Math.max(animationProgress, isDataLoaded ? 100 : animationProgress)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[9px] text-cyan-400">
            <span>REGISTROS SUPABASE: {totalRecords.toLocaleString()}</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 0 LAGUEOS
            </span>
          </div>
        </div>

        <div className="mt-5">
          {canEnter ? (
            <button
              onClick={onEnterDashboard}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_35px_rgba(16,185,129,0.8)] cursor-pointer transition animate-pulse flex items-center gap-2 mx-auto"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>INGRESAR A SICEP // SUB GERENCIA DE SERENAZGO</span>
            </button>
          ) : (
            <div className="text-[10px] text-cyan-400/80 animate-pulse tracking-wider">
              [ EL ESCUDO SE ACTIVARÁ AL COMPLETAR LA CARGA DE DATOS ]
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
