import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ApiClient, ApiException } from '../core/network/apiClient';
import { SessionStorageService } from '../core/storage/sessionStorageService';
import type { Login2faChallenge, UserSession } from '../models/auth';
import { AuthService } from '../services/authService';

export interface PendingTwoFactorChallenge {
  challenge: Login2faChallenge;
  correo: string;
  password: string;
  forzarCierreSesion: boolean;
}

export interface SessionContextValue {
  apiClient: ApiClient;
  authService: AuthService;
  sesionActual: UserSession | null;
  estaAutenticado: boolean;
  cargando: boolean;
  mensajeAlertaSesion: string | null;
  retoPendiente: PendingTwoFactorChallenge | null;
  iniciarPreLogin: (params: {
    correo: string;
    password: string;
    forzarCierreSesion?: boolean;
  }) => Promise<Login2faChallenge>;
  completarLoginCon2FA: (codigo2FA: string) => Promise<UserSession>;
  reenviarCodigo2FA: () => Promise<Login2faChallenge>;
  cancelarReto2FA: () => void;
  verificarVigenciaSesion: () => Promise<boolean>;
  actualizarSaldoLocal: (nuevoSaldo?: number) => void;
  cerrarSesion: () => Promise<void>;
  limpiarAlertaSesion: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export interface SessionProviderProps {
  children: ReactNode;
  apiClientOverride?: ApiClient;
  authServiceOverride?: AuthService;
  storageOverride?: SessionStorageService;
  enableAutoSync?: boolean;
}

export function SessionProvider({
  children,
  apiClientOverride,
  authServiceOverride,
  storageOverride,
  enableAutoSync = true,
}: SessionProviderProps) {
  const storage = useMemo(
    () => storageOverride ?? apiClientOverride?.sessionStorage ?? new SessionStorageService(),
    [storageOverride, apiClientOverride],
  );

  const [sesionActual, setSesionActual] = useState<UserSession | null>(() =>
    storage.obtenerSesion(),
  );
  const [cargando, setCargando] = useState(false);
  const [mensajeAlertaSesion, setMensajeAlertaSesion] = useState<string | null>(null);
  const [retoPendiente, setRetoPendiente] = useState<PendingTwoFactorChallenge | null>(null);

  const manejarSesionNoAutorizadaRef = useRef<(motivo: string) => void>(() => {});
  manejarSesionNoAutorizadaRef.current = (motivo: string) => {
    storage.limpiarSesion();
    setSesionActual(null);
    setRetoPendiente(null);
    setMensajeAlertaSesion(motivo);
  };

  const apiClient = useMemo(
    () =>
      apiClientOverride ??
      new ApiClient({
        sessionStorage: storage,
        onUnauthorizedSession: (motivo) => {
          manejarSesionNoAutorizadaRef.current(motivo);
        },
      }),
    [apiClientOverride, storage],
  );

  const authService = useMemo(
    () => authServiceOverride ?? new AuthService({ apiClient }),
    [authServiceOverride, apiClient],
  );

  const limpiarAlertaSesion = useCallback(() => {
    setMensajeAlertaSesion(null);
  }, []);

  const actualizarSaldoLocal = useCallback(
    (nuevoSaldo?: number) => {
      const actual = storage.obtenerSesion();
      if (actual && nuevoSaldo !== undefined && !Number.isNaN(nuevoSaldo)) {
        const actualizada: UserSession = { ...actual, saldoCuenta: nuevoSaldo };
        storage.guardarSesion(actualizada);
        setSesionActual(actualizada);
      }
    },
    [storage],
  );

  const iniciarPreLogin = useCallback(
    async ({
      correo,
      password,
      forzarCierreSesion = false,
    }: {
      correo: string;
      password: string;
      forzarCierreSesion?: boolean;
    }): Promise<Login2faChallenge> => {
      setCargando(true);
      setMensajeAlertaSesion(null);
      try {
        const challenge = await authService.solicitarReto2FA({
          correo,
          password,
          forzarCierreSesion,
        });
        setRetoPendiente({
          challenge,
          correo,
          password,
          forzarCierreSesion,
        });
        return challenge;
      } finally {
        setCargando(false);
      }
    },
    [authService],
  );

  const completarLoginCon2FA = useCallback(
    async (codigo2FA: string): Promise<UserSession> => {
      if (!retoPendiente) {
        throw new Error('No hay una solicitud 2FA activa. Inicia sesión nuevamente.');
      }
      setCargando(true);
      try {
        const sesion = await authService.verificar2FAYCrearSesion({
          correo: retoPendiente.correo,
          password: retoPendiente.password,
          codigo2FA,
          forzarCierreSesion: retoPendiente.forzarCierreSesion,
        });
        storage.guardarSesion(sesion);
        setSesionActual(sesion);
        setRetoPendiente(null);
        return sesion;
      } finally {
        setCargando(false);
      }
    },
    [authService, retoPendiente, storage],
  );

  const reenviarCodigo2FA = useCallback(async (): Promise<Login2faChallenge> => {
    if (!retoPendiente) {
      throw new Error('No hay una sesión pendiente por verificar.');
    }
    setCargando(true);
    try {
      const nuevoReto = await authService.solicitarReto2FA({
        correo: retoPendiente.correo,
        password: retoPendiente.password,
        forzarCierreSesion: true,
      });
      setRetoPendiente({
        challenge: nuevoReto,
        correo: retoPendiente.correo,
        password: retoPendiente.password,
        forzarCierreSesion: true,
      });
      return nuevoReto;
    } finally {
      setCargando(false);
    }
  }, [authService, retoPendiente]);

  const cancelarReto2FA = useCallback(() => {
    setRetoPendiente(null);
  }, []);

  const verificarVigenciaSesion = useCallback(async (): Promise<boolean> => {
    const actual = storage.obtenerSesion();
    if (!actual) {
      setSesionActual(null);
      return false;
    }
    try {
      const actualizada = await authService.sincronizarEstadoSesion(actual);
      storage.guardarSesion(actualizada);
      setSesionActual(actualizada);
      return true;
    } catch (error) {
      if (error instanceof ApiException && error.statusCode === 401) {
        storage.limpiarSesion();
        setSesionActual(null);
        setMensajeAlertaSesion(error.message);
        return false;
      }
      return true;
    }
  }, [authService, storage]);

  const cerrarSesion = useCallback(async () => {
    setCargando(true);
    try {
      await authService.cerrarSesionEnServidor();
    } finally {
      storage.limpiarSesion();
      setSesionActual(null);
      setRetoPendiente(null);
      setCargando(false);
    }
  }, [authService, storage]);

  const estaAutenticado = sesionActual !== null;

  useEffect(() => {
    if (!estaAutenticado || !enableAutoSync) {
      return;
    }

    const onWindowFocus = () => {
      void verificarVigenciaSesion();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void verificarVigenciaSesion();
      }
    };

    window.addEventListener('focus', onWindowFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    const intervalId = window.setInterval(() => {
      void verificarVigenciaSesion();
    }, 15000);

    return () => {
      window.removeEventListener('focus', onWindowFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [estaAutenticado, enableAutoSync, verificarVigenciaSesion]);

  const value = useMemo<SessionContextValue>(
    () => ({
      apiClient,
      authService,
      sesionActual,
      estaAutenticado,
      cargando,
      mensajeAlertaSesion,
      retoPendiente,
      iniciarPreLogin,
      completarLoginCon2FA,
      reenviarCodigo2FA,
      cancelarReto2FA,
      verificarVigenciaSesion,
      actualizarSaldoLocal,
      cerrarSesion,
      limpiarAlertaSesion,
    }),
    [
      apiClient,
      authService,
      sesionActual,
      estaAutenticado,
      cargando,
      mensajeAlertaSesion,
      retoPendiente,
      iniciarPreLogin,
      completarLoginCon2FA,
      reenviarCodigo2FA,
      cancelarReto2FA,
      verificarVigenciaSesion,
      actualizarSaldoLocal,
      cerrarSesion,
      limpiarAlertaSesion,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession debe utilizarse dentro de un SessionProvider.');
  }
  return ctx;
}
