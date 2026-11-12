{/* KPI 4: TURNO CRÍTICO (TACÓMETRO RADAR DE ALTA DENSIDAD) */}
              <div className="border-2 border-cyan-400/80 bg-gradient-to-b from-[#0b2950] via-[#061830] to-[#030b17] rounded-xl p-2.5 text-center flex flex-col justify-between min-h-[155px] relative overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.28),inset_0_0_20px_rgba(6,182,212,0.12)]">
                {/* Esquinas tácticas internas */}
                <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-300/80" />
                <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-300/80" />
                <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-300/80" />
                <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-300/80" />

                <span className="text-[10px] font-mono font-black text-cyan-200 uppercase tracking-widest block">
                  TURNO CRÍTICO
                </span>

                {/* Tacómetro Radar Grande */}
                <div className="relative w-28 h-28 mx-auto my-0.5 flex items-center justify-center">
                  <svg className="w-28 h-28 -rotate-90 drop-shadow-[0_0_12px_rgba(34,211,238,0.65)]" viewBox="0 0 110 110">
                    {/* Anillo exterior graduado */}
                    <circle cx="55" cy="55" r="50" stroke="#0e7490" strokeWidth="1.5" strokeDasharray="3 5" fill="transparent" />
                    {/* Pista base */}
                    <circle cx="55" cy="55" r="43" stroke="#082038" strokeWidth="7" fill="transparent" />
                    {/* Arco de progreso principal */}
                    <circle
                      cx="55"
                      cy="55"
                      r="43"
                      stroke="#22d3ee"
                      strokeWidth="7"
                      strokeDasharray={`${(hudData.topTurnoPct / 100) * (2 * Math.PI * 43)} ${2 * Math.PI * 43}`}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                    {/* Anillo intermedio segmentado */}
                    <circle
                      cx="55"
                      cy="55"
                      r="33"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      strokeDasharray="10 6"
                      fill="rgba(6,182,212,0.12)"
                    />
                    {/* Núcleo interno */}
                    <circle cx="55" cy="55" r="25" stroke="#67e8f9" strokeWidth="1" strokeOpacity="0.5" fill="#041122" />
                  </svg>

                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-black font-mono text-white leading-none drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]">
                      {hudData.topTurnoPct}%
                    </span>
                    <span className="text-[9px] font-mono font-black text-cyan-300 mt-0.5 tracking-wider">
                      {hudData.topTurno}
                    </span>
                  </div>
                </div>

                {/* Pie de telemetría para eliminar el espacio vacío inferior */}
                <div className="border-t border-cyan-500/30 pt-1 flex items-center justify-between px-2 text-[9px] font-mono text-cyan-300/90">
                  <span>ALERTA ALTA</span>
                  <span className="text-emerald-300 font-bold">
                    {hudData.turnosCount[hudData.topTurno as keyof typeof hudData.turnosCount] || 0} CASOS
                  </span>
                </div>
              </div>
