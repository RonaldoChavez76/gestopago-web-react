import { describe, expect, it } from 'vitest';
import { parseCatalogProduct } from '../models/product';
import { parsePurchaseTransactionResult } from '../models/transaction';

describe('Modelos de Producto y Transacción', () => {
  it('clasifica correctamente productos en las 3 categorias de GestoPago', () => {
    const recarga = parseCatalogProduct({
      idProducto: 582,
      idServicio: 133,
      producto: 'Recarga Telcel $50',
      servicio: 'Telcel',
      precio: '50.00',
      tipoFront: '1',
      active: true,
    });
    expect(recarga.categoria).toBe('Recargas Telefónicas');
    expect(recarga.esRecarga).toBe(true);
    expect(recarga.precio).toBe(50);

    const servicio = parseCatalogProduct({
      idProducto: 701,
      idServicio: 76,
      producto: 'Pago Recibo CFE',
      servicio: 'CFE Electricidad',
      precio: 0,
      tipoFront: '2',
      disponible: true,
    });
    expect(servicio.categoria).toBe('Pago de Servicios');
    expect(servicio.esRecarga).toBe(false);

    const pin = parseCatalogProduct({
      idProducto: 905,
      idServicio: 210,
      producto: 'Tarjeta Netflix $300',
      precio: 300,
      tipoFront: '4',
    });
    expect(pin.categoria).toBe('Entretenimiento y Pines');
    expect(pin.esRecarga).toBe(false);
  });

  it('mapea los 4 estados de transaccion de compra requeridos', () => {
    const exitosa = parsePurchaseTransactionResult({
      upc: 'TX1A9001',
      estado: 'EXITOSA',
      exitoso: true,
      mensaje: 'Operación realizada con éxito',
      monto: 50,
      idTx: '826364546',
    });
    expect(exitosa.estadoVisual).toBe('exitosa');
    expect(exitosa.exitoso).toBe(true);

    const rechazada = parsePurchaseTransactionResult({
      upc: 'TX1A9002',
      estado: 'RECHAZADA',
      exitoso: false,
      mensaje: 'Saldo insuficiente',
      monto: 50,
    });
    expect(rechazada.estadoVisual).toBe('rechazada');
    expect(rechazada.exitoso).toBe(false);

    const pendiente = parsePurchaseTransactionResult({
      upc: 'TX1A9003',
      estado: 'PENDIENTE',
      exitoso: false,
      mensaje: 'Esperando confirmación del proveedor',
      monto: 50,
    });
    expect(pendiente.estadoVisual).toBe('pendiente');
    expect(pendiente.exitoso).toBe(false);

    const errorCom = parsePurchaseTransactionResult({
      upc: 'TX1A9004',
      estado: 'ERROR_COMUNICACION',
      exitoso: false,
      mensaje: 'No fue posible contactar a GestoPago',
      monto: 50,
    });
    expect(errorCom.estadoVisual).toBe('errorComunicacion');
    expect(errorCom.exitoso).toBe(false);
  });
});
