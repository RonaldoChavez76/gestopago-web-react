import { haExpiradoLocalmente, type UserSession } from '../../models/auth';

const SESSION_STORAGE_KEY = 'gestopago_web_session';

export class SessionStorageService {
  private cachedSession: UserSession | null = null;

  constructor() {
    this.cachedSession = this.leerDesdeBrowserStorage();
  }

  private leerDesdeBrowserStorage(): UserSession | null {
    try {
      const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as UserSession;
      if (!parsed || typeof parsed.accessToken !== 'string') {
        return null;
      }
      if (haExpiradoLocalmente(parsed)) {
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  get currentSession(): UserSession | null {
    return this.obtenerSesion();
  }

  obtenerSesion(): UserSession | null {
    const sesion = this.cachedSession ?? this.leerDesdeBrowserStorage();
    if (sesion && haExpiradoLocalmente(sesion)) {
      this.limpiarSesion();
      return null;
    }
    this.cachedSession = sesion;
    return sesion;
  }

  guardarSesion(session: UserSession): void {
    this.cachedSession = session;
    try {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
    }
  }

  limpiarSesion(): void {
    this.cachedSession = null;
    try {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
    }
  }
}
