import { useEffect, useState } from 'react';
import { Gift, ReceiptText, Smartphone, Wifi, Zap } from 'lucide-react';
import type { CatalogProduct } from '../models/product';

export interface ProductVisualBadgeProps {
  producto: CatalogProduct;
  size?: 'md' | 'lg';
}

interface VisualStyle {
  containerClass: string;
  tipoIcono: 'smartphone' | 'gift' | 'zap' | 'wifi' | 'receipt';
}

function resolverEstiloVisual(producto: CatalogProduct): VisualStyle {
  const upper = `${producto.nombre} ${producto.servicio}`.toUpperCase();

  if (producto.categoria === 'Entretenimiento y Pines') {
    return {
      containerClass: 'bg-purple-50 text-purple-700 border-purple-200',
      tipoIcono: 'gift',
    };
  }

  if (producto.categoria === 'Recargas Telefónicas') {
    if (upper.includes('TELCEL') || upper.includes('AMIGO')) {
      return {
        containerClass: 'bg-sky-50 text-sky-700 border-sky-200',
        tipoIcono: 'smartphone',
      };
    }
    if (upper.includes('MOVISTAR')) {
      return {
        containerClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        tipoIcono: 'smartphone',
      };
    }
    if (upper.includes('AT&T') || upper.includes('ATT') || upper.includes('UNEFON')) {
      return {
        containerClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        tipoIcono: 'smartphone',
      };
    }
    if (upper.includes('BAIT')) {
      return {
        containerClass: 'bg-amber-50 text-amber-700 border-amber-200',
        tipoIcono: 'smartphone',
      };
    }
    return {
      containerClass: 'bg-primario-suave text-primario border-primario/20',
      tipoIcono: 'smartphone',
    };
  }

  if (upper.includes('CFE') || upper.includes('LUZ')) {
    return {
      containerClass: 'bg-amber-50 text-amber-700 border-amber-200',
      tipoIcono: 'zap',
    };
  }

  if (
    upper.includes('TELMEX') ||
    upper.includes('IZZI') ||
    upper.includes('TOTALPLAY') ||
    upper.includes('SKY')
  ) {
    return {
      containerClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      tipoIcono: 'wifi',
    };
  }

  return {
    containerClass: 'bg-primario-suave text-primario border-primario/20',
    tipoIcono: 'receipt',
  };
}

export function ProductVisualBadge({ producto, size = 'md' }: ProductVisualBadgeProps) {
  const { containerClass, tipoIcono } = resolverEstiloVisual(producto);
  const [errorCarga, setErrorCarga] = useState(false);

  useEffect(() => {
    setErrorCarga(false);
  }, [producto.logoUrl]);

  const sizeClass = size === 'lg' ? 'w-14 h-14 rounded-2xl' : 'w-12 h-12 rounded-xl';
  const iconClass = size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';

  if (producto.logoUrl && !errorCarga) {
    return (
      <div
        className={`shrink-0 flex items-center justify-center border border-borde bg-white p-1.5 overflow-hidden ${sizeClass}`}
      >
        <img
          src={producto.logoUrl}
          alt={`Logo de ${producto.servicio}`}
          loading="lazy"
          decoding="async"
          onError={() => setErrorCarga(true)}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`shrink-0 flex items-center justify-center border ${sizeClass} ${containerClass}`}
    >
      {tipoIcono === 'smartphone' && <Smartphone className={iconClass} />}
      {tipoIcono === 'gift' && <Gift className={iconClass} />}
      {tipoIcono === 'zap' && <Zap className={iconClass} />}
      {tipoIcono === 'wifi' && <Wifi className={iconClass} />}
      {tipoIcono === 'receipt' && <ReceiptText className={iconClass} />}
    </div>
  );
}
