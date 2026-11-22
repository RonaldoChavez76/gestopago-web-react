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

export class TransactionService {
  private readonly apiClient: ApiClient;

  constructor(options: { apiClient: ApiClient }) {
    this.apiClient = options.apiClient;
  }

  async solicitarCodigo2FAParaCompra(numeroCuenta: string): Promise<string> {
    const response = await this.apiClient.postJson<Record<string, unknown>>(
      '/api/seguridad/2fa/solicitar',
      {
        body: { numeroCuenta: numeroCuenta.trim() },
      },
    );
    const data = response.data ?? {};
    return String(data.codigoOtp ?? '');
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
}
