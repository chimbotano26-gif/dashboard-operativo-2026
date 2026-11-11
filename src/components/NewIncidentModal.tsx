import React, { useState } from 'react';
import { X, PlusCircle, MapPin, Shield, CheckCircle, Navigation } from 'lucide-react';
import {
  IncidentRecord,
  ZonaType,
  ComisariaType,
  TurnoType,
  MesType,
  DiaSemanaType,
} from '../types';
import {
  ZONAS_LIST,
  COMISARIAS_LIST,
  TURNOS_LIST,
  INCIDENCIAS_LIST,
  SUBSECTORES_CONFIG,
  PATRULLEROS,
  EFECTIVOS,
  MESES_LIST,
} from '../data/mockData';

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIncident: (incident: IncidentRecord) => void;
}

export const NewIncidentModal: React.FC<NewIncidentModalProps> = ({
  isOpen,
  onClose,
  onAddIncident,
}) => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
    2,
    '0'
  )}`;

  const [fecha, setFecha] = useState(todayStr);
  const [hora, setHora] = useState(timeStr);
  const [tipoIncidencia, setTipoIncidencia] = useState(INCIDENCIAS_LIST[0]);
  const [zona, setZona] = useState<ZonaType>('ZONA CENTRO');
  const [subsector, setSubsector] = useState<string>('S2BA');
  const [comisaria, setComisaria] = useState<ComisariaType>('CIA BUENOS AIRES');
  const [turno, setTurno] = useState<TurnoType>('TARDE');
  const [ubicacion, setUbicacion] = useState('Av. Pacífico cruce con Av. Pelícano, Nuevo Chimbote');
  const [patrullero, setPatrullero] = useState(PATRULLEROS[0]);
  const [efectivo, setEfectivo] = useState(EFECTIVOS[0]);
  const [estado, setEstado] = useState<'ATENDIDO' | 'EN PROCESO' | 'DERIVADO PNP'>('ATENDIDO');
  const [descripcion, setDescripcion] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: -9.1265,
    lng: -78.5302,
  });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubsectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSubsector(val);
    const conf = SUBSECTORES_CONFIG[val];
    if (conf) {
      setZona(conf.zona);
      setComisaria(conf.comisaria);
      setCoords({ lat: conf.lat, lng: conf.lng });
      setUbicacion(`${conf.nombre}, Nuevo Chimbote`);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no está soportada en su navegador.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsLoading(false);
      },
      () => {
        // Fallback: Default to Plaza Mayor Nuevo Chimbote
        setCoords({ lat: -9.1265, lng: -78.5302 });
        setGpsLoading(false);
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dateObj = new Date(fecha);
    const mIdx = !isNaN(dateObj.getTime()) ? dateObj.getMonth() : now.getMonth();
    const mes: MesType = MESES_LIST[mIdx] || 'SETIEMBRE';
    const diasMap: DiaSemanaType[] = [
      'DOMINGO',
      'LUNES',
      'MARTES',
      'MIÉRCOLES',
      'JUEVES',
      'VIERNES',
      'SÁBADO',
    ];
    const diaSemana: DiaSemanaType = !isNaN(dateObj.getTime())
      ? diasMap[dateObj.getDay()]
      : 'LUNES';

    const anioVal = dateObj ? dateObj.getFullYear() : 2026;
    const hourNum = parseInt(hora.split(':')[0] || '12', 10);
    const rangoHora = `${String(hourNum).padStart(2, '0')}:00 - ${String((hourNum + 1) % 24).padStart(2, '0')}:00`;
    const desc = descripcion || `Operativo de Serenazgo en ${ubicacion} por reporte de ${tipoIncidencia}.`;

    const newRecord: IncidentRecord = {
      id: `OP-${Date.now().toString().slice(-6)}`,
      codigo: `OP-2026-${Date.now().toString().slice(-4)}`,
      // 25 columnas oficiales:
      fecha,
      anio: anioVal,
      unidad: patrullero,
      lugar: ubicacion,
      columna1: '',
      integrado: 'SI',
      refe: 'Vía pública de Nuevo Chimbote',
      observacion: desc,
      sector: subsector,
      zona,
      hora,
      rango: rangoHora,
      incidencia: tipoIncidencia,
      agente: efectivo,
      servicio: 'PATRULLAJE MOTORIZADO',
      origen: 'CENTRAL 107',
      comisar: comisaria,
      tipoDePa: 'INTEGRADO',
      mes,
      dia: diaSemana,
      fecha2: fecha,
      horaAlerta: hora,
      horaLlegada: hora,
      promedioHoraAten: '00:07:00',
      turno,

      // Compatibilidad:
      subsector,
      comisaria,
      tipoIncidencia,
      ubicacion,
      diaSemana,
      patrullero,
      efectivo,
      estado,
      lat: coords.lat,
      lng: coords.lng,
      descripcion: desc,
      esPersonalizado: true,
    };

    onAddIncident(newRecord);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0b1a33] text-white w-full max-w-2xl max-h-[92vh] rounded-xl border border-cyan-700/60 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#0d274c] to-[#0a1f3d] border-b border-cyan-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-600/40">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-white">
                REGISTRAR NUEVA ATENCIÓN / OPERATIVO
              </h3>
              <p className="text-xs text-cyan-300/80">
                Subgerencia de Serenazgo &bull; Registro en tiempo real
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {success && (
            <div className="p-3 rounded-lg bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="font-bold">¡Operativo registrado exitosamente en el sistema!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Fecha */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-cyan-200 mb-1">
                Fecha del Operativo *
              </label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-[#081527] border border-cyan-800 rounded p-2 text-xs text-white"
              />
            </div>

            {/* Hora */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-cyan-200 mb-1">
                Hora de Intervención *
              </label>
              <input
                type="time"
                required
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full bg-[#081527] border border-cyan-800 rounded p-2 text-xs text-white"
              />
            </div>

            {/* Tipo de Incidencia */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-cyan-200 mb-1">
                Tipo de Incidencia *
              </label>
              <select
                value={tipoIncidencia}
                onChange={(e) => setTipoIncidencia(e.target.value)}
                className="w-full bg-[#081527] border border-cyan-800 rounded p-2 text-xs text-white font-medium"
              >
                {INCIDENCIAS_LIST.map((inc) => (
                  <option key={inc} value={inc}>
                    {inc}
                  </option>
                ))}
              </select>
            </div>

            {/* Subsector Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-cyan-200 mb-1">
                Subsector Cuadrante *
              </label>
              <select
                value={subsector}
                onChange={handleSubsectorChange}
                className="w-full bg-[#081527] border border-cyan-800 rounded p-2 text-xs text-white font-medium"
              >
                {Object.entries(SUBSECTORES_CONFIG).map(([key, item]) => (
                  <option key={key} value={key}>
                    {key} - {item.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Zona */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-cyan-200 mb-1">
                Zona Jurisdiccional *
              </label>
              <select
                value={zona}
                onChange={(e) => setZona(e.target.value as ZonaType)}
                className="w-full bg-[#081527] border border-cyan-800 rounded p-2 text-xs text-white"
              >
                {ZONAS_LIST.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            {/* Comisaría */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-cyan-200 mb-1">
                Comisaría PNP de Apoyo *
              </label>
              <select
                value={comisaria}
                onChange={(e) => setComisaria(e.target.value as ComisariaType)}
                className="w-full bg-[#081527] border border-cyan-800 rounded p-2 text-xs text-white"
              >
                {COMISARIAS_LIST.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Turno */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-cyan-200 mb-1">
                Turno de Servicio *
              </label>
              <select
                value={turno}
                onChange={(e) => setTurno(e.target.value as TurnoType)}
                className="w-full bg-[#081527] border border-cyan-800 rounded p-2 text-xs text-white"
              >
                {TURNOS_LIST.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Dirección / Lugar */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-cyan-200 mb-1">
                Dirección / Lugar de los Hechos *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  placeholder="Ej: Av. Pacífico con Av. Argentina, Urb. Bellamar"
                  className="flex-1 bg-[#081527] border border-cyan-800 rounded p-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={gpsLoading}
                  className="px-3 py-2 rounded bg-cyan-900 hover:bg-cyan-800 border border-cyan-600/50 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shrink-0"
                  title="Obtener coordenadas GPS"
                >
                  <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">GPS</span>
                </button>
              </div>
              <div className="text-[10px] text-cyan-400/80 mt-1">
                Coordenadas en Mapa: Lat: {coords.lat.toFixed(4)}, Lng: {coords.lng.toFixed(4)}
              </div>
            </div>

            {/* Móvil / Patrullero */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-cyan-200 mb-1">
                Unidad Móvil Interviniente
              </label>
              <select
                value={patrullero}
                onChange={(e) => setPatrullero(e.target.value)}
                className="w-full bg-[#081527] border border-cyan-800 rounded p-2 text-xs text-white"
              >
                {PATRULLEROS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Efectivo a Cargo */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-cyan-200 mb-1">
                Personal / Efectivo a Cargo
              </label>
              <select
                value={efectivo}
                onChange={(e) => setEfectivo(e.target.value)}
                className="w-full bg-[#081527] border border-cyan-800 rounded p-2 text-xs text-white"
              >
                {EFECTIVOS.map((ef) => (
                  <option key={ef} value={ef}>
                    {ef}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-cyan-200 mb-1">
                Estado de la Intervención
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['ATENDIDO', 'EN PROCESO', 'DERIVADO PNP'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setEstado(st)}
                    className={`py-2 px-2 rounded text-xs font-bold uppercase border transition-all text-center ${
                      estado === st
                        ? st === 'ATENDIDO'
                          ? 'bg-emerald-900 border-emerald-500 text-emerald-200 shadow'
                          : st === 'EN PROCESO'
                          ? 'bg-amber-900 border-amber-500 text-amber-200 shadow'
                          : 'bg-blue-900 border-blue-500 text-blue-200 shadow'
                        : 'bg-[#081527] border-cyan-900/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Detalle / Observación */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-cyan-200 mb-1">
                Descripción / Detalle de la Ocurrencia
              </label>
              <textarea
                rows={2}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Indicar breve resumen de las acciones tomadas por el personal de Serenazgo..."
                className="w-full bg-[#081527] border border-cyan-800 rounded p-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-cyan-900">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase flex items-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-cyan-200" />
              <span>Guardar en Base de Datos</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
