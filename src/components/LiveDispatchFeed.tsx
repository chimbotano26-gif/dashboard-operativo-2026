import React, { useState } from 'react';
import {
  Radio,
  Car,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  PhoneCall,
  Send,
  Plus,
  Shield,
  Volume2,
} from 'lucide-react';
import { IncidentRecord, PatrolUnit } from '../types';
import { soundManager } from '../utils/audioAlert';

interface LiveDispatchFeedProps {
  records: IncidentRecord[];
  patrolUnits: PatrolUnit[];
  onAddIncident: (incident: IncidentRecord) => void;
  onOpenNewIncidentModal: () => void;
}

export const LiveDispatchFeed: React.FC<LiveDispatchFeedProps> = ({
  records,
  patrolUnits,
  onAddIncident,
  onOpenNewIncidentModal,
}) => {
  const [activeTab, setActiveTab] = useState<'DISPATCH_QUEUE' | 'FLEET_STATUS'>('DISPATCH_QUEUE');
  const [quickLocation, setQuickLocation] = useState('');
  const [quickIncidence, setQuickIncidence] = useState('ROBO / HURTO');
  const [quickUnit, setQuickUnit] = useState('Móvil 01');

  // Top 15 recent incidents
  const recentDispatches = records.slice(0, 15);

  const handleQuickDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLocation) return;

    soundManager.playEmergency();

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const newRecord: IncidentRecord = {
      id: `DISP-${Date.now().toString().slice(-6)}`,
      codigo: `DESPACHO-${Date.now().toString().slice(-4)}`,
      // 25 columnas oficiales:
      fecha: todayStr,
      anio: now.getFullYear(),
      unidad: quickUnit,
      lugar: quickLocation,
      columna1: '',
      integrado: 'SI',
      refe: 'Despacho de emergencia',
      observacion: `Despacho de emergencia asignado a ${quickUnit} por alerta de ${quickIncidence} en ${quickLocation}.`,
      sector: 'S2BA',
      zona: 'ZONA CENTRO',
      hora: timeStr,
      rango: `${String(now.getHours()).padStart(2, '0')}:00 - ${String((now.getHours() + 1) % 24).padStart(2, '0')}:00`,
      incidencia: quickIncidence,
      agente: 'Operador de Turno',
      servicio: 'PATRULLAJE MOTORIZADO',
      origen: 'CENTRAL 107',
      comisar: 'CIA BUENOS AIRES',
      tipoDePa: 'INTEGRADO',
      mes: 'SETIEMBRE',
      dia: 'LUNES',
      fecha2: todayStr,
      horaAlerta: timeStr,
      horaLlegada: timeStr,
      promedioHoraAten: '00:05:00',
      turno: 'TARDE',

      // Compatibilidad:
      subsector: 'S2BA',
      comisaria: 'CIA BUENOS AIRES',
      tipoIncidencia: quickIncidence,
      ubicacion: `${quickLocation}, Nuevo Chimbote`,
      diaSemana: 'LUNES',
      patrullero: quickUnit,
      efectivo: 'Operador de Turno',
      estado: 'EN PROCESO',
      lat: -9.1265 + (Math.random() - 0.5) * 0.005,
      lng: -78.5302 + (Math.random() - 0.5) * 0.005,
      prioridad: 'ALTA',
      descripcion: `Despacho de emergencia asignado a ${quickUnit} por alerta de ${quickIncidence} en ${quickLocation}.`,
      esPersonalizado: true,
    };

    onAddIncident(newRecord);
    setQuickLocation('');
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-3 min-w-0 text-white">
      {/* Left Column: Dispatch Stream (8 cols) */}
      <div className="flex-1 bg-[#0a182d] rounded-xl border border-cyan-500/30 p-3.5 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-900/50 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-600/40">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cyan-200 flex items-center gap-2">
                <span>CONSOLA DE DESPACHO & EVENTOS EN VIVO</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Transmisiones de radio y asignación de patrullaje en tiempo real &bull; Frecuencia 156.800 MHz
              </p>
            </div>
          </div>

          <button
            onClick={onOpenNewIncidentModal}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Registro</span>
          </button>
        </div>

        {/* Quick Dispatch Action Bar */}
        <form
          onSubmit={handleQuickDispatch}
          className="bg-[#061120] border border-cyan-900/60 rounded-xl p-2.5 mb-3 flex flex-col sm:flex-row items-center gap-2 shadow-inner"
        >
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-300 shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Despacho Rápido:</span>
          </div>

          <input
            type="text"
            required
            value={quickLocation}
            onChange={(e) => setQuickLocation(e.target.value)}
            placeholder="Lugar o calle de la emergencia (ej: Ovalo La Familia, Av. Pacífico)..."
            className="flex-1 w-full bg-[#040a14] border border-cyan-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />

          <select
            value={quickIncidence}
            onChange={(e) => setQuickIncidence(e.target.value)}
            className="w-full sm:w-auto bg-[#040a14] border border-cyan-800 rounded-lg px-2 py-1.5 text-xs text-cyan-300 font-bold"
          >
            <option value="ROBO / HURTO">Robo / Hurto</option>
            <option value="AGRESION">Agresión</option>
            <option value="AUXILIO, APOYO MEDICO">Auxilio Médico</option>
            <option value="CONSUMIDORES DE DROGAS/ALCOHOL">Drogas / Alcohol</option>
            <option value="VIOLENCIA FAMILIAR">Violencia Familiar</option>
          </select>

          <select
            value={quickUnit}
            onChange={(e) => setQuickUnit(e.target.value)}
            className="w-full sm:w-auto bg-[#040a14] border border-cyan-800 rounded-lg px-2 py-1.5 text-xs text-emerald-300 font-bold"
          >
            {patrolUnits.map((u) => (
              <option key={u.id} value={u.codigo}>
                {u.codigo} ({u.subsectorActual})
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(244,63,94,0.3)] shrink-0 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>DESPACHAR</span>
          </button>
        </form>

        {/* Live Stream List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[560px] pr-1">
          {recentDispatches.map((disp, i) => {
            const isHigh = disp.prioridad === 'ALTA' || disp.tipoIncidencia.includes('ROBO') || disp.tipoIncidencia.includes('AGRESION');
            return (
              <div
                key={disp.id}
                className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  isHigh
                    ? 'bg-[#0e1726] border-rose-500/40 hover:border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.15)]'
                    : 'bg-[#071322] border-cyan-900/50 hover:border-cyan-500/60'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isHigh ? 'bg-rose-950/80 text-rose-400 border border-rose-600/50' : 'bg-cyan-950/80 text-cyan-400 border border-cyan-700/50'
                    }`}
                  >
                    {isHigh ? <AlertTriangle className="w-4 h-4 animate-pulse" /> : <Car className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold text-slate-400">{disp.codigo || disp.id}</span>
                      <strong className="text-xs font-black uppercase text-white tracking-wide">{disp.tipoIncidencia}</strong>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {disp.subsector}
                      </span>
                      {disp.esPersonalizado && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          EN VIVO
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{disp.ubicacion}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {disp.descripcion}
                    </div>
                  </div>
                </div>

                {/* Right metadata pill */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800 gap-1">
                  <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-400">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>{disp.hora} hrs</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      disp.estado === 'ATENDIDO'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/40'
                        : disp.estado === 'EN PROCESO'
                        ? 'bg-amber-950 text-amber-300 border border-amber-600/40 animate-pulse'
                        : 'bg-blue-950 text-blue-300 border border-blue-600/40'
                    }`}
                  >
                    {disp.estado}
                  </span>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {disp.patrullero ? disp.patrullero.split(' - ')[0] : 'Móvil 01'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Fleet & Communications Status (4 cols) */}
      <div className="w-full lg:w-80 bg-[#0a182d] rounded-xl border border-cyan-500/30 p-3.5 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-cyan-900/50 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-cyan-200">
                FLOTA & ESTADO OPERATIVO
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">7 Unidades</span>
          </div>

          {/* Units list */}
          <div className="space-y-2">
            {patrolUnits.map((unit) => {
              const isPatrolling = unit.estado === 'PATRULLANDO';
              return (
                <div
                  key={unit.id}
                  className="p-2 rounded-lg bg-[#071322] border border-cyan-900/50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isPatrolling ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    ></span>
                    <div>
                      <div className="font-black text-white">{unit.codigo}</div>
                      <div className="text-[10px] text-slate-400">{unit.subsectorActual} &bull; {unit.placa}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      isPatrolling
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/40'
                        : 'bg-amber-950 text-amber-300 border border-amber-600/40'
                    }`}
                  >
                    {unit.estado}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Central Radios Contact Box */}
          <div className="mt-4 p-3 bg-[#061120] border border-cyan-800/40 rounded-xl space-y-2">
            <div className="text-[10px] font-black uppercase text-cyan-300 tracking-wider flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>CENTRAL DE EMERGENCIAS (24 HORAS)</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
              <a href="tel:927420002" className="flex items-center gap-1 text-slate-300 hover:text-cyan-300 bg-[#091e36] px-2 py-1 rounded border border-cyan-800/60">
                <PhoneCall className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>927 420 002</span>
              </a>
              <a href="tel:927640006" className="flex items-center gap-1 text-slate-300 hover:text-cyan-300 bg-[#091e36] px-2 py-1 rounded border border-cyan-800/60">
                <PhoneCall className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>927 640 006</span>
              </a>
              <a href="tel:935912001" className="flex items-center gap-1 text-slate-300 hover:text-cyan-300 bg-[#091e36] px-2 py-1 rounded border border-cyan-800/60">
                <PhoneCall className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>935 912 001</span>
              </a>
              <a href="tel:916140004" className="flex items-center gap-1 text-slate-300 hover:text-cyan-300 bg-[#091e36] px-2 py-1 rounded border border-cyan-800/60">
                <PhoneCall className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>916 140 004</span>
              </a>
            </div>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
              Coordinación interinstitucional con Comisaría PNP Buenos Aires y Villa María.
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-cyan-900/40 text-center text-[10px] text-slate-500">
          Base Central Serenazgo: Plaza Mayor s/n, Nuevo Chimbote
        </div>
      </div>
    </div>
  );
};
