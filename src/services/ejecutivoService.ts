import { ApiClient } from '../core/network/apiClient';
import {
  type ClienteResumenEjecutivo,
  type CuentaResumenEjecutivo,
  type FiltroBusquedaClientes,
  type FiltroBusquedaCuentas,
  type PageResponse,
  type UsuarioResumenEjecutivo,
  parseClienteResumenEjecutivo,
  parseCuentaResumenEjecutivo,
  parsePageResponse,
  parseUsuarioResumenEjecutivo,
  toBuscarClientesPayload,
  toBuscarCuentasPayload,
} from '../models/ejecutivo';

export class EjecutivoService {
  private readonly apiClient: ApiClient;

  constructor(options: { apiClient: ApiClient }) {
    this.apiClient = options.apiClient;
  }

  async buscarClientes(
    filtros: FiltroBusquedaClientes,
  ): Promise<PageResponse<ClienteResumenEjecutivo>> {
    const response = await this.apiClient.postJson<Record<string, unknown>>('/clientes/busqueda', {
      body: toBuscarClientesPayload(filtros),
    });
    return parsePageResponse(response.data, parseClienteResumenEjecutivo);
  }

  async buscarCuentas(
    filtros: FiltroBusquedaCuentas,
  ): Promise<PageResponse<CuentaResumenEjecutivo>> {
    const response = await this.apiClient.postJson<Record<string, unknown>>('/cuentas/busqueda', {
      body: toBuscarCuentasPayload(filtros),
    });
    return parsePageResponse(response.data, parseCuentaResumenEjecutivo);
  }

  async consultarUsuarioPorId(usuarioId: number): Promise<UsuarioResumenEjecutivo> {
    const response = await this.apiClient.postJson<Record<string, unknown>>('/usuarios/consulta', {
      body: { usuarioId },
    });
    return parseUsuarioResumenEjecutivo(response.data ?? {});
  }
}
