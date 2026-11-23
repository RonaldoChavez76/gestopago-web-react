import { ApiClient, ApiException } from '../core/network/apiClient';
import type { CatalogProduct } from '../models/product';
import {
  type PurchaseTransactionResult,
  parsePurchaseTransactionResult,
} from '../models/transaction';

export interface ProcesarCompraParams {
  producto: CatalogProduct;
  numeroCuenta: string;
  monto: number;
  destino: string;
  codigo2FA?: string;
  simular?: boolean;
}

export interface SolicitudOtpCompraResultado {
  codigoOtp: string;
  correoEnviado: boolean;
  correoDestinoEnmascarado?: string;
  mensaje: string;
}

export interface ConsultarHistorialParams {
  clienteId?: number;
  numeroCuenta?: string;
}

export class TransactionService {
  private readonly apiClient: ApiClient;

  constructor(options: { apiClient: ApiClient }) {
    this.apiClient = options.apiClient;
  }

  async solicitarReto2FAParaCompra(numeroCuenta: string): Promise<SolicitudOtpCompraResultado> {
    const response = await this.apiClient.postJson<Record<string, unknown>>(
      '/api/seguridad/2fa/solicitar',
      {
        body: { numeroCuenta: numeroCuenta.trim(), motivo: 'COMPRA' },
      },
    );
    const data = response.data ?? {};
    const correoEnmascaradoRaw = data.correoDestinoEnmascarado;
    return {
      codigoOtp: String(data.codigoOtp ?? ''),
      correoEnviado: Boolean(data.correoEnviado),
      correoDestinoEnmascarado:
        typeof correoEnmascaradoRaw === 'string' && correoEnmascaradoRaw.trim().length > 0
          ? correoEnmascaradoRaw.trim()
          : undefined,
      mensaje: String(data.mensaje ?? 'Código OTP 2FA generado.'),
    };
  }

  async solicitarCodigo2FAParaCompra(numeroCuenta: string): Promise<string> {
    const resultado = await this.solicitarReto2FAParaCompra(numeroCuenta);
    return resultado.codigoOtp;
  }

  async procesarCompra({
    producto,
    numeroCuenta,
    monto,
    destino,
    codigo2FA,
    simular = true,
  }: ProcesarCompraParams): Promise<PurchaseTransactionResult> {
    const tipoOperacion = producto.esRecarga ? 'RECARGA' : 'PAGO_SERVICIO';
    const codigoLimpio = codigo2FA?.trim();

    try {
      const response = producto.esRecarga
        ? await this.apiClient.postJson<Record<string, unknown>>(
            '/api/gestopago/transacciones/recarga',
            {
              body: {
                idProducto: producto.idProducto,
                idServicio: producto.idServicio,
                telefono: destino.trim(),
                monto,
                numeroCuenta: numeroCuenta.trim(),
                ...(codigoLimpio ? { codigo2FA: codigoLimpio } : {}),
                simular,
              },
            },
          )
        : await this.apiClient.postJson<Record<string, unknown>>(
            '/api/gestopago/transacciones/servicio',
            {
              body: {
                idProducto: producto.idProducto,
                idServicio: producto.idServicio,
                referencia: destino.trim(),
                montoPago: monto,
                numeroCuenta: numeroCuenta.trim(),
                ...(codigoLimpio ? { codigo2FA: codigoLimpio } : {}),
                simular,
              },
            },
          );

      return parsePurchaseTransactionResult(response.data ?? {}, {
        nombreProductoFallback: producto.nombre,
        idProductoFallback: producto.idProducto,
        idServicioFallback: producto.idServicio,
      });
    } catch (error) {
      if (error instanceof ApiException) {
        if (error.statusCode === 401) {
          throw error;
        }
        const ahora = new Date().toISOString().replace('T', ' ').split('.')[0];
        if (error.statusCode === 504) {
          return {
            upc: 'PENDIENTE-CONCILIACION',
            tipoOperacion,
            idProducto: producto.idProducto,
            idServicio: producto.idServicio,
            nombreProducto: producto.nombre,
            exitoso: false,
            estadoRaw: 'TIMEOUT',
            estadoVisual: 'pendiente',
            mensaje: error.message,
            monto,
            numeroCuenta,
            fechaMostrar: ahora,
            destinoMostrar: destino.trim(),
          };
        }
        if (error.statusCode === 502 || error.statusCode === 503 || error.statusCode >= 500) {
          return {
            upc: 'ERROR-COMUNICACION',
            tipoOperacion,
            idProducto: producto.idProducto,
            idServicio: producto.idServicio,
            nombreProducto: producto.nombre,
            exitoso: false,
            estadoRaw: 'ERROR',
            estadoVisual: 'errorComunicacion',
            mensaje: error.message,
            monto,
            numeroCuenta,
            fechaMostrar: ahora,
            destinoMostrar: destino.trim(),
          };
        }
        return {
          upc: 'RECHAZADA',
          tipoOperacion,
          idProducto: producto.idProducto,
          idServicio: producto.idServicio,
          nombreProducto: producto.nombre,
          exitoso: false,
          estadoRaw: 'RECHAZADA',
          estadoVisual: 'rechazada',
          mensaje: error.message,
          monto,
          numeroCuenta,
          fechaMostrar: ahora,
          destinoMostrar: destino.trim(),
        };
      }
      throw error;
    }
  }

  async obtenerHistorialComprasExitosas(
    params: ConsultarHistorialParams = {},
  ): Promise<PurchaseTransactionResult[]> {
    const queryParameters: Record<string, string> = {};
    if (params.clienteId !== undefined && params.clienteId !== null) {
      queryParameters.clienteId = String(params.clienteId);
    }
    if (params.numeroCuenta && params.numeroCuenta.trim().length > 0) {
      queryParameters.numeroCuenta = params.numeroCuenta.trim();
    }

    try {
      const response = await this.apiClient.getJson<unknown>(
        '/api/gestopago/transacciones/historial/exitosas',
        {
          queryParameters: Object.keys(queryParameters).length > 0 ? queryParameters : undefined,
        },
      );
      if (Array.isArray(response.data)) {
        return response.data
          .filter(
            (item): item is Record<string, unknown> =>
              Boolean(item) && typeof item === 'object' && !Array.isArray(item),
          )
          .map((item) => parsePurchaseTransactionResult(item))
          .filter((tx) => tx.exitoso);
      }
    } catch (error) {
      if (error instanceof ApiException) {
        if (error.statusCode === 401 || error.statusCode !== 404) {
          throw error;
        }
      } else {
        throw error;
      }
    }

    const fallbackResp = await this.apiClient.getJson<unknown>('/api/gestopago/transacciones');
    if (Array.isArray(fallbackResp.data)) {
      const cuentaLimpia = params.numeroCuenta?.trim();
      return fallbackResp.data
        .filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === 'object' && !Array.isArray(item),
        )
        .map((item) => parsePurchaseTransactionResult(item))
        .filter((tx) => {
          if (!tx.exitoso) return false;
          if (
            cuentaLimpia &&
            cuentaLimpia.length > 0 &&
            tx.numeroCuenta &&
            tx.numeroCuenta.length > 0
          ) {
            return tx.numeroCuenta === cuentaLimpia;
          }
          return true;
        });
    }
    return [];
  }

  async consultarDetallePorUpc(upc: string): Promise<PurchaseTransactionResult> {
    const response = await this.apiClient.getJson<Record<string, unknown>>(
      `/api/gestopago/transacciones/${encodeURIComponent(upc.trim())}`,
    );
    return parsePurchaseTransactionResult(response.data ?? {});
  }
}
