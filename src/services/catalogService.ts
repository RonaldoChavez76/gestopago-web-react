import { ApiClient, ApiException } from '../core/network/apiClient';
import { type CatalogProduct, parseCatalogProduct } from '../models/product';

function extraerListaProductos(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === 'object' && !Array.isArray(item),
    );
  }
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) {
      return extraerListaProductos(obj.data);
    }
    if (Array.isArray(obj.productos)) {
      return extraerListaProductos(obj.productos);
    }
  }
  return [];
}

export class CatalogService {
  private readonly apiClient: ApiClient;

  constructor(options: { apiClient: ApiClient }) {
    this.apiClient = options.apiClient;
  }

  async obtenerCatalogoProductos(): Promise<CatalogProduct[]> {
    try {
      const response = await this.apiClient.getJson<unknown>('/productos');
      const items = extraerListaProductos(response.data);
      if (items.length > 0) {
        return items.map(parseCatalogProduct);
      }
    } catch (error) {
      if (error instanceof ApiException && error.statusCode === 401) {
        throw error;
      }
    }

    const catalogResponse = await this.apiClient.getJson<unknown>('/api/gestopago/catalogo');
    const items = extraerListaProductos(catalogResponse.data);
    return items.map(parseCatalogProduct);
  }
}
