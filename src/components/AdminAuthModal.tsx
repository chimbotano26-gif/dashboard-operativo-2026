import React, { useState } from 'react';
import { useAuth } from '../utils/authContext';
import { ShieldCheck, ShieldAlert, Lock, UserCheck, AlertCircle, KeyRound, Eye, EyeOff, Settings, CheckCircle2 } from 'lucide-react';

export const AdminAuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    loginAsAdmin,
    changeAdminPassword,
    pendingActionName,
    isAdmin,
    logoutToViewer,
    adminEmail,
    hasCustomPassword,
  } = useAuth();

  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Modo cambiar/configurar clave personal
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = loginAsAdmin(password);
    if (!ok) {
      setError(true);
    } else {
      setError(false);
      setPassword('');
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError('');
    setChangeSuccess('');

    if (newPass !== confirmPass) {
      setChangeError('La confirmación no coincide con la nueva clave.');
      return;
    }
    if (newPass.length < 3) {
      setChangeError('La nueva clave debe tener al menos 3 caracteres.');
      return;
    }

    const res = changeAdminPassword(currentPass, newPass);
    if (!res.success) {
      setChangeError(res.message);
    } else {
      setChangeSuccess(res.message);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => {
        setIsChangingPass(false);
        setChangeSuccess('');
      }, 1600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#0b1f3b] border-2 border-cyan-500/70 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#07162b] via-[#0d2a4d] to-[#0a203a] p-4 border-b border-cyan-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-600/50 text-cyan-300">
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-cyan-100 font-sans">
                Control de Seguridad y Acceso
              </h3>
              <p className="text-[10px] text-cyan-300/80">
                Subgerencia de Serenazgo &bull; Nuevo Chimbote
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {isAdmin ? (
            <div className="space-y-3">
              <div className="bg-emerald-950/60 border border-emerald-500/50 p-3.5 rounded-lg flex flex-col gap-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Sesión de Administrador Central Activa</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Tiene privilegios totales para registrar operativos, importar archivos Excel, modificar y eliminar datos de la jurisdicción.
                </p>
              </div>

              {/* Botón para cambiar contraseña secreta */}
              {!isChangingPass ? (
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setIsChangingPass(true)}
                    className="text-[11px] font-bold text-cyan-300 hover:text-cyan-100 flex items-center gap-1.5 underline"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>{hasCustomPassword ? 'Cambiar mi clave secreta' : 'Personalizar mi propia clave secreta'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      logoutToViewer();
                      closeAuthModal();
                    }}
                    className="px-3 py-1.5 rounded bg-rose-900/80 hover:bg-rose-800 text-rose-100 font-bold border border-rose-600 transition-colors text-[11px]"
                  >
                    Cerrar Sesión Admin
                  </button>
                </div>
              ) : (
                <form onSubmit={handleChangePasswordSubmit} className="bg-[#07162b] p-3 rounded-lg border border-cyan-800 space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-cyan-900">
                    <span className="font-bold text-cyan-200 text-[11px]">
                      Configurar Clave Privada (Solo tú la verás)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsChangingPass(false)}
                      className="text-slate-400 hover:text-white text-[10px]"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-300 uppercase mb-0.5">Clave Actual:</label>
                    <input
                      type="password"
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      placeholder="Ingrese clave actual..."
                      required
                      className="w-full bg-[#051120] border border-cyan-700/60 rounded px-2.5 py-1.5 text-white text-xs focus:ring-1 focus:ring-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-300 uppercase mb-0.5">Nueva Clave Secreta:</label>
                    <input
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="Escriba su nueva clave secreta..."
                      required
                      className="w-full bg-[#051120] border border-cyan-700/60 rounded px-2.5 py-1.5 text-white text-xs focus:ring-1 focus:ring-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-300 uppercase mb-0.5">Confirmar Nueva Clave:</label>
                    <input
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Repita la nueva clave..."
                      required
                      className="w-full bg-[#051120] border border-cyan-700/60 rounded px-2.5 py-1.5 text-white text-xs focus:ring-1 focus:ring-cyan-400"
                    />
                  </div>

                  {changeError && (
                    <div className="text-rose-400 text-[10px] font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{changeError}</span>
                    </div>
                  )}

                  {changeSuccess && (
                    <div className="text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{changeSuccess}</span>
                    </div>
                  )}

                  <div className="pt-1 flex justify-end">
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] flex items-center gap-1 shadow"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Guardar Mi Clave Secreta</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <>
              <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-lg flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-200">
                    Acción Restringida: {pendingActionName}
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Por protocolo de seguridad, solo el <strong>Usuario Administrador</strong> tiene permisos para ingresar, modificar datos o subir bases de datos Excel. Los demás usuarios operan exclusivamente en <strong>Modo Lectura</strong>.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-cyan-200 uppercase mb-1">
                    Usuario Administrador:
                  </label>
                  <div className="flex items-center gap-2 bg-[#051120] border border-cyan-800/80 rounded px-2.5 py-1.5 text-slate-300 font-mono text-[11px]">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{adminEmail}</span>
                    <span className="ml-auto text-[9px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-700">
                      ADMIN ÚNICO
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-cyan-200 uppercase mb-1">
                    Clave Secreta de Administrador:
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(false);
                      }}
                      placeholder="Ingrese su clave: Admin2026* o Alianza26"
                      autoFocus
                      className="w-full bg-[#051120] border border-cyan-700 rounded px-3 py-2 pr-10 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      title={showPassword ? 'Ocultar clave' : 'Mostrar clave'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-cyan-300/80 mt-1 flex items-center justify-between">
                    <span>Clave oficial: <strong className="text-cyan-200 font-mono">Admin2026*</strong> o <strong className="text-cyan-200 font-mono">Alianza26</strong></span>
                  </p>
                  {error && (
                    <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-bold mt-1.5 animate-shake">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Clave incorrecta. Solo el Administrador autorizado puede acceder.</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={closeAuthModal}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    Permanecer en Modo Consulta
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-cyan-950/60"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Acceder como Admin</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
