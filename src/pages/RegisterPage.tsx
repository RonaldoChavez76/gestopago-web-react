import { type FormEvent, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  MapPin,
  Shield,
  UserPlus,
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { ApiException } from '../core/network/apiClient';
import {
  type RegistroClienteForm,
  type RegistroClienteResultado,
  crearFormularioRegistroInicial,
  validarFormularioRegistro,
} from '../models/cliente';
import { ClienteService } from '../services/clienteService';

export interface RegisterPageProps {
  clienteServiceOverride?: ClienteService;
}

export function RegisterPage({ clienteServiceOverride }: RegisterPageProps) {
  const navigate = useNavigate();
  const { apiClient, estaAutenticado } = useSession();

  const service = useMemo(
    () => clienteServiceOverride ?? new ClienteService({ apiClient }),
    [clienteServiceOverride, apiClient],
  );

  const [form, setForm] = useState<RegistroClienteForm>(() => crearFormularioRegistroInicial());
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [registroExitoso, setRegistroExitoso] = useState<RegistroClienteResultado | null>(null);

  if (estaAutenticado) {
    return <Navigate to="/" replace />;
  }

  const actualizarCampo = <K extends keyof RegistroClienteForm>(
    campo: K,
    valor: RegistroClienteForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const actualizarDomicilio = (
    campo: keyof RegistroClienteForm['domicilio'],
    valor: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      domicilio: { ...prev.domicilio, [campo]: valor },
    }));
  };

  const manejarSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMensaje(null);

    const err = validarFormularioRegistro(form);
    if (err) {
      setErrorMensaje(err);
      return;
    }

    setCargando(true);
    try {
      const resultado = await service.registrarCliente(form);
      setRegistroExitoso(resultado);
    } catch (error) {
      setErrorMensaje(
        error instanceof ApiException
          ? error.message
          : 'No fue posible completar el registro del cliente.',
      );
    } finally {
      setCargando(false);
    }
  };

  if (registroExitoso) {
    return (
      <div className="min-h-screen bg-fondo flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-2xl border border-borde p-7 shadow-xs text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">¡Cuenta Registrada!</h1>
            <p className="text-sm text-slate-600 mt-1.5">
              Tu perfil y cuenta bancaria digital fueron dados de alta correctamente en GestoPago.
            </p>
          </div>

          <div className="rounded-xl bg-fondo border border-borde p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Correo registrado:</span>
              <span className="font-semibold text-slate-900">{registroExitoso.correo}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Número de cuenta:</span>
              <span className="font-bold text-primario-oscuro">{registroExitoso.numeroCuenta}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate('/login', {
                replace: true,
                state: {
                  correoRegistrado: registroExitoso.correo,
                  cuentaRegistrada: registroExitoso.numeroCuenta,
                },
              })
            }
            className="w-full rounded-xl bg-primario px-4 py-3.5 text-sm font-semibold text-white hover:bg-primario-oscuro transition-colors cursor-pointer"
          >
            Ir a Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fondo py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Login</span>
          </Link>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-primario-suave text-primario flex items-center justify-center mb-3 shadow-xs">
            <UserPlus className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Crear Cuenta en GestoPago</h1>
          <p className="text-sm text-slate-600 mt-1">
            Completa tus datos fiscales, personales y de contacto para abrir tu cuenta con 2FA.
          </p>
        </div>

        <form
          noValidate
          onSubmit={(e) => void manejarSubmit(e)}
          className="bg-white rounded-2xl border border-borde p-6 shadow-xs space-y-6"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-borde pb-2.5">
              <Shield className="w-4 h-4 text-primario" />
              <h2 className="text-base font-bold text-slate-900">Datos Personales e Identificación</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="reg-primer-nombre" className="block text-xs font-semibold text-slate-700 mb-1">
                  Primer nombre *
                </label>
                <input
                  id="reg-primer-nombre"
                  type="text"
                  value={form.primerNombre}
                  onChange={(e) => actualizarCampo('primerNombre', e.target.value)}
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div>
                <label htmlFor="reg-segundo-nombre" className="block text-xs font-semibold text-slate-700 mb-1">
                  Segundo nombre
                </label>
                <input
                  id="reg-segundo-nombre"
                  type="text"
                  value={form.segundoNombre}
                  onChange={(e) => actualizarCampo('segundoNombre', e.target.value)}
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div>
                <label htmlFor="reg-apellido-paterno" className="block text-xs font-semibold text-slate-700 mb-1">
                  Apellido paterno *
                </label>
                <input
                  id="reg-apellido-paterno"
                  type="text"
                  value={form.apellidoPaterno}
                  onChange={(e) => actualizarCampo('apellidoPaterno', e.target.value)}
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div>
                <label htmlFor="reg-apellido-materno" className="block text-xs font-semibold text-slate-700 mb-1">
                  Apellido materno *
                </label>
                <input
                  id="reg-apellido-materno"
                  type="text"
                  value={form.apellidoMaterno}
                  onChange={(e) => actualizarCampo('apellidoMaterno', e.target.value)}
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div>
                <label htmlFor="reg-curp" className="block text-xs font-semibold text-slate-700 mb-1">
                  CURP (18 caracteres) *
                </label>
                <input
                  id="reg-curp"
                  type="text"
                  maxLength={18}
                  value={form.curp}
                  onChange={(e) => actualizarCampo('curp', e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm uppercase text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div>
                <label htmlFor="reg-rfc" className="block text-xs font-semibold text-slate-700 mb-1">
                  RFC (12-13 caracteres) *
                </label>
                <input
                  id="reg-rfc"
                  type="text"
                  maxLength={13}
                  value={form.rfc}
                  onChange={(e) => actualizarCampo('rfc', e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm uppercase text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div>
                <label htmlFor="reg-fecha-nac" className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha nacimiento *
                </label>
                <input
                  id="reg-fecha-nac"
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={(e) => actualizarCampo('fechaNacimiento', e.target.value)}
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div>
                <label htmlFor="reg-sexo" className="block text-xs font-semibold text-slate-700 mb-1">
                  Sexo *
                </label>
                <select
                  id="reg-sexo"
                  value={form.sexo}
                  onChange={(e) => actualizarCampo('sexo', e.target.value)}
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                >
                  <option value="MASCULINO">MASCULINO</option>
                  <option value="FEMENINO">FEMENINO</option>
                  <option value="OTRO">OTRO</option>
                </select>
              </div>

              <div>
                <label htmlFor="reg-estado-civil" className="block text-xs font-semibold text-slate-700 mb-1">
                  Estado civil *
                </label>
                <select
                  id="reg-estado-civil"
                  value={form.estadoCivil}
                  onChange={(e) => actualizarCampo('estadoCivil', e.target.value)}
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                >
                  <option value="Soltero">Soltero</option>
                  <option value="Soltera">Soltera</option>
                  <option value="Casado">Casado</option>
                  <option value="Casada">Casada</option>
                  <option value="Divorciado">Divorciado</option>
                  <option value="Viudo">Viudo</option>
                  <option value="Union libre">Unión libre</option>
                </select>
              </div>

              <div>
                <label htmlFor="reg-nacionalidad" className="block text-xs font-semibold text-slate-700 mb-1">
                  Nacionalidad *
                </label>
                <input
                  id="reg-nacionalidad"
                  type="text"
                  value={form.nacionalidad}
                  onChange={(e) => actualizarCampo('nacionalidad', e.target.value)}
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="reg-correo" className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo electrónico *
                </label>
                <input
                  id="reg-correo"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={form.correo}
                  onChange={(e) => actualizarCampo('correo', e.target.value)}
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div>
                <label htmlFor="reg-tel-movil" className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono móvil (10 dígitos) *
                </label>
                <input
                  id="reg-tel-movil"
                  type="tel"
                  maxLength={10}
                  value={form.telefonoMovil}
                  onChange={(e) => actualizarCampo('telefonoMovil', e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div>
                <label htmlFor="reg-tel-alt" className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono alternativo
                </label>
                <input
                  id="reg-tel-alt"
                  type="tel"
                  maxLength={10}
                  value={form.telefonoAlternativo}
                  onChange={(e) =>
                    actualizarCampo('telefonoAlternativo', e.target.value.replace(/[^0-9]/g, ''))
                  }
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div>
                <label htmlFor="reg-ocupacion" className="block text-xs font-semibold text-slate-700 mb-1">
                  Ocupación *
                </label>
                <input
                  id="reg-ocupacion"
                  type="text"
                  value={form.ocupacion}
                  onChange={(e) => actualizarCampo('ocupacion', e.target.value)}
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div>
                <label htmlFor="reg-empresa" className="block text-xs font-semibold text-slate-700 mb-1">
                  Empresa *
                </label>
                <input
                  id="reg-empresa"
                  type="text"
                  value={form.empresa}
                  onChange={(e) => actualizarCampo('empresa', e.target.value)}
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div>
                <label htmlFor="reg-ingreso" className="block text-xs font-semibold text-slate-700 mb-1">
                  Ingreso mensual (MXN) *
                </label>
                <input
                  id="reg-ingreso"
                  type="number"
                  step="0.01"
                  value={form.ingresoMensual}
                  onChange={(e) => actualizarCampo('ingresoMensual', e.target.value)}
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-borde pb-2.5">
              <MapPin className="w-4 h-4 text-primario" />
              <h2 className="text-base font-bold text-slate-900">Domicilio</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="reg-calle" className="block text-xs font-semibold text-slate-700 mb-1">
                  Calle *
                </label>
                <input
                  id="reg-calle"
                  type="text"
                  value={form.domicilio.calle}
                  onChange={(e) => actualizarDomicilio('calle', e.target.value)}
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div>
                <label htmlFor="reg-num-ext" className="block text-xs font-semibold text-slate-700 mb-1">
                  Número exterior *
                </label>
                <input
                  id="reg-num-ext"
                  type="text"
                  value={form.domicilio.numeroExterior}
                  onChange={(e) => actualizarDomicilio('numeroExterior', e.target.value)}
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div>
                <label htmlFor="reg-num-int" className="block text-xs font-semibold text-slate-700 mb-1">
                  Número interior
                </label>
                <input
                  id="reg-num-int"
                  type="text"
                  value={form.domicilio.numeroInterior}
                  onChange={(e) => actualizarDomicilio('numeroInterior', e.target.value)}
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div>
                <label htmlFor="reg-colonia" className="block text-xs font-semibold text-slate-700 mb-1">
                  Colonia *
                </label>
                <input
                  id="reg-colonia"
                  type="text"
                  value={form.domicilio.colonia}
                  onChange={(e) => actualizarDomicilio('colonia', e.target.value)}
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div>
                <label htmlFor="reg-municipio" className="block text-xs font-semibold text-slate-700 mb-1">
                  Municipio / Alcaldía *
                </label>
                <input
                  id="reg-municipio"
                  type="text"
                  value={form.domicilio.municipio}
                  onChange={(e) => actualizarDomicilio('municipio', e.target.value)}
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div>
                <label htmlFor="reg-estado" className="block text-xs font-semibold text-slate-700 mb-1">
                  Estado *
                </label>
                <input
                  id="reg-estado"
                  type="text"
                  value={form.domicilio.estado}
                  onChange={(e) => actualizarDomicilio('estado', e.target.value)}
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-cp" className="block text-xs font-semibold text-slate-700 mb-1">
                    C.P. *
                  </label>
                  <input
                    id="reg-cp"
                    type="text"
                    maxLength={5}
                    value={form.domicilio.codigoPostal}
                    onChange={(e) =>
                      actualizarDomicilio('codigoPostal', e.target.value.replace(/[^0-9]/g, ''))
                    }
                    className="w-full rounded-xl border border-borde bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                  />
                </div>

                <div>
                  <label htmlFor="reg-pais" className="block text-xs font-semibold text-slate-700 mb-1">
                    País *
                  </label>
                  <input
                    id="reg-pais"
                    type="text"
                    value={form.domicilio.pais}
                    onChange={(e) => actualizarDomicilio('pais', e.target.value)}
                    className="w-full rounded-xl border border-borde bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-borde pb-2.5">
              <Lock className="w-4 h-4 text-primario" />
              <h2 className="text-base font-bold text-slate-900">Contraseña de Acceso</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-700 mb-1">
                  Contraseña *
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={mostrarPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => actualizarCampo('password', e.target.value)}
                    className="w-full rounded-xl border border-borde bg-white px-3.5 pr-10 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                  />
                  <button
                    type="button"
                    aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setMostrarPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo.
                </p>
              </div>

              <div>
                <label htmlFor="reg-confirmar-password" className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmar contraseña *
                </label>
                <input
                  id="reg-confirmar-password"
                  type={mostrarPassword ? 'text' : 'password'}
                  value={form.confirmarPassword}
                  onChange={(e) => actualizarCampo('confirmarPassword', e.target.value)}
                  className="w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/20"
                />
              </div>
            </div>
          </div>

          {errorMensaje && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start gap-2.5 text-sm text-red-800"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMensaje}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <Link
              to="/login"
              className="text-sm font-semibold text-primario hover:text-primario-oscuro text-center"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
            <button
              type="submit"
              disabled={cargando}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primario px-6 py-3.5 text-sm font-semibold text-white hover:bg-primario-oscuro disabled:opacity-60 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{cargando ? 'Creando cuenta...' : 'Registrar Cuenta'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
