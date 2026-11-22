export type BackendEnvironmentId = 'renderCloud' | 'localHost';

export interface BackendEnvironmentOption {
  id: BackendEnvironmentId;
  etiqueta: string;
  baseUrl: string;
}

export const BACKEND_ENVIRONMENTS: Record<BackendEnvironmentId, BackendEnvironmentOption> = {
  renderCloud: {
    id: 'renderCloud',
    etiqueta: 'Render Cloud (Producción)',
    baseUrl: 'https://apphasanigestopagos.onrender.com',
  },
  localHost: {
    id: 'localHost',
    etiqueta: 'Servidor Local (Puerto 8080)',
    baseUrl: 'http://localhost:8080',
  },
};

export const PLATAFORMA_WEB = 'WEB' as const;

const ENV_STORAGE_KEY = 'gestopago_web_env';
const listeners = new Set<(env: BackendEnvironmentOption) => void>();

function resolverEntornoInicial(): BackendEnvironmentId {
  try {
    const saved = window.sessionStorage.getItem(ENV_STORAGE_KEY);
    if (saved === 'renderCloud' || saved === 'localHost') {
      return saved;
    }
  } catch {
  }

  const overrideUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (overrideUrl && overrideUrl.includes('localhost')) {
    return 'localHost';
  }
  return 'renderCloud';
}

let currentEnvId: BackendEnvironmentId = resolverEntornoInicial();

export function getEnvironment(): BackendEnvironmentOption {
  const opcion = BACKEND_ENVIRONMENTS[currentEnvId];
  const overrideUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (overrideUrl && currentEnvId === 'renderCloud' && !leerEntornoGuardado()) {
    return {
      ...opcion,
      baseUrl: overrideUrl.replace(/\/+$/, ''),
    };
  }
  return opcion;
}

function leerEntornoGuardado(): BackendEnvironmentId | null {
  try {
    const saved = window.sessionStorage.getItem(ENV_STORAGE_KEY);
    if (saved === 'renderCloud' || saved === 'localHost') {
      return saved;
    }
  } catch {
  }
  return null;
}

export function setEnvironment(id: BackendEnvironmentId): void {
  currentEnvId = id;
  try {
    window.sessionStorage.setItem(ENV_STORAGE_KEY, id);
  } catch {
  }
  const actual = getEnvironment();
  listeners.forEach((listener) => listener(actual));
}

export function getBaseUrl(): string {
  return getEnvironment().baseUrl;
}

export function buildEndpoint(
  path: string,
  queryParameters?: Record<string, string | number | boolean | undefined | null>,
): string {
  const base = getBaseUrl().replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);
  if (queryParameters) {
    Object.entries(queryParameters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

export function subscribeEnvironment(
  listener: (env: BackendEnvironmentOption) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
