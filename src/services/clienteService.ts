import { ApiClient } from '../core/network/apiClient';
import {
  type ClientePerfil,
  parseClientePerfil,
  toActualizarClientePayload,
} from '../models/cliente';

export class ClienteService {
  private readonly apiClient: ApiClient;

  constructor(options: { apiClient: ApiClient }) {
    this.apiClient = options.apiClient;
  }

  async consultarPerfil(clienteId: number): Promise<ClientePerfil> {
    const response = await this.apiClient.postJson<Record<string, unknown>>('/clientes/consulta', {
      body: { clienteId },
    });
    return parseClientePerfil(response.data ?? {});
  }

  async actualizarPerfil(clienteId: number, perfil: ClientePerfil): Promise<ClientePerfil> {
    const response = await this.apiClient.putJson<Record<string, unknown>>('/clientes/actualizar', {
      body: {
        clienteId,
        datos: toActualizarClientePayload(perfil),
      },
    });
    return parseClientePerfil(response.data ?? {});
  }

  async cambiarPassword(params: {
    usuarioId: number;
    passwordActual: string;
    passwordNueva: string;
  }): Promise<string> {
    const response = await this.apiClient.putJson<unknown>('/usuarios/password', {
      body: {
        usuarioId: params.usuarioId,
        cambio: {
          passwordActual: params.passwordActual,
          passwordNueva: params.passwordNueva,
        },
      },
    });
    return String(response.message ?? 'Contraseña actualizada exitosamente.');
  }

  async darDeBaja(clienteId: number): Promise<string> {
    const response = await this.apiClient.deleteJson<unknown>('/clientes/baja', {
      body: { clienteId },
    });
    return String(response.message ?? 'Cliente dado de baja lógicamente.');
  }
}
