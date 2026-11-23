import { type FormEvent, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  DollarSign,
  KeyRound,
  Phone,
  QrCode,
  Shield,
  ShoppingBag,
} from 'lucide-react';
import { ProductVisualBadge } from '../components/ProductVisualBadge';
import { PurchaseConfirmModal } from '../components/PurchaseConfirmModal';
import { PurchaseResultReceiptCard } from '../components/PurchaseResultReceiptCard';
import { useSession } from '../context/SessionContext';
import { ApiException } from '../core/network/apiClient';
import type { CatalogProduct } from '../models/product';
import type { PurchaseTransactionResult } from '../models/transaction';
import { TransactionService } from '../services/transactionService';

export interface PurchasePageProps {
  productoOverride?: CatalogProduct;
  transactionServiceOverride?: TransactionService;
}

export function PurchasePage({
  productoOverride,
  transactionServiceOverride,
}: PurchasePageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { apiClient, sesionActual, actualizarSaldoLocal } = useSession();

  const producto =
    productoOverride ?? (location.state as { producto?: CatalogProduct } | null)?.producto ?? null;

  const service = useMemo(
    () => transactionServiceOverride ?? new TransactionService({ apiClient }),
    [transactionServiceOverride, apiClient],
  );

  const [destino, setDestino] = useState(() =>
    producto ? (producto.esRecarga ? '5512345678' : '9876543210') : '',
  );
  const [montoTexto, setMontoTexto] = useState(() =>
    producto ? (producto.precio > 0 ? producto.precio.toFixed(2) : '50.00') : '',
  );
  const [cuenta, setCuenta] = useState(
    () => sesionActual?.numeroCuenta ?? '4229215075268914',
  );
  const [codigo2FA, setCodigo2FA] = useState('');
  const [otpGenerado, setOtpGenerado] = useState<string | null>(null);
  const [correoDestinoOtp, setCorreoDestinoOtp] = useState<string | null>(null);
  const [correoEnviadoOtp, setCorreoEnviadoOtp] = useState(false);
  const [simular, setSimular] = useState(true);
  const [solicitandoOtp, setSolicitandoOtp] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [modalConfirmarAbierto, setModalConfirmarAbierto] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null);
  const [resultadoOperacion, setResultadoOperacion] =
    useState<PurchaseTransactionResult | null>(null);

  if (!producto) {
    return (
      <div className="bg-white rounded-2xl border border-borde p-8 text-center max-w-lg mx-auto shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-primario-suave text-primario flex items-center justify-center mx-auto">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">
          Selecciona un producto del catálogo para realizar una compra
        </h1>
        <p className="text-sm text-slate-600">
          Explora los productos disponibles de GestoPago para iniciar una recarga telefónica o pago
          de servicio.
        </p>
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-2 rounded-xl bg-primario px-5 py-3 text-sm font-semibold text-white hover:bg-primario-oscuro transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Ir al Catálogo de Productos</span>
        </Link>
      </div>
    );
  }

  const saldoActual = sesionActual?.saldoCuenta;
  const precioFijo = producto.precio > 0 && producto.esRecarga;

  const generarCodigoOtp = async () => {
    if (cuenta.trim().length === 0) {
      setErrorFormulario('Ingresa primero el número de cuenta bancaria.');
      return;
    }

    setSolicitandoOtp(true);
    setErrorFormulario(null);
    try {
      const resultado = await service.solicitarReto2FAParaCompra(cuenta);
      setCorreoEnviadoOtp(resultado.correoEnviado);
      setCorreoDestinoOtp(resultado.correoDestinoEnmascarado ?? null);
      if (resultado.codigoOtp.trim().length > 0) {
        setOtpGenerado(resultado.codigoOtp);
        setCodigo2FA(resultado.codigoOtp);
      } else {
        setOtpGenerado(null);
      }
    } catch (error) {
      setErrorFormulario(
        error instanceof ApiException
          ? error.message
          : 'No fue posible generar el código OTP en el servidor.',
      );
    } finally {
      setSolicitandoOtp(false);
    }
  };

  const validarFormulario = (): string | null => {
    const destinoLimpio = destino.trim();
    if (destinoLimpio.length === 0) {
      return producto.esRecarga
        ? 'Ingresa el número telefónico de 10 dígitos.'
        : 'Ingresa la referencia del servicio.';
    }
    if (producto.esRecarga && !/^[0-9]{10}$/.test(destinoLimpio)) {
      return 'El teléfono debe tener exactamente 10 dígitos numéricos.';
    }
    if (!producto.esRecarga && destinoLimpio.length < 4) {
      return 'La referencia debe contener al menos 4 caracteres.';
    }

    const monto = Number.parseFloat(montoTexto.trim());
    if (Number.isNaN(monto) || monto <= 0) {
      return 'Ingresa un monto válido mayor a $0.00.';
    }
    if (precioFijo && Math.abs(monto - producto.precio) > 0.01) {
      return `El monto para este paquete es fijo de $${producto.precio.toFixed(2)}.`;
    }
    if (saldoActual !== undefined && monto > saldoActual) {
      return `Saldo insuficiente en la cuenta ($${saldoActual.toFixed(2)} disponibles).`;
    }
    if (cuenta.trim().length === 0) {
      return 'Ingresa el número de cuenta bancaria.';
    }
    if (codigo2FA.trim().length > 0 && !/^[0-9]{6}$/.test(codigo2FA.trim())) {
      return 'El código 2FA debe contener exactamente 6 dígitos numéricos.';
    }
    return null;
  };

  const manejarContinuar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = validarFormulario();
    if (error) {
      setErrorFormulario(error);
      return;
    }
    setErrorFormulario(null);
    setModalConfirmarAbierto(true);
  };

  const ejecutarCompraConfirmada = async () => {
    const monto = Number.parseFloat(montoTexto.trim());
    setModalConfirmarAbierto(false);
    setProcesando(true);
    setErrorFormulario(null);

    try {
      const resultado = await service.procesarCompra({
        producto,
        numeroCuenta: cuenta.trim(),
        monto,
        destino: destino.trim(),
        codigo2FA: codigo2FA.trim(),
        simular,
      });

      if (resultado.exitoso && resultado.nuevoSaldoCuenta !== undefined) {
        actualizarSaldoLocal(resultado.nuevoSaldoCuenta);
      }
      setResultadoOperacion(resultado);
    } catch (error) {
      if (error instanceof ApiException && error.statusCode === 401) {
        return;
      }
      setErrorFormulario('No fue posible completar la transacción. Intenta nuevamente.');
    } finally {
      setProcesando(false);
    }
  };

  if (resultadoOperacion) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-slate-900 text-center">
          Resultado de la Operación
        </h1>
        <PurchaseResultReceiptCard
          resultado={resultadoOperacion}
          onVolverCatalogo={() => navigate('/catalogo')}
          onVerHistorial={resultadoOperacion.exitoso ? () => navigate('/historial') : undefined}
          onReintentar={() => setResultadoOperacion(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/catalogo')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo</span>
        </button>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900">
          Realizar Compra GestoPago
        </h1>
      </div>

      <div className="bg-white rounded-2xl border border-borde p-6 shadow-xs space-y-5">
        <div className="rounded-xl bg-primario-suave/60 border border-primario/20 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <ProductVisualBadge producto={producto} size="md" />
            <div className="min-w-0">
              <p className="text-base font-bold text-slate-900 truncate">{producto.nombre}</p>
              <p className="text-xs text-slate-600 truncate">
                {producto.servicio} • ID #{producto.idProducto}
              </p>
            </div>
          </div>
          {saldoActual !== undefined && (
            <span className="shrink-0 px-3 py-1 rounded-full bg-white border border-borde text-xs font-bold text-primario-oscuro">
              Saldo: ${saldoActual.toFixed(2)}
            </span>
          )}
        </div>

        <form noValidate onSubmit={manejarContinuar} className="space-y-4">
          <div>
            <label htmlFor="destino" className="block text-sm font-semibold text-slate-700 mb-1.5">
              {producto.esRecarga
                ? 'Número telefónico (10 dígitos)'
                : 'Referencia de pago del servicio'}
            </label>
            <div className="relative">
              {producto.esRecarga ? (
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              ) : (
                <QrCode className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              )}
              <input
                id="destino"
                type={producto.esRecarga ? 'tel' : 'text'}
                maxLength={producto.esRecarga ? 10 : 40}
                placeholder={producto.esRecarga ? '5512345678' : 'Referencia de recibo'}
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                className="w-full rounded-xl border border-borde bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="monto" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Importe de la operación (MXN)
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="monto"
                type="number"
                step="0.01"
                value={montoTexto}
                onChange={(e) => setMontoTexto(e.target.value)}
                className="w-full rounded-xl border border-borde bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cuenta" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Cuenta bancaria de cargo
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="cuenta"
                type="text"
                value={cuenta}
                onChange={(e) => setCuenta(e.target.value)}
                className="w-full rounded-xl border border-borde bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="codigo-2fa-compra"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Código 2FA OTP (6 dígitos)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="codigo-2fa-compra"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Solicita o ingresa tu OTP"
                  value={codigo2FA}
                  onChange={(e) =>
                    setCodigo2FA(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))
                  }
                  className="w-full rounded-xl border border-borde bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>
              <button
                type="button"
                disabled={solicitandoOtp || procesando}
                onClick={() => void generarCodigoOtp()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primario-suave px-4 py-2.5 text-xs sm:text-sm font-bold text-primario-oscuro hover:bg-primario hover:text-white disabled:opacity-50 transition-colors cursor-pointer shrink-0"
              >
                <KeyRound className="w-4 h-4" />
                <span>{solicitandoOtp ? 'Generando...' : 'Generar OTP'}</span>
              </button>
            </div>
            {otpGenerado && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Código OTP generado en el servidor y autocompletado: {otpGenerado}
                </span>
              </p>
            )}
            {correoEnviadoOtp && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-primario-oscuro">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-primario" />
                <span>
                  Código de autorización enviado al correo{' '}
                  <strong>{correoDestinoOtp ?? sesionActual?.correo ?? 'registrado'}</strong>.
                </span>
              </p>
            )}
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-borde bg-fondo/50 p-3.5 cursor-pointer">
            <input
              type="checkbox"
              checked={simular}
              onChange={(e) => setSimular(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primario rounded"
            />
            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                Modo evaluación bancaria (Evitar bloqueo de IP de GestoPago)
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Ejecuta validación real en BD, 2FA, descuento atómico de saldo y registro de
                transacción.
              </p>
            </div>
          </label>

          {errorFormulario && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start gap-2 text-sm text-red-800"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorFormulario}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={procesando}
            className="w-full rounded-xl bg-primario px-4 py-3.5 text-sm font-semibold text-white hover:bg-primario-oscuro disabled:opacity-60 transition-colors cursor-pointer"
          >
            {procesando ? 'Procesando en GestoPago...' : 'Continuar a Confirmación'}
          </button>
        </form>
      </div>

      <PurchaseConfirmModal
        abierto={modalConfirmarAbierto}
        producto={producto}
        destino={destino.trim()}
        cuenta={cuenta.trim()}
        monto={Number.parseFloat(montoTexto.trim()) || 0}
        procesando={procesando}
        onCancel={() => setModalConfirmarAbierto(false)}
        onConfirm={() => void ejecutarCompraConfirmada()}
      />
    </div>
  );
}
