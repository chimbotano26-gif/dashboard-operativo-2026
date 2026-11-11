import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'ADMIN' | 'VIEWER';

interface AuthContextType {
  role: UserRole;
  isAdmin: boolean;
  adminEmail: string;
  loginAsAdmin: (password: string) => boolean;
  changeAdminPassword: (oldPass: string, newPass: string) => { success: boolean; message: string };
  setFirstTimePassword: (newPass: string) => boolean;
  logoutToViewer: () => void;
  requireAdmin: (actionName: string, onAuthorized?: () => void) => boolean;
  isAuthModalOpen: boolean;
  openAuthModal: (actionName?: string) => void;
  closeAuthModal: () => void;
  pendingActionName: string;
  hasCustomPassword: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'chimbotano26@gmail.com';
const STORAGE_KEY_ROLE = 'serenazgo_auth_role';
const STORAGE_KEY_PASS = 'serenazgo_admin_secret_key';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Por defecto al entrar o al recargar la página: MODO VISITANTE / LECTURA ('VIEWER')
  const [role, setRole] = useState<UserRole>('VIEWER');

  const [hasCustomPassword, setHasCustomPassword] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEY_PASS));
    } catch {
      return false;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingActionName, setPendingActionName] = useState('Modificar o ingresar datos');
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ROLE, role);
    } catch {
      // Ignore
    }
  }, [role]);

  const getStoredPassword = (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEY_PASS);
    } catch {
      return null;
    }
  };

  const loginAsAdmin = (password: string): boolean => {
    const clean = password.trim();
    const stored = getStoredPassword();

    // Clave secreta oficial requerida por el usuario Administrador: Alianza26
    const isMasterMatch = clean === 'Alianza26' || clean.toLowerCase() === 'alianza26';
    const isStoredMatch = stored ? (clean === stored || clean.toLowerCase() === stored.toLowerCase()) : false;

    if (isMasterMatch || isStoredMatch) {
      setRole('ADMIN');
      try {
        localStorage.setItem(STORAGE_KEY_ROLE, 'ADMIN');
        // Si ingresó con la clave oficial Alianza26, resetea/actualiza la clave guardada en el navegador
        if (isMasterMatch) {
          localStorage.setItem(STORAGE_KEY_PASS, 'Alianza26');
          setHasCustomPassword(true);
        }
      } catch {
        // Ignore
      }
      setIsAuthModalOpen(false);
      if (pendingCallback) {
        pendingCallback();
        setPendingCallback(null);
      }
      return true;
    }
    return false;
  };

  const changeAdminPassword = (oldPass: string, newPass: string): { success: boolean; message: string } => {
    const cleanOld = oldPass.trim();
    const cleanNew = newPass.trim();

    if (cleanNew.length < 3) {
      return { success: false, message: 'La nueva clave debe tener al menos 3 caracteres.' };
    }

    const stored = getStoredPassword();
    const isMaster = cleanOld === 'Alianza26' || cleanOld.toLowerCase() === 'alianza26';
    const currentCorrect = stored ? (cleanOld === stored || isMaster) : isMaster;

    if (!currentCorrect) {
      return { success: false, message: 'La clave actual no es correcta.' };
    }

    try {
      localStorage.setItem(STORAGE_KEY_PASS, cleanNew);
      setHasCustomPassword(true);
      return { success: true, message: '¡Tu clave secreta de Administrador ha sido actualizada con éxito!' };
    } catch {
      return { success: false, message: 'Error al guardar en el navegador.' };
    }
  };

  const setFirstTimePassword = (newPass: string): boolean => {
    const clean = newPass.trim();
    if (clean.length < 3) return false;
    try {
      localStorage.setItem(STORAGE_KEY_PASS, clean);
      setHasCustomPassword(true);
      return true;
    } catch {
      return false;
    }
  };

  const logoutToViewer = () => {
    setRole('VIEWER');
    try {
      localStorage.setItem('serenazgo_auth_role', 'VIEWER');
    } catch {
      // Ignore
    }
  };

  const openAuthModal = (actionName = 'Acceso administrativo') => {
    setPendingActionName(actionName);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setPendingCallback(null);
  };

  const requireAdmin = (actionName: string, onAuthorized?: () => void): boolean => {
    if (role === 'ADMIN') {
      if (onAuthorized) onAuthorized();
      return true;
    }
    setPendingActionName(actionName);
    if (onAuthorized) {
      setPendingCallback(() => onAuthorized);
    }
    setIsAuthModalOpen(true);
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        isAdmin: role === 'ADMIN',
        adminEmail: ADMIN_EMAIL,
        loginAsAdmin,
        changeAdminPassword,
        setFirstTimePassword,
        logoutToViewer,
        requireAdmin,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        pendingActionName,
        hasCustomPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
